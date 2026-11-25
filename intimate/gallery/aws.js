/* Minimal AWS client for the gallery page — no SDK, no build step.
   - Cognito Identity: GetId / GetCredentialsForIdentity (guest or logged-in admin)
   - S3: SigV4-signed PUT (guest upload) and DELETE (admin)
   - Cognito hosted login: authorization code + PKCE
   Works in browsers and in Node >= 20 (WebCrypto), which is how it is tested. */

const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async data => hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data));
async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? enc.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc.encode(data));
}
// RFC 3986 encoding as S3 expects for each path segment
const uriEncode = s => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

/**
 * Sign an S3 request (header auth, UNSIGNED-PAYLOAD — allowed for S3 over HTTPS).
 * Returns the headers to send (Host is set by the browser and is signed here).
 */
export async function signS3({ method, bucket, region, key, headers = {}, credentials, now = new Date() }) {
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const day = amzDate.slice(0, 8);
  const path = '/' + key.split('/').map(uriEncode).join('/');

  const all = {
    ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()])),
    host,
    'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
    'x-amz-date': amzDate
  };
  if (credentials.sessionToken) all['x-amz-security-token'] = credentials.sessionToken;
  const names = Object.keys(all).sort();
  const canonicalHeaders = names.map(n => `${n}:${all[n]}\n`).join('');
  const signedHeaders = names.join(';');
  const canonicalRequest = [method, path, '', canonicalHeaders, signedHeaders, 'UNSIGNED-PAYLOAD'].join('\n');

  const scope = `${day}/${region}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, await sha256(canonicalRequest)].join('\n');
  let k = await hmac('AWS4' + credentials.secretAccessKey, day);
  k = await hmac(k, region);
  k = await hmac(k, 's3');
  k = await hmac(k, 'aws4_request');
  const signature = hex(await hmac(k, stringToSign));

  const out = { ...all,
    authorization: `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}` };
  delete out.host; // forbidden header in fetch; the browser sends the same value
  return { url: `https://${host}${path}`, headers: out };
}

/* ---------- Cognito Identity (unsigned JSON API) ---------- */
async function cognitoIdentity(region, target, body) {
  const res = await fetch(`https://cognito-identity.${region}.amazonaws.com/`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-amz-json-1.1', 'x-amz-target': `AWSCognitoIdentityService.${target}` },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.message || json.__type || `Cognito ${target} failed`), { type: json.__type });
  return json;
}

/**
 * Temporary credentials for this browser. `logins` = {} for a guest, or
 * { 'cognito-idp.<region>.amazonaws.com/<poolId>': idToken } for the admin.
 * The guest identity id is cached so one browser = one identity.
 */
export async function getCredentials({ region, identityPoolId, logins = {}, cacheKey = 'gallery-identity' }) {
  const authed = Object.keys(logins).length > 0;
  let identityId = authed ? null : localStorage.getItem(cacheKey);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (!identityId) {
        identityId = (await cognitoIdentity(region, 'GetId', { IdentityPoolId: identityPoolId, Logins: logins })).IdentityId;
        if (!authed) localStorage.setItem(cacheKey, identityId);
      }
      const { Credentials: c } = await cognitoIdentity(region, 'GetCredentialsForIdentity', { IdentityId: identityId, Logins: logins });
      return {
        accessKeyId: c.AccessKeyId, secretAccessKey: c.SecretKey, sessionToken: c.SessionToken,
        expiration: new Date(c.Expiration * 1000)
      };
    } catch (e) {
      if (!authed && attempt === 0 && /ResourceNotFound|NotAuthorized/.test(e.type || '')) {
        localStorage.removeItem(cacheKey); identityId = null; continue; // stale cached identity
      }
      throw e;
    }
  }
}

/* ---------- Hosted login (authorization code + PKCE) ---------- */
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function startLogin({ domain, clientId, redirectUri }) {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  sessionStorage.setItem('gallery-pkce', JSON.stringify({ verifier, state }));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', enc.encode(verifier)));
  const q = new URLSearchParams({
    response_type: 'code', client_id: clientId, redirect_uri: redirectUri,
    scope: 'openid email', state, code_challenge: challenge, code_challenge_method: 'S256'
  });
  location.assign(`https://${domain}/oauth2/authorize?${q}`);
}

/** Exchange ?code=… for tokens. Returns the id_token, or null when this is not a login callback. */
export async function finishLogin({ domain, clientId, redirectUri }) {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (!code) return null;
  const saved = JSON.parse(sessionStorage.getItem('gallery-pkce') || 'null');
  sessionStorage.removeItem('gallery-pkce');
  history.replaceState(null, '', location.pathname + location.hash); // drop ?code from the URL
  if (!saved || saved.state !== params.get('state')) throw new Error('Phiên đăng nhập không hợp lệ, vui lòng thử lại.');
  const res = await fetch(`https://${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code', client_id: clientId, code, redirect_uri: redirectUri, code_verifier: saved.verifier
    })
  });
  if (!res.ok) throw new Error('Đăng nhập thất bại.');
  return (await res.json()).id_token;
}

export function logoutUrl({ domain, clientId, redirectUri }) {
  return `https://${domain}/logout?${new URLSearchParams({ client_id: clientId, logout_uri: redirectUri })}`;
}

/** exp claim of a JWT (no verification needed: AWS verifies it server-side). */
export const tokenExpiry = jwt => {
  try { return new Date(JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000); }
  catch { return new Date(0); }
};
