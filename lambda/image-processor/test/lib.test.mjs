import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { decodeKey, galleryKeyFor, toWebp, buildManifest, InvalidImageError, thumbKeyFor, isFullPhoto } from '../lib.mjs';

const cfg = { originalPrefix: 'original/', galleryPrefix: 'gallery/', thumbPrefix: 'gallery/thumb/', maxDimension: 1600, quality: 80, thumbDimension: 480, thumbQuality: 70 };
const ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

test('decodeKey handles S3 event encoding', () => {
  assert.equal(decodeKey('original/a+b%C3%A8.jpg'), 'original/a bè.jpg');
});

test('galleryKeyFor maps uuid uploads and ignores anything else', () => {
  assert.deepEqual(galleryKeyFor(`original/${ID}.JPG`, cfg), { id: ID, galleryKey: `gallery/${ID}.webp` });
  assert.deepEqual(galleryKeyFor(`original/${ID}`, cfg), { id: ID, galleryKey: `gallery/${ID}.webp` });
  assert.equal(galleryKeyFor('original/holiday.jpg', cfg), null);
  assert.equal(galleryKeyFor(`original/x/${ID}.jpg`, cfg), null);
  assert.equal(galleryKeyFor(`gallery/${ID}.jpg`, cfg), null);
});

test('toWebp applies EXIF orientation, fits 1600 and never enlarges', async () => {
  // 3000x2000 landscape tagged "rotate 90° CW" (orientation 6) -> displayed portrait
  const tagged = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#a08c7a' } })
    .jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const out = await toWebp(tagged, cfg);
  assert.equal(out.width, 1067);
  assert.equal(out.height, 1600);
  const meta = await sharp(out.data).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.orientation, undefined, 'EXIF is stripped');

  // thumbnail: upright too, shortest side 480, much smaller than the full image
  const t = await sharp(out.thumb).metadata();
  assert.deepEqual([t.format, t.width, t.height], ['webp', 480, 720]);
  assert.ok(out.thumb.length < out.data.length);

  const small = await sharp({ create: { width: 640, height: 480, channels: 3, background: '#fff' } }).png().toBuffer();
  const s = await toWebp(small, cfg);
  assert.deepEqual([s.width, s.height], [640, 480]);
});

test('toWebp rejects non-images and SVG', async () => {
  await assert.rejects(toWebp(Buffer.from('definitely not an image'), cfg), InvalidImageError);
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>');
  await assert.rejects(toWebp(svg, cfg), InvalidImageError);
});

test('buildManifest lists full photos newest first, with thumbs when present', () => {
  const m = buildManifest([
    { Key: 'gallery/a.webp', LastModified: '2026-12-12T10:00:00Z' },
    { Key: 'gallery/index.json', LastModified: '2026-12-12T12:00:00Z' },
    { Key: 'gallery/b.webp', LastModified: '2026-12-12T11:00:00Z' },
    { Key: 'gallery/thumb/b.webp', LastModified: '2026-12-12T11:00:00Z' },
    { Key: 'original/c.jpg', LastModified: '2026-12-12T11:30:00Z' }
  ], cfg);
  assert.deepEqual(m.photos.map(p => [p.key, p.thumb]), [['gallery/b.webp', 'gallery/thumb/b.webp'], ['gallery/a.webp', undefined]]);
  assert.equal(m.count, 2);
});

test('thumb keys and full-photo detection', () => {
  assert.equal(thumbKeyFor('gallery/x.webp', cfg), 'gallery/thumb/x.webp');
  assert.equal(isFullPhoto('gallery/x.webp', cfg), true);
  assert.equal(isFullPhoto('gallery/thumb/x.webp', cfg), false);
  assert.equal(isFullPhoto('gallery/index.json', cfg), false);
});
