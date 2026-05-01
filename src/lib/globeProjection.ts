// Project a lat/lng (degrees) onto 2D screen coordinates of a cobe globe.
//
// cobe rotates the globe by `phi` (longitude) and `theta` (latitude tilt).
// We:
//   1. Convert lat/lng to a 3D point on a unit sphere (Y up, Z toward camera).
//   2. Rotate by phi around Y, then theta around X — same order cobe applies.
//   3. Project to screen. Hidden (back-hemisphere) points are flagged so the
//      caller can fade their polaroid out.
//
// Reference: cobe GitHub issue #14 — https://github.com/shuding/cobe/issues/14

export interface ProjectedPoint {
  /** x in canvas pixels, from top-left */
  x: number;
  /** y in canvas pixels, from top-left */
  y: number;
  /** z component after rotation; >0 means front hemisphere */
  z: number;
  /** true when the point is on the visible hemisphere */
  visible: boolean;
  /** 0..1 — how close to the front of the globe (1 = dead center, 0 = edge) */
  facingFactor: number;
}

export function projectLatLng(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
  canvasWidth: number,
  canvasHeight: number,
  // The radius the globe occupies in canvas pixels. cobe's globe takes up
  // roughly 90% of the smaller canvas dimension.
  globeRadius?: number
): ProjectedPoint {
  const radius = globeRadius ?? Math.min(canvasWidth, canvasHeight) * 0.42;

  const latRad = (lat * Math.PI) / 180;
  // cobe convention: phi is the camera longitude, so rotating phi by +X moves
  // the rendered map to the left; we add phi to bring lng into camera space.
  const lngRad = (lng * Math.PI) / 180 + phi;

  // 3D unit sphere coords (Y up, Z toward camera)
  const x0 = Math.cos(latRad) * Math.sin(lngRad);
  const y0 = Math.sin(latRad);
  const z0 = Math.cos(latRad) * Math.cos(lngRad);

  // Apply theta tilt (rotation around X axis)
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const x1 = x0;
  const y1 = y0 * cosT - z0 * sinT;
  const z1 = y0 * sinT + z0 * cosT;

  const screenX = canvasWidth / 2 + x1 * radius;
  const screenY = canvasHeight / 2 - y1 * radius;

  return {
    x: screenX,
    y: screenY,
    z: z1,
    visible: z1 > 0.05,
    facingFactor: Math.max(0, Math.min(1, z1)),
  };
}
