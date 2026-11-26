#!/usr/bin/env node
/*
  One-time: create gallery/thumb/<id>.webp for photos processed before thumbnails existed,
  then rebuild gallery/index.json so the page picks them up. Safe to re-run (skips existing).

    cd lambda/image-processor && npm ci
    AWS_PROFILE=wedding AWS_REGION=us-east-2 node backfill-thumbs.mjs <photo_bucket_name> [--dry-run]
*/
import sharp from 'sharp';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { isFullPhoto, thumbKeyFor } from './lib.mjs';

const bucket = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!bucket) {
  console.error('usage: node backfill-thumbs.mjs <photo_bucket_name> [--dry-run]');
  process.exit(1);
}
const cfg = {
  galleryPrefix: process.env.GALLERY_PREFIX || 'gallery/',
  thumbPrefix: process.env.THUMB_PREFIX || 'gallery/thumb/',
  thumbDimension: Number(process.env.THUMB_DIMENSION || 480),
  thumbQuality: Number(process.env.THUMB_QUALITY || 70)
};
process.env.MANIFEST_KEY ||= `${cfg.galleryPrefix}index.json`;
const s3 = new S3Client({});

const objects = [];
let token;
do {
  const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: cfg.galleryPrefix, ContinuationToken: token }));
  objects.push(...(page.Contents || []));
  token = page.IsTruncated ? page.NextContinuationToken : undefined;
} while (token);

const existing = new Set(objects.map(o => o.Key));
const todo = objects.filter(o => isFullPhoto(o.Key, cfg) && !existing.has(thumbKeyFor(o.Key, cfg)));
console.log(`${objects.filter(o => isFullPhoto(o.Key, cfg)).length} photos, ${todo.length} without thumbnail${dryRun ? ' (dry run)' : ''}`);

let done = 0;
for (const o of todo) {
  const thumbKey = thumbKeyFor(o.Key, cfg);
  if (dryRun) { console.log('  would create', thumbKey); continue; }
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: o.Key }));
  const input = Buffer.from(await obj.Body.transformToByteArray());
  const thumb = await sharp(input)
    .resize(cfg.thumbDimension, cfg.thumbDimension, { fit: 'outside', withoutEnlargement: true })
    .webp({ quality: cfg.thumbQuality })
    .toBuffer();
  await s3.send(new PutObjectCommand({
    Bucket: bucket, Key: thumbKey, Body: thumb,
    ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable'
  }));
  done++;
  console.log(`  ${thumbKey}  ${Math.round(input.length / 1024)} KB -> ${Math.round(thumb.length / 1024)} KB`);
}

if (!dryRun) {
  const { rebuildManifest } = await import('./index.mjs');
  await rebuildManifest(bucket);
  console.log(`created ${done} thumbnails; manifest rebuilt`);
}
