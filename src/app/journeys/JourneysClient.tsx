"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import createGlobe from "cobe";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SectionLabel from "@/components/ui/SectionLabel";
import {
  HOME_BASE,
  LOCATIONS,
  type JourneyLocation,
} from "@/lib/journeys";
import { projectLatLng } from "@/lib/globeProjection";
import type { Photo } from "@/lib/data";

interface JourneysClientProps {
  photos: Photo[];
}

interface ProjectedMarker {
  loc: JourneyLocation;
  x: number;
  y: number;
  visible: boolean;
  facingFactor: number;
}

// Auto-rotation speed (radians per frame, ~60fps → ~3°/s)
const AUTO_ROTATE = 0.003;
// Plane / camera transition duration when a polaroid is selected
const FLIGHT_MS = 1500;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Shortest signed arc from a→b, both in radians
function shortestArc(a: number, b: number): number {
  const TAU = Math.PI * 2;
  let diff = ((b - a) % TAU + TAU) % TAU;
  if (diff > Math.PI) diff -= TAU;
  return diff;
}

function PaperPlane({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

export default function JourneysClient({ photos }: JourneysClientProps) {
  const reduceMotion = useReducedMotion();

  const photosBySlug = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const p of photos) {
      if (!p.category) continue;
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return map;
  }, [photos]);

  const photosById = useMemo(
    () => Object.fromEntries(photos.map((p) => [p.id, p])),
    [photos]
  );

  // Globe stage refs / state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // Mutable rendering state held in refs so we don't trigger re-renders every frame
  const phiRef = useRef(0);
  const targetPhiRef = useRef(0);
  const thetaRef = useRef(0.25);
  const targetThetaRef = useRef(0.25);
  const scaleRef = useRef(1);
  const targetScaleRef = useRef(1);
  const interactingRef = useRef(false);
  const flightStartRef = useRef<number | null>(null);
  const flightFromRef = useRef({ phi: 0, theta: 0.25, scale: 1 });
  const flightToRef = useRef({ phi: 0, theta: 0.25, scale: 1 });

  // Snapshot of state used by polaroids (synced via rAF tick)
  const [projection, setProjection] = useState<ProjectedMarker[]>([]);
  // Plane: lat/lng pair we render at via projection. Starts at home.
  const planeRef = useRef({ lat: HOME_BASE.lat, lng: HOME_BASE.lng });
  const planeStartRef = useRef({ lat: HOME_BASE.lat, lng: HOME_BASE.lng });
  const planeEndRef = useRef({ lat: HOME_BASE.lat, lng: HOME_BASE.lng });
  const [planeOnscreen, setPlaneOnscreen] = useState({
    x: 0,
    y: 0,
    visible: false,
    angle: 0,
  });

  // Selected location (controls gallery panel)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  // Mobile-only: which polaroid is currently popped
  const [mobilePolaroid, setMobilePolaroid] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Track viewport for stage sizing & mobile detection
  useEffect(() => {
    const update = () => {
      const stage = stageRef.current;
      if (stage) {
        const rect = stage.getBoundingClientRect();
        setStageSize({ width: rect.width, height: rect.height });
      }
      setIsMobile(window.innerWidth < 768);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Initialise cobe + drive every-frame updates from a single rAF loop.
  // cobe v2 dropped onRender, so we use globe.update() to push state in.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stageSize.width === 0 || stageSize.height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.min(stageSize.width, stageSize.height);

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: 0,
      theta: 0.25,
      dark: 0,
      diffuse: 1.1,
      mapSamples: 16000,
      mapBrightness: 1.05,
      // Pale sphere fill — almost site bg
      baseColor: [0.965, 0.965, 0.965],
      // Soft slate dot color (matches --text-light range)
      markerColor: [0.482, 0.6, 0.678],
      glowColor: [1, 1, 1],
      markers: LOCATIONS.map((l) => ({
        location: [l.lat, l.lng] as [number, number],
        size: 0.05,
      })),
    });

    let rafId = 0;
    const tick = () => {
      // 1. Step camera state (auto-rotate / ease / flight tween)
      const now = performance.now();
      const start = flightStartRef.current;
      if (start !== null) {
        const t = Math.min(1, (now - start) / FLIGHT_MS);
        const eased = easeInOut(t);
        const from = flightFromRef.current;
        const to = flightToRef.current;

        phiRef.current = from.phi + (to.phi - from.phi) * eased;
        thetaRef.current = from.theta + (to.theta - from.theta) * eased;
        scaleRef.current = from.scale + (to.scale - from.scale) * eased;

        const fromLatLng = planeStartRef.current;
        const toLatLng = planeEndRef.current;
        const lngDelta = shortestArc(
          (fromLatLng.lng * Math.PI) / 180,
          (toLatLng.lng * Math.PI) / 180
        );
        planeRef.current = {
          lat:
            fromLatLng.lat + (toLatLng.lat - fromLatLng.lat) * eased,
          lng: fromLatLng.lng + ((lngDelta * 180) / Math.PI) * eased,
        };

        if (t >= 1) {
          flightStartRef.current = null;
          phiRef.current = to.phi;
          thetaRef.current = to.theta;
          scaleRef.current = to.scale;
          planeRef.current = { ...toLatLng };
        }
      } else {
        if (
          !interactingRef.current &&
          selectedSlug === null &&
          !reduceMotion
        ) {
          phiRef.current += AUTO_ROTATE;
          targetPhiRef.current = phiRef.current;
        }
        phiRef.current +=
          (targetPhiRef.current - phiRef.current) * 0.08;
        thetaRef.current +=
          (targetThetaRef.current - thetaRef.current) * 0.08;
        scaleRef.current +=
          (targetScaleRef.current - scaleRef.current) * 0.08;
      }

      // 2. Push the new camera state into cobe
      globe.update({
        phi: phiRef.current,
        theta: thetaRef.current,
        scale: scaleRef.current,
      });

      // 3. Project polaroids & plane to screen coords for React overlay
      const radius = (size / 2) * 0.85 * scaleRef.current;
      const offsetX = (stageSize.width - size) / 2;
      const offsetY = (stageSize.height - size) / 2;

      const next: ProjectedMarker[] = LOCATIONS.map((loc) => {
        const p = projectLatLng(
          loc.lat,
          loc.lng,
          phiRef.current,
          thetaRef.current,
          size,
          size,
          radius
        );
        return {
          loc,
          x: p.x + offsetX,
          y: p.y + offsetY,
          visible: p.visible,
          facingFactor: p.facingFactor,
        };
      });

      const pp = projectLatLng(
        planeRef.current.lat,
        planeRef.current.lng,
        phiRef.current,
        thetaRef.current,
        size,
        size,
        radius
      );
      const ahead = projectLatLng(
        planeEndRef.current.lat,
        planeEndRef.current.lng,
        phiRef.current,
        thetaRef.current,
        size,
        size,
        radius
      );
      const dx = ahead.x - pp.x;
      const dy = ahead.y - pp.y;
      const angle =
        Math.abs(dx) + Math.abs(dy) < 0.5
          ? planeOnscreen.angle
          : (Math.atan2(dy, dx) * 180) / Math.PI;

      setProjection(next);
      setPlaneOnscreen({
        x: pp.x + offsetX,
        y: pp.y + offsetY,
        visible: pp.visible,
        angle,
      });

      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      globe.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageSize.width, stageSize.height, reduceMotion, selectedSlug]);

  // Pointer drag to rotate (cobe natively supports pointer; we only flag
  // interactingRef so auto-rotate pauses).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let down = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      down = true;
      interactingRef.current = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      targetPhiRef.current += dx / 200;
      phiRef.current += dx / 200;
    };
    const onUp = () => {
      down = false;
      // Resume auto-rotate after a brief pause
      window.setTimeout(() => {
        interactingRef.current = false;
      }, 800);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onUp);
    };
  }, [stageSize.width]);

  // Compute target phi/theta for a given lat/lng (so the location is centered)
  const cameraForLocation = useCallback(
    (lat: number, lng: number) => {
      // To center a longitude, phi must equal -lng
      const lngRad = (lng * Math.PI) / 180;
      // Find shortest-arc target so we don't spin the long way around
      const currentPhi = phiRef.current;
      const desiredPhi = -lngRad;
      const diff = shortestArc(currentPhi, desiredPhi);
      return {
        phi: currentPhi + diff,
        theta: Math.max(-0.4, Math.min(0.5, (lat * Math.PI) / 180 * 0.4)),
        scale: 1.35,
      };
    },
    []
  );

  const flyTo = useCallback(
    (loc: JourneyLocation) => {
      if (reduceMotion) {
        // Reduced motion: jump directly to gallery
        setSelectedSlug(loc.slug);
        return;
      }

      const target = cameraForLocation(loc.lat, loc.lng);
      flightFromRef.current = {
        phi: phiRef.current,
        theta: thetaRef.current,
        scale: scaleRef.current,
      };
      flightToRef.current = target;

      planeStartRef.current = { ...planeRef.current };
      planeEndRef.current = { lat: loc.lat, lng: loc.lng };

      flightStartRef.current = performance.now();
      interactingRef.current = true;

      // Set selection so the panel slides up alongside the flight
      window.setTimeout(() => {
        setSelectedSlug(loc.slug);
      }, FLIGHT_MS - 200);

      targetPhiRef.current = target.phi;
      targetThetaRef.current = target.theta;
      targetScaleRef.current = target.scale;
    },
    [cameraForLocation, reduceMotion]
  );

  const closePanel = useCallback(() => {
    setSelectedSlug(null);
    targetScaleRef.current = 1;
    interactingRef.current = false;
  }, []);

  const handlePolaroidClick = useCallback(
    (loc: JourneyLocation) => {
      if (isMobile && mobilePolaroid !== loc.slug) {
        // First tap on mobile: just show the polaroid
        setMobilePolaroid(loc.slug);
        return;
      }
      flyTo(loc);
    },
    [flyTo, isMobile, mobilePolaroid]
  );

  // Keyboard accessibility on globe area — Esc closes panel
  useEffect(() => {
    if (!selectedSlug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePanel, selectedSlug]);

  const selectedLocation =
    selectedSlug != null
      ? LOCATIONS.find((l) => l.slug === selectedSlug) ?? null
      : null;
  const selectedPhotos = selectedLocation
    ? (photosBySlug.get(selectedLocation.slug) ?? []).slice(0, 4)
    : [];
  const selectedPhotoCount = selectedLocation
    ? photosBySlug.get(selectedLocation.slug)?.length ?? 0
    : 0;

  return (
    <div style={{ paddingTop: "52px" }}>
      <section
        className="journeys-section"
        style={{ padding: "60px 80px 100px" }}
      >
        <SectionLabel number="06" label="Journeys" />

        {/* Editorial intro */}
        <div
          style={{
            marginTop: "20px",
            marginBottom: "32px",
            maxWidth: "640px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "12px",
            }}
          >
            The Map
          </p>
          <h1
            style={{
              fontFamily: "Libre Caslon Display, Georgia, serif",
              fontSize: "clamp(40px, 5.5vw, 64px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              marginBottom: "16px",
            }}
          >
            Where I&apos;ve been
          </h1>
          <p
            style={{
              fontFamily: "Crimson Pro, Georgia, serif",
              fontSize: "20px",
              fontStyle: "italic",
              color: "var(--text-mid)",
              lineHeight: 1.5,
            }}
          >
            Click a photo to see more.
          </p>
        </div>

        {/* Globe stage */}
        <div
          ref={stageRef}
          className="journeys-stage"
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: isMobile ? "1 / 1" : "16 / 10",
            maxHeight: "min(700px, 80vh)",
            margin: "0 auto",
          }}
        >
          {/* Soft drop shadow under the globe */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              bottom: "8%",
              transform: "translateX(-50%)",
              width: "60%",
              height: "30px",
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.10), transparent 70%)",
              filter: "blur(12px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <canvas
            ref={canvasRef}
            aria-label="Interactive globe of travel locations"
            role="img"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: `min(${stageSize.width}px, ${stageSize.height}px)`,
              height: `min(${stageSize.width}px, ${stageSize.height}px)`,
              cursor: "grab",
              touchAction: "pan-y",
            }}
          />

          {/* Polaroid overlay layer */}
          {projection.map((m) => {
            const showOnMobile =
              isMobile && mobilePolaroid === m.loc.slug && m.visible;
            const showOnDesktop = !isMobile && m.visible;
            const show = showOnDesktop || showOnMobile;
            const offset = m.loc.offset ?? { x: 0, y: -78 };
            // For mobile, smaller offset
            const oy = isMobile ? -56 : offset.y - 60;
            const ox = isMobile ? 0 : offset.x;
            const opacity = show
              ? 0.4 + 0.6 * Math.min(1, m.facingFactor * 1.4)
              : 0;
            const photo = photosById[m.loc.coverPhotoId];
            return (
              <div
                key={m.loc.slug}
                style={{
                  position: "absolute",
                  left: m.x,
                  top: m.y,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              >
                {/* Pin marker dot (always at the projected lat/lng) */}
                {m.visible && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      transform: "translate(-50%, -50%)",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "var(--accent)",
                      boxShadow: "0 0 0 3px rgba(122,154,173,0.18)",
                      opacity,
                    }}
                  />
                )}

                {/* Polaroid */}
                {photo && (
                  <button
                    type="button"
                    onClick={() => handlePolaroidClick(m.loc)}
                    aria-label={`View photos from ${m.loc.name}`}
                    className="journeys-polaroid"
                    style={{
                      position: "absolute",
                      left: ox,
                      top: oy,
                      transform: `translate(-50%, -100%) rotate(${m.loc.polaroidTilt}deg)`,
                      pointerEvents: show ? "auto" : "none",
                      opacity,
                      transition: "opacity 0.4s ease",
                      background: "#fff",
                      border: "none",
                      padding: "5px 5px 8px",
                      boxShadow:
                        "0 8px 18px -6px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.06)",
                      cursor: "pointer",
                      width: isMobile ? "84px" : "118px",
                      fontFamily: "inherit",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        overflow: "hidden",
                        background: "#f0f0f0",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumbUrl}
                        alt=""
                        width={photo.width}
                        height={photo.height}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        marginTop: "6px",
                        fontFamily:
                          "Libre Caslon Display, Georgia, serif",
                        fontSize: isMobile ? "11px" : "13px",
                        color: "#222",
                        textAlign: "center",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {m.loc.name}
                    </div>
                  </button>
                )}
              </div>
            );
          })}

          {/* Plane */}
          {planeOnscreen.visible && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: planeOnscreen.x,
                top: planeOnscreen.y,
                transform: `translate(-50%, -50%) rotate(${planeOnscreen.angle}deg)`,
                color: "var(--text)",
                pointerEvents: "none",
                zIndex: 3,
                transition: "color 0.3s ease",
              }}
            >
              <PaperPlane size={16} />
            </div>
          )}
        </div>

        {/* Gallery panel */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              key={selectedLocation.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                marginTop: "32px",
                position: "relative",
                background: "#fff",
                border: "1px solid var(--border)",
                padding: "32px",
              }}
            >
              <button
                type="button"
                onClick={closePanel}
                aria-label="Close location"
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "20px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                  lineHeight: 1,
                  color: "var(--text-mid)",
                  padding: "4px 8px",
                }}
              >
                ×
              </button>

              <p
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--text-faint)",
                  marginBottom: "8px",
                }}
              >
                {selectedLocation.country}
              </p>
              <h2
                style={{
                  fontFamily: "Libre Caslon Display, Georgia, serif",
                  fontSize: "36px",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  marginBottom: "24px",
                  lineHeight: 1,
                }}
              >
                {selectedLocation.name}
              </h2>

              <div
                className="journeys-thumbs"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                {selectedPhotos.map((photo) => (
                  <Link
                    key={photo.id}
                    href={`/gallery?location=${selectedLocation.slug}&photo=${photo.id}`}
                    style={{ display: "block" }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "3 / 4",
                        overflow: "hidden",
                        background: "var(--bg-off)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumbUrl}
                        alt={photo.caption ?? ""}
                        width={photo.width}
                        height={photo.height}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                href={`/gallery?location=${selectedLocation.slug}`}
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "var(--text)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--text)",
                  paddingBottom: "2px",
                }}
              >
                View all {selectedPhotoCount} photos →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accessibility fallback list — always rendered so screen readers
            and no-JS visitors get a usable index. */}
        <nav
          aria-label="Locations"
          style={{
            marginTop: "60px",
            paddingTop: "32px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <h2
            style={{
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
              marginBottom: "16px",
              fontWeight: 400,
            }}
          >
            All Locations
          </h2>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: "16px 28px",
            }}
          >
            {LOCATIONS.map((loc) => {
              const count = photosBySlug.get(loc.slug)?.length ?? 0;
              return (
                <li key={loc.slug}>
                  <Link
                    href={`/gallery?location=${loc.slug}`}
                    style={{
                      fontFamily: "Libre Caslon Display, Georgia, serif",
                      fontSize: "16px",
                      color: "var(--text)",
                      textDecoration: "none",
                      borderBottom: "1px solid transparent",
                      paddingBottom: "1px",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    {loc.name}{" "}
                    <span
                      style={{
                        fontFamily: "DM Sans, system-ui, sans-serif",
                        fontSize: "11px",
                        color: "var(--text-faint)",
                        letterSpacing: "0.05em",
                        marginLeft: "4px",
                      }}
                    >
                      {String(count).padStart(2, "0")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </section>
    </div>
  );
}
