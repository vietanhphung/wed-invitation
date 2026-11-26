/* Shared wedding album — used by two pages:
   intimate/gallery/  (album link)  carousel + album grid; admin: "Quản trị" -> Cognito login -> delete
   intimate/upload/   (QR code)     the same page plus the upload button: temporary upload-only credentials
                                    from the Cognito identity pool -> S3 original/<uuid>.<ext>
                                    -> Lambda -> gallery/<uuid>.webp
   What runs depends on which elements the page contains (see "start" below). */
import { signS3, getCredentials, startLogin, finishLogin, logoutUrl, tokenExpiry } from './aws.js';

const C = window.GALLERY || {};
const $ = s => document.querySelector(s);
const configured = !!(C.region && C.identityPoolId && C.bucket && C.cdnDomain);
const adminConfigured = configured && !!(C.cognito?.domain && C.cognito?.clientId && C.cognito?.userPoolId);
const cdn = `https://${C.cdnDomain}`;
const manifestUrl = `${cdn}/${C.photoPrefix}index.json`;
const maxBytes = (C.maxUploadMb || 30) * 1024 * 1024;

// The login must return to the exact URL registered in Cognito.
const redirectUri = (() => {
  const here = location.origin + location.pathname.replace(/index\.html$/, '');
  try { return C.galleryUrl && new URL(C.galleryUrl).origin === location.origin ? C.galleryUrl : here; }
  catch { return here; }
})();
const loginCfg = { domain: C.cognito?.domain, clientId: C.cognito?.clientId, redirectUri };
const loginKey = C.cognito ? `cognito-idp.${C.region}.amazonaws.com/${C.cognito.userPoolId}` : '';

let photos = [];
let idToken = null;          // admin only
let creds = null;            // current temporary AWS credentials
let credsFor = null;         // 'guest' | 'admin'

/* ---------- small UI helpers ---------- */
const make = (tag, props = {}) => Object.assign(document.createElement(tag), props);
function notice(text) {
  const n = $('#notice');
  n.textContent = text || '';
  n.hidden = !text;
}
const status = text => { $('#upload-status').textContent = text; };

/* ---------- credentials ---------- */
async function credentials(kind) {
  const fresh = creds && credsFor === kind && creds.expiration - Date.now() > 5 * 60e3;
  if (fresh) return creds;
  const logins = kind === 'admin' ? { [loginKey]: idToken } : {};
  creds = await getCredentials({ region: C.region, identityPoolId: C.identityPoolId, logins });
  credsFor = kind;
  return creds;
}

/* ---------- gallery ---------- */
async function loadManifest() {
  try {
    const res = await fetch(manifestUrl, { cache: 'no-store' });
    if (res.status === 403 || res.status === 404) return []; // nothing processed yet
    if (!res.ok) throw new Error(res.status);
    return (await res.json()).photos || [];
  } catch {
    return null; // keep what is on screen
  }
}

/* Album grid: thumbnails, shown in batches, updated in place.
   - Tiles use gallery/thumb/<id>.webp (~20-40 KB); the lightbox opens the 1600 px photo.
   - Only BATCH tiles are built at first; more are appended as the guest nears the bottom.
   - On refresh, new photos are prepended and deleted ones removed — nothing else is rebuilt,
     so scrolling and loaded images are not disturbed during the party. */
const BATCH = 60;
const tiles = new Map(); // key -> <li>, always the first tiles.size photos of `photos`
const thumbUrl = p => `${cdn}/${p.thumb || p.key}`;

function tile(p) {
  const li = make('li', { className: 'g-tile' });
  li.dataset.key = p.key;
  const btn = make('button', { type: 'button', className: 'g-open', ariaLabel: 'Xem ảnh' });
  const img = make('img', { src: thumbUrl(p), alt: '', loading: 'lazy', decoding: 'async' });
  img.addEventListener('error', () => { if (img.src !== `${cdn}/${p.key}`) img.src = `${cdn}/${p.key}`; }, { once: true });
  btn.appendChild(img);
  btn.addEventListener('click', () => openLightbox(photos.findIndex(x => x.key === p.key)));
  li.appendChild(btn);
  if (idToken) {
    const del = make('button', { type: 'button', className: 'g-del', ariaLabel: 'Xoá ảnh', textContent: 'Xoá' });
    del.addEventListener('click', () => removePhoto(p, li, del));
    li.appendChild(del);
  }
  tiles.set(p.key, li);
  return li;
}

function updateMeta() {
  $('#empty').hidden = photos.length > 0;
  $('#photo-count').textContent = photos.length ? `· ${photos.length}` : '';
}

// Full rebuild: first load, entering/leaving admin mode. Keeps how far the guest had scrolled.
function render() {
  const count = Math.min(Math.max(tiles.size, BATCH), photos.length);
  tiles.clear();
  $('#grid').replaceChildren(...photos.slice(0, count).map(tile));
  updateMeta();
}

function showMore() {
  const next = photos.slice(tiles.size, tiles.size + BATCH);
  if (next.length) $('#grid').append(...next.map(tile));
}

// Incremental update from a fresh manifest.
function update(list) {
  const keep = new Set(list.map(p => p.key));
  for (const [key, li] of tiles) if (!keep.has(key)) { li.remove(); tiles.delete(key); }
  const known = new Set(photos.map(p => p.key));
  const added = list.filter(p => !known.has(p.key)); // newest first, so they go on top
  photos = list;
  const grid = $('#grid');
  for (const p of [...added].reverse()) grid.prepend(tile(p));
  for (const p of list) { // thumbnails that appeared later (backfill)
    const img = p.thumb && tiles.get(p.key)?.querySelector('img');
    if (img && img.src.endsWith(p.key)) img.src = thumbUrl(p);
  }
  updateMeta();
  return added.length > 0;
}

async function refresh() {
  const list = await loadManifest();
  if (!list) return false;
  if (!tiles.size && !photos.length) { photos = list; render(); return list.length > 0; }
  return update(list);
}

// Append the next batch when the guest scrolls near the end of what is built.
function setupInfiniteScroll() {
  const sentinel = make('div', { className: 'g-more' });
  sentinel.setAttribute('aria-hidden', 'true');
  $('#grid').after(sentinel);
  const near = () => sentinel.getBoundingClientRect().top < innerHeight + 1200;
  const fill = () => { while (tiles.size < photos.length && near()) showMore(); };
  new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) fill(); },
    { rootMargin: '1200px 0px' }).observe(sentinel);
  addEventListener('resize', fill, { passive: true });
}

/* ---------- upload ---------- */
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic',
  'image/heif': 'heif', 'image/gif': 'gif', 'image/avif': 'avif', 'image/tiff': 'tif' };
const extFor = f => EXT[f.type] || (f.name.match(/\.([a-z0-9]{1,5})$/i)?.[1] || 'jpg').toLowerCase();

async function uploadOne(file) {
  const c = await credentials('guest');
  const key = `${C.originalPrefix}${crypto.randomUUID()}.${extFor(file)}`;
  const { url, headers } = await signS3({
    method: 'PUT', bucket: C.bucket, region: C.region, key, credentials: c,
    headers: { 'content-type': file.type || 'application/octet-stream' }
  });
  const res = await fetch(url, { method: 'PUT', headers, body: file });
  if (!res.ok) throw new Error(`S3 ${res.status}`);
}

async function uploadAll(files) {
  const list = [...files];
  const tooBig = list.filter(f => f.size > maxBytes);
  const notImage = list.filter(f => f.type && !f.type.startsWith('image/'));
  const ok = list.filter(f => !tooBig.includes(f) && !notImage.includes(f));
  if (!ok.length) {
    status(tooBig.length ? `Ảnh quá lớn (tối đa ${C.maxUploadMb} MB).` : 'Vui lòng chọn tệp ảnh.');
    return;
  }

  const picker = $('#file-input');
  picker.disabled = true;
  $('.g-pick').classList.add('busy');
  let done = 0, failed = 0;
  status(`Đang gửi 0/${ok.length} ảnh…`);
  const queue = [...ok];
  const worker = async () => {
    for (let f; (f = queue.shift());) {
      try { await uploadOne(f); done++; }
      catch (e) { failed++; console.warn('upload failed', e); }
      status(`Đang gửi ${done + failed}/${ok.length} ảnh…`);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  picker.disabled = false;
  picker.value = '';
  $('.g-pick').classList.remove('busy');

  const skipped = tooBig.length + notImage.length;
  status([
    done ? `Đã gửi ${done} ảnh — cảm ơn bạn! Ảnh sẽ hiện trong album sau ít giây.` : '',
    failed ? `${failed} ảnh chưa gửi được, bạn thử lại nhé.` : '',
    skipped ? `${skipped} tệp bị bỏ qua (không phải ảnh hoặc quá ${C.maxUploadMb} MB).` : ''
  ].filter(Boolean).join(' '));
  if (done && $('#grid')) pollAfterUpload(photos.length + done);
  if (done && $('#carousel')) [8e3, 20e3].forEach(t => setTimeout(loadCarousel, t)); // show their photo once processed
}

// Processing takes a few seconds per photo; check more often for a minute.
async function pollAfterUpload(expected) {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    await refresh();
    if (photos.length >= expected) return;
  }
}

/* ---------- admin ---------- */
async function removePhoto(p, li, btn) {
  if (!confirm('Xoá ảnh này khỏi album?')) return;
  btn.disabled = true;
  try {
    if (tokenExpiry(idToken) - Date.now() < 60e3) throw new Error('expired');
    const c = await credentials('admin');
    const { url, headers } = await signS3({ method: 'DELETE', bucket: C.bucket, region: C.region, key: p.key, credentials: c });
    const res = await fetch(url, { method: 'DELETE', headers });
    if (!res.ok && res.status !== 204) throw new Error(`S3 ${res.status}`);
    photos = photos.filter(x => x.key !== p.key);
    tiles.delete(p.key);
    li.remove();
    showMore(); // keep the batch full
    updateMeta();
  } catch (e) {
    btn.disabled = false;
    if (e.message === 'expired') { endAdmin(); notice('Phiên quản trị đã hết hạn, vui lòng đăng nhập lại.'); }
    else alert('Không xoá được ảnh, vui lòng thử lại.');
  }
}

function beginAdmin(token) {
  idToken = token;
  sessionStorage.setItem('gallery-admin', token);
  creds = null;
  $('#admin-bar').hidden = false;
  $('#login-btn').hidden = true;
  render();
}
function endAdmin() {
  idToken = null;
  sessionStorage.removeItem('gallery-admin');
  creds = null;
  $('#admin-bar').hidden = true;
  $('#login-btn').hidden = !adminConfigured;
  render();
}

/* ---------- lightbox ---------- */
let lbIndex = 0;
function openLightbox(i) {
  lbIndex = i;
  $('#lb-img').src = `${cdn}/${photos[i].key}`;
  const d = $('#lightbox');
  if (!d.open) d.showModal();
}
const step = n => photos.length && openLightbox((lbIndex + n + photos.length) % photos.length);
function setupLightbox() {
  const d = $('#lightbox');
  $('#lb-close').addEventListener('click', () => d.close());
  $('#lb-prev').addEventListener('click', () => step(-1));
  $('#lb-next').addEventListener('click', () => step(1));
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  d.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
  let x0 = null;
  d.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  d.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    x0 = null;
  });
}

/* ---------- carousel (both pages) ----------
   A continuously moving film strip: newest guest photos, or the couple's photos (data-fallback)
   until there are some. The list is repeated to fill wide screens, then doubled; CSS slides the
   track left by exactly half its width in a loop, so the seam is invisible. Pauses on hover /
   while touched; stands still (and becomes swipeable) with prefers-reduced-motion. */
const CAROUSEL_MAX = 12;
const CAROUSEL_MIN = 8;        // fill wide screens even with few photos
const SECONDS_PER_PHOTO = 7;   // speed: higher = slower
let carouselKeys = '';

async function loadCarousel() {
  const box = $('#carousel');
  const list = configured ? await loadManifest() : null;
  const urls = list && list.length
    ? list.slice(0, CAROUSEL_MAX).map(thumbUrl)
    : box.dataset.fallback.trim().split(/\s+/);
  const keys = urls.join('|');
  if (keys === carouselKeys) return; // unchanged: don't restart the motion
  carouselKeys = keys;

  const base = [];
  while (base.length < Math.max(CAROUSEL_MIN, urls.length)) base.push(...urls);
  const track = $('#carousel-track');
  track.replaceChildren(...[...base, ...base].map((src, i) => {
    const li = make('li', { className: 'g-slide' });
    if (i >= urls.length) li.setAttribute('aria-hidden', 'true'); // repeats are decoration
    li.appendChild(make('img', { src, alt: '', loading: i < 4 ? 'eager' : 'lazy', decoding: 'async' }));
    return li;
  }));
  track.style.setProperty('--marquee-duration', `${base.length * SECONDS_PER_PHOTO}s`);
}

function setupCarousel() {
  const track = $('#carousel-track');
  const hold = () => track.classList.add('paused');
  const release = () => track.classList.remove('paused');
  track.addEventListener('pointerdown', hold);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => track.addEventListener(ev, release));
  loadCarousel();
  setInterval(() => { if (document.visibilityState === 'visible') loadCarousel(); }, 30e3);
}

/* ---------- start ----------
   Each part runs only if the page contains it:
     #carousel   newest photos (both pages)
     #grid       full album + lightbox (both pages)
     #upload-box upload button (upload page only)
     #login-btn  admin login / delete (album page only — its URL is the registered login callback) */
const NOT_READY = 'Album đang được chuẩn bị, bạn quay lại sau nhé.';

function initUpload() {
  $('#max-mb').textContent = C.maxUploadMb || 30;
  if (!configured) { $('#upload-box').hidden = true; return; }
  $('#file-input').addEventListener('change', e => uploadAll(e.target.files));
}

async function initAdmin() {
  if (!adminConfigured) { $('#login-btn').hidden = true; return; }
  $('#login-btn').hidden = false;
  $('#login-btn').addEventListener('click', () => startLogin(loginCfg));
  $('#logout-btn').addEventListener('click', () => { endAdmin(); location.assign(logoutUrl(loginCfg)); });
  try {
    const token = await finishLogin(loginCfg) || sessionStorage.getItem('gallery-admin');
    if (token && tokenExpiry(token) - Date.now() > 60e3) beginAdmin(token);
    else sessionStorage.removeItem('gallery-admin');
  } catch (e) {
    notice(e.message);
  }
}

async function initAlbum() {
  setupLightbox();
  if (!configured) return;
  setupInfiniteScroll();
  await refresh();
  render();
  setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30e3);
}

async function init() {
  if (!configured) notice(NOT_READY);
  if ($('#carousel')) setupCarousel();
  if ($('#upload-box')) initUpload();
  if ($('#login-btn')) await initAdmin(); // before the grid renders, so delete buttons appear
  if ($('#grid')) await initAlbum();
}

init();
