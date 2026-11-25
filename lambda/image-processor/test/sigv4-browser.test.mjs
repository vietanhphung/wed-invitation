// The gallery page signs S3 requests itself (intimate/gallery/aws.js, no SDK in the browser).
// Check it produces exactly the same Authorization header as AWS's official SigV4 signer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodeCrypto from 'node:crypto';
import { SignatureV4 } from '@smithy/signature-v4';
import { signS3 } from '../../../intimate/gallery/aws.js';

class Sha256 {
  constructor(secret) { this.h = secret ? nodeCrypto.createHmac('sha256', secret) : nodeCrypto.createHash('sha256'); }
  update(d) { this.h.update(typeof d === 'string' ? Buffer.from(d) : d); }
  async digest() { return new Uint8Array(this.h.digest()); }
}

const credentials = { accessKeyId: 'AKIDEXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', sessionToken: 'tok/en+=' };
const now = new Date('2026-12-12T08:15:30.123Z');
const region = 'ca-central-1';
const bucket = 'my-bucket';
const host = `${bucket}.s3.${region}.amazonaws.com`;
const reference = new SignatureV4({ service: 's3', region, credentials, sha256: Sha256, uriEscapePath: false, applyChecksum: false });

for (const [method, key, headers] of [
  ['PUT', 'original/0f8fad5b-d9cb-469f-a165-70867728950e.jpg', { 'Content-Type': 'image/jpeg' }],
  ['DELETE', 'gallery/0f8fad5b-d9cb-469f-a165-70867728950e.webp', {}],
  ['PUT', "original/odd name (1)+é!'*.jpg", { 'content-type': 'image/heic' }]
]) {
  test(`SigV4 ${method} ${key}`, async () => {
    const mine = await signS3({ method, bucket, region, key, headers, credentials, now });
    const ref = await reference.sign({
      method, protocol: 'https:', hostname: host, path: new URL(mine.url).pathname,
      headers: { host, 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])) }
    }, { signingDate: now });
    assert.equal(mine.headers.authorization, ref.headers.authorization);
    assert.equal(mine.headers['x-amz-security-token'], credentials.sessionToken);
    assert.equal(mine.headers.host, undefined, 'host is set by the browser, not by us');
  });
}
