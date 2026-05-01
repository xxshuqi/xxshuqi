export interface JourneyLocation {
  slug: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  coverPhotoId: string;
  /** Stable rotation seed in degrees, range -6..+6 */
  polaroidTilt: number;
  /** Optional offset to nudge polaroid away from the pin when locations cluster */
  offset?: { x: number; y: number };
}

// Home base for the plane animation.
export const HOME_BASE = { name: "Kuala Lumpur", lat: 3.139, lng: 101.6869 };

// Deterministic small rotation per slug (no per-render jitter).
// Hand-tuned to feel hand-placed, not generated.
export const LOCATIONS: JourneyLocation[] = [
  {
    slug: "copenhagen",
    name: "Copenhagen",
    country: "Denmark",
    lat: 55.6761,
    lng: 12.5683,
    coverPhotoId: "copenhagen-025",
    polaroidTilt: -4,
  },
  {
    slug: "oslo",
    name: "Oslo",
    country: "Norway",
    lat: 59.9139,
    lng: 10.7522,
    coverPhotoId: "oslo-045",
    polaroidTilt: 5,
    // Oslo is close to Stockholm — nudge polaroid up so they don't collide
    offset: { x: -30, y: -10 },
  },
  {
    slug: "stockholm",
    name: "Stockholm",
    country: "Sweden",
    lat: 59.3293,
    lng: 18.0686,
    coverPhotoId: "stockholm-058",
    polaroidTilt: -3,
    offset: { x: 30, y: 10 },
  },
  {
    slug: "thailand",
    name: "Bangkok",
    country: "Thailand",
    lat: 13.7563,
    lng: 100.5018,
    coverPhotoId: "thailand-077",
    polaroidTilt: 4,
  },
  {
    slug: "taiwan",
    name: "Taipei",
    country: "Taiwan",
    lat: 25.033,
    lng: 121.5654,
    coverPhotoId: "taiwan-063",
    polaroidTilt: -5,
  },
  {
    slug: "korea",
    name: "Jeju",
    country: "South Korea",
    lat: 33.4996,
    lng: 126.5312,
    coverPhotoId: "korea-032",
    polaroidTilt: 3,
    // Pull south-east so the polaroid doesn't cover Tokyo
    offset: { x: -40, y: 20 },
  },
  {
    slug: "tokyo",
    name: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lng: 139.6503,
    coverPhotoId: "tokyo-092",
    polaroidTilt: -2,
    offset: { x: 30, y: -10 },
  },
  {
    slug: "hokkaido",
    name: "Hokkaido",
    country: "Japan",
    lat: 43.0618,
    lng: 141.3545,
    coverPhotoId: "hokkaido-029",
    polaroidTilt: 6,
    offset: { x: 30, y: -25 },
  },
];

export function findLocation(slug: string): JourneyLocation | null {
  return LOCATIONS.find((l) => l.slug === slug) ?? null;
}
