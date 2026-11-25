// Pure helpers (no AWS calls) so they can be unit-tested locally.
import sharp from 'sharp';

// Formats the prebuilt sharp binary can decode. SVG is deliberately excluded (scriptable).
export const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'heif', 'tiff']);

// Guest uploads are named original/<uuid>.<ext> by the gallery page.
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** S3 event keys are URL-encoded with "+" for spaces. */
export const decodeKey = key => decodeURIComponent(String(key).replace(/\+/g, ' '));

/**
 * original/<uuid>.<ext> -> { id, galleryKey }.
 * Returns null for anything that does not look like a gallery upload (it is then left alone).
 */
export function galleryKeyFor(originalKey, { originalPrefix, galleryPrefix }) {
  if (!originalKey.startsWith(originalPrefix)) return null;
  const name = originalKey.slice(originalPrefix.length);
  if (name.includes('/')) return null;
  const id = name.replace(/\.[a-z0-9]{1,5}$/i, '');
  if (!ID_RE.test(id)) return null;
  return { id: id.toLowerCase(), galleryKey: `${galleryPrefix}${id.toLowerCase()}.webp` };
}

/** Permanent problems with the upload itself: retrying will not help. */
export class InvalidImageError extends Error {}

/**
 * Validate, auto-orient from EXIF, resize to fit maxDimension x maxDimension (never enlarge)
 * and encode as WebP. EXIF/GPS metadata is dropped (sharp strips it unless withMetadata()).
 */
export async function toWebp(input, { maxDimension, quality }) {
  let meta;
  try {
    meta = await sharp(input, { failOn: 'error' }).metadata();
  } catch (e) {
    throw new InvalidImageError(`not a readable image: ${e.message}`);
  }
  if (!ALLOWED_FORMATS.has(meta.format)) {
    throw new InvalidImageError(`unsupported format: ${meta.format}`);
  }
  try {
    const { data, info } = await sharp(input, { failOn: 'error', animated: false })
      .rotate() // apply EXIF orientation, then drop the tag
      .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height, sourceFormat: meta.format };
  } catch (e) {
    throw new InvalidImageError(`could not convert image: ${e.message}`);
  }
}

/** Manifest consumed by the gallery page: newest first. */
export function buildManifest(objects, { galleryPrefix }) {
  const photos = objects
    .filter(o => o.Key.startsWith(galleryPrefix) && o.Key.endsWith('.webp'))
    .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
    .map(o => ({ key: o.Key, t: new Date(o.LastModified).toISOString() }));
  return { updated: new Date().toISOString(), count: photos.length, photos };
}
