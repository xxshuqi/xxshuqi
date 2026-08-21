import type { PhotoAsset } from "./photoMedia";

const LIGHTBOX_TITLES: Record<string, string> = {
  "random-001": "The Traveller",
  "random-002": "The Wandering Couple",
  "random-003": "Malaysian Vendors",
  "random-004": "Woman Behind Glass",
  "random-005": "Straw Hats, Grey Sea",
  "random-006": "Pentax on Rust",
  "random-007": "Light on Black Water",
  "random-008": "The Couple",
  "random-009": "Field Through the Window",
  "random-010": "Alley No. 5 Butler 2",
  "random-011": "Alley No. 5 Butler",
  "thailand-001": "Behind the Buddha",
  "thailand-002": "Thai Buddha",
  "thailand-003": "Resting in the Green",
};

export interface DisplayPhoto extends PhotoAsset {
  num: string;
  orientation: "landscape" | "portrait";
}

export function toDisplayPhotos(photos: PhotoAsset[]): DisplayPhoto[] {
  return photos.map((photo, index) => ({
    ...photo,
    num: String(index + 1).padStart(3, "0"),
    orientation: photo.width > photo.height ? "landscape" : "portrait",
  }));
}

function compactLens(lens?: string | null) {
  if (!lens) return null;
  const prime = lens.match(/(\d+(?:\.\d+)?)\s*mm/i);
  return prime ? `${Number(prime[1])}mm` : lens;
}

function compactShutter(shutter?: string | null) {
  if (!shutter) return null;
  return shutter.replace(/s$/i, "");
}

function compactIso(iso?: string | null) {
  if (!iso) return null;
  return iso.replace(/iso/i, "").trim();
}

function compactFilmSim(filmSim?: string | null) {
  if (!filmSim) return null;
  if (/classic\s+negative/i.test(filmSim)) return "CLASSIC NEG.";
  return filmSim.toUpperCase();
}

function exposureParts(photo: DisplayPhoto) {
  return [
    compactLens(photo.lens),
    photo.aperture || null,
    compactShutter(photo.shutter),
    compactIso(photo.iso) ? `ISO ${compactIso(photo.iso)}` : null,
  ].filter(Boolean);
}

export function lightboxTitle(photo: DisplayPhoto) {
  return photo.title?.trim() || LIGHTBOX_TITLES[photo.id] || "Quiet Frame";
}

export function lightboxHeading(photo: DisplayPhoto) {
  return `FRM ${photo.num} · ${lightboxTitle(photo)}`;
}

export function lightboxExposureLine(photo: DisplayPhoto) {
  const parts = exposureParts(photo);
  const filmSim = compactFilmSim(photo.filmSim);
  return [parts.join(" "), filmSim].filter(Boolean).join(" · ");
}

export function equipmentLine(photo: DisplayPhoto) {
  return [photo.camera, photo.lensModel].filter(Boolean).join(" · ") || null;
}
