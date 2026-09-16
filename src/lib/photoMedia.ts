export interface PhotoAsset {
  id: string;
  filename?: string;
  thumbUrl: string;
  originalUrl: string;
  width: number;
  height: number;
  thumbWidth?: number;
  thumbHeight?: number;
  caption?: string | null;
  category?: string | null;
  theme?: string | null;
  camera?: string | null;
  lens?: string | null;
  lensModel?: string | null;
  aperture?: string | null;
  shutter?: string | null;
  iso?: string | null;
  filmSim?: string | null;
  title?: string | null;
  location?: string | null;
  story?: string | null;
}

/**
 * Sources for one grid thumbnail.
 *
 * Deliberately does NOT offer the original. It used to sit in the srcset at
 * 2400w, and on a wide retina screen the browser would duly pick it — an 872KB
 * file to fill a slot about 341 CSS px across. The original is for the
 * lightbox; the grid never needs it.
 *
 * The WebP paths are derived from thumbUrl rather than stored per photo, so
 * adding a photo stays a two-field edit. scripts/optimise-thumbnails.mjs writes
 * exactly these names.
 */
export function buildThumbSources(photo: Pick<PhotoAsset, "thumbUrl">) {
  const base = photo.thumbUrl.replace(/\.jpe?g$/i, "");
  return {
    webpSrcSet: `${base}-600.webp 600w, ${base}.webp 900w`,
    jpegSrc: photo.thumbUrl,
  };
}

export function getThumbIntrinsicSize(
  photo: Pick<PhotoAsset, "thumbWidth" | "thumbHeight" | "width" | "height">
) {
  return {
    width: photo.thumbWidth ?? photo.width,
    height: photo.thumbHeight ?? photo.height,
  };
}

export function getPhotoAlt(
  photo: Pick<
    PhotoAsset,
    "id" | "filename" | "title" | "caption" | "location" | "category"
  >,
  fallback: string
) {
  const namedFallback = photo.location || photo.category || photo.filename || photo.id;
  const readableFallback = namedFallback
    ?.replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return photo.title?.trim() || photo.caption?.trim() || readableFallback || fallback;
}
