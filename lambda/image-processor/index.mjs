/*
  Wedding gallery image processor.

  S3 ObjectCreated  original/<uuid>.<ext>
      -> validate (size, decodable, allowed format)
      -> EXIF orientation, resize to fit MAX_DIMENSION, WebP @ WEBP_QUALITY
      -> PUT gallery/<uuid>.webp and gallery/thumb/<uuid>.webp (immutable cache headers)
      -> HEAD to verify both writes
      -> DELETE the original
      -> rebuild gallery/index.json
  S3 ObjectRemoved  gallery/*.webp (admin delete)
      -> delete its thumbnail, rebuild gallery/index.json

  Failure handling: transient errors are thrown so S3's async invoke retries; the original stays.
  Invalid uploads (not an image, too large) are logged and left in original/ for the
  lifecycle rule to expire, so nothing is lost before someone can look at it.
*/
import {
  S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand,
  DeleteObjectCommand, ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { decodeKey, galleryKeyFor, toWebp, buildManifest, InvalidImageError, thumbKeyFor, isFullPhoto } from './lib.mjs';

const cfg = {
  originalPrefix: process.env.ORIGINAL_PREFIX || 'original/',
  galleryPrefix: process.env.GALLERY_PREFIX || 'gallery/',
  thumbPrefix: process.env.THUMB_PREFIX || 'gallery/thumb/',
  thumbDimension: Number(process.env.THUMB_DIMENSION || 480),
  thumbQuality: Number(process.env.THUMB_QUALITY || 70),
  manifestKey: process.env.MANIFEST_KEY || 'gallery/index.json',
  maxDimension: Number(process.env.MAX_DIMENSION || 1600),
  quality: Number(process.env.WEBP_QUALITY || 80),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 30 * 1024 * 1024),
  manifestMaxAge: Number(process.env.MANIFEST_MAX_AGE || 10)
};

const s3 = new S3Client({});
const log = (level, msg, extra = {}) => console.log(JSON.stringify({ level, msg, ...extra }));
const isNotFound = e => e?.name === 'NotFound' || e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404;

export async function handler(event) {
  const buckets = new Set();
  for (const record of event.Records || []) {
    const bucket = record.s3.bucket.name;
    const key = decodeKey(record.s3.object.key);
    buckets.add(bucket);
    if (record.eventName.startsWith('ObjectCreated') && key.startsWith(cfg.originalPrefix)) {
      await processOriginal(bucket, key);
    } else if (record.eventName.startsWith('ObjectRemoved') && isFullPhoto(key, cfg)) {
      const thumb = thumbKeyFor(key, cfg);
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: thumb })); // no-op if absent
      log('info', 'photo deleted, thumbnail removed', { key, thumb });
    } else {
      log('info', 'manifest refresh', { event: record.eventName, key });
    }
  }
  for (const bucket of buckets) await rebuildManifest(bucket);
}

async function processOriginal(bucket, key) {
  const target = galleryKeyFor(key, cfg);
  if (!target) {
    log('warn', 'ignored: unexpected key name', { key });
    return;
  }

  let head;
  try {
    head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (e) {
    if (isNotFound(e)) { log('info', 'original already processed (duplicate event)', { key }); return; }
    throw e;
  }
  if (head.ContentLength > cfg.maxUploadBytes) {
    log('warn', 'rejected: upload too large, left for lifecycle expiry', { key, bytes: head.ContentLength });
    return;
  }

  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const input = Buffer.from(await obj.Body.transformToByteArray());

  let out;
  try {
    out = await toWebp(input, cfg);
  } catch (e) {
    if (e instanceof InvalidImageError) {
      log('warn', 'rejected: invalid image, left for lifecycle expiry', { key, reason: e.message });
      return;
    }
    throw e;
  }

  const thumbKey = thumbKeyFor(target.galleryKey, cfg);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: thumbKey,
    Body: out.thumb,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable'
  }));
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: target.galleryKey,
    Body: out.data,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
    Metadata: { width: String(out.width), height: String(out.height), source: out.sourceFormat }
  }));

  // Verify both before deleting the only other copy.
  for (const [k, body] of [[target.galleryKey, out.data], [thumbKey, out.thumb]]) {
    const written = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: k }));
    if (written.ContentLength !== body.length) {
      throw new Error(`verification failed for ${k}: ${written.ContentLength} != ${body.length}`);
    }
  }

  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  log('info', 'processed', {
    key, galleryKey: target.galleryKey, inBytes: input.length, outBytes: out.data.length, thumbBytes: out.thumb.length,
    width: out.width, height: out.height
  });
}

/*
  The manifest is rebuilt from a full listing of gallery/, so it is always complete.
  Two invocations can race (both list, the older listing writes last), so the write is
  conditional on the manifest's ETag from before the listing; on 412 we list again.
*/
export async function rebuildManifest(bucket, attempt = 1) {
  let etag;
  try {
    etag = (await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: cfg.manifestKey }))).ETag;
  } catch (e) {
    if (!isNotFound(e)) throw e;
  }

  const objects = [];
  let token;
  do {
    const page = await s3.send(new ListObjectsV2Command({
      Bucket: bucket, Prefix: cfg.galleryPrefix, ContinuationToken: token
    }));
    objects.push(...(page.Contents || []));
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  const manifest = buildManifest(objects, cfg);
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: cfg.manifestKey,
      Body: JSON.stringify(manifest),
      ContentType: 'application/json',
      CacheControl: `public, max-age=${cfg.manifestMaxAge}`,
      ...(etag ? { IfMatch: etag } : { IfNoneMatch: '*' })
    }));
    log('info', 'manifest written', { count: manifest.count });
  } catch (e) {
    const status = e?.$metadata?.httpStatusCode;
    if ((status === 412 || status === 409) && attempt < 5) {
      await new Promise(r => setTimeout(r, 100 * attempt + Math.random() * 200));
      return rebuildManifest(bucket, attempt + 1);
    }
    throw e;
  }
}
