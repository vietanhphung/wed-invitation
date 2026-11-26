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

/** gallery/<id>.webp -> gallery/thumb/<id>.webp */
export const thumbKeyFor = (galleryKey, { galleryPrefix, thumbPrefix }) =>
  thumbPrefix + galleryKey.slice(galleryPrefix.length);

/** A full-size gallery photo key (not the manifest, not a thumbnail). */
export const isFullPhoto = (key, { galleryPrefix }) =>
  key.startsWith(galleryPrefix) && key.endsWith('.webp') && !key.slice(galleryPrefix.length).includes('/');

/**
 * Validate, auto-orient from EXIF and encode two WebPs (EXIF/GPS metadata is dropped):
 *   full  — fits maxDimension x maxDimension, never enlarged (lightbox)
 *   thumb — shortest side thumbDimension, so a square-ish cover crop stays sharp (grid, carousel)
 */
export async function toWebp(input, { maxDimension, quality, thumbDimension = 480, thumbQuality = 70 }) {
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
    const upright = sharp(input, { failOn: 'error', animated: false }).rotate(); // EXIF orientation
    const [full, thumb] = await Promise.all([
      upright.clone()
        .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer({ resolveWithObject: true }),
      upright.clone()
        .resize(thumbDimension, thumbDimension, { fit: 'outside', withoutEnlargement: true })
        .webp({ quality: thumbQuality })
        .toBuffer({ resolveWithObject: true })
    ]);
    return {
      data: full.data, width: full.info.width, height: full.info.height,
      thumb: thumb.data, sourceFormat: meta.format
    };
  } catch (e) {
    throw new InvalidImageError(`could not convert image: ${e.message}`);
  }
}

/** Manifest consumed by the gallery page: newest first; `thumb` when a thumbnail exists. */
export function buildManifest(objects, { galleryPrefix, thumbPrefix }) {
  const thumbs = new Set(objects.filter(o => o.Key.startsWith(thumbPrefix)).map(o => o.Key));
  const photos = objects
    .filter(o => isFullPhoto(o.Key, { galleryPrefix }))
    .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
    .map(o => {
      const thumb = thumbKeyFor(o.Key, { galleryPrefix, thumbPrefix });
      return { key: o.Key, ...(thumbs.has(thumb) ? { thumb } : {}), t: new Date(o.LastModified).toISOString() };
    });
  return { updated: new Date().toISOString(), count: photos.length, photos };
}
