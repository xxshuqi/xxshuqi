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
  camera?: string | null;
  lens?: string | null;
  aperture?: string | null;
  shutter?: string | null;
  iso?: string | null;
  filmSim?: string | null;
  title?: string | null;
  location?: string | null;
  story?: string | null;
}

export function buildPhotoSrcSet(
  photo: Pick<PhotoAsset, "thumbUrl" | "originalUrl" | "thumbWidth" | "width">
): string {
  const candidates = [
    { url: photo.thumbUrl, width: photo.thumbWidth ?? photo.width },
    { url: photo.originalUrl, width: photo.width },
  ]
    .filter((candidate) => Boolean(candidate.url && candidate.width))
    .filter(
      (candidate, index, list) =>
        list.findIndex(
          (item) => item.url === candidate.url && item.width === candidate.width
        ) === index
    )
    .sort((a, b) => a.width - b.width);

  return candidates.map(({ url, width }) => `${url} ${width}w`).join(", ");
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
