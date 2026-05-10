"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionLabel from "@/components/ui/SectionLabel";
import ScrollReveal from "@/components/ui/ScrollReveal";
import ExifBadge from "@/components/ui/ExifBadge";
import type { PhotoAsset } from "@/lib/photoMedia";
import {
  buildPhotoSrcSet,
  getPhotoAlt,
  getThumbIntrinsicSize,
} from "@/lib/photoMedia";

interface GalleryClientProps {
  photos: PhotoAsset[];
}

const THEME_FILTERS = [
  "all",
  "people",
  "streets",
  "horizons",
  "stillness",
] as const;
const VALID_THEMES = [...THEME_FILTERS] as const;

const THEME_BLURBS: Record<(typeof THEME_FILTERS)[number], string> = {
  all: "Every frame, in no particular order.",
  people: "Strangers, friends, the moments between them.",
  streets: "Walking. Looking up. Looking around.",
  horizons: "Where the land lets go of the sky.",
  stillness: "Quiet things, held in light.",
};

const PLACE_CATEGORIES = [
  "copenhagen",
  "hokkaido",
  "korea",
  "oslo",
  "stockholm",
  "taiwan",
  "thailand",
  "tokyo",
] as const;
const RANDOM_CATEGORY = "random";
const ALL_PLACES = [...PLACE_CATEGORIES, RANDOM_CATEGORY] as const;

function normalizeTheme(value: string | null): (typeof VALID_THEMES)[number] {
  return VALID_THEMES.includes(value as (typeof VALID_THEMES)[number])
    ? (value as (typeof VALID_THEMES)[number])
    : "all";
}

function normalizeLocation(value: string | null): string | null {
  if (!value) return null;
  return ALL_PLACES.includes(value as (typeof ALL_PLACES)[number]) ? value : null;
}

function readGalleryQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    theme: normalizeTheme(params.get("theme")),
    location: normalizeLocation(params.get("location")),
    photoId: params.get("photo"),
  };
}

export default function GalleryClient({ photos }: GalleryClientProps) {
  const [activeTheme, setActiveTheme] =
    useState<(typeof VALID_THEMES)[number]>("all");
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [targetPhotoId, setTargetPhotoId] = useState<string | null>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [lightboxBusy, setLightboxBusy] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const busyTimeoutRef = useRef<number | null>(null);

  const filtered = photos.filter((photo) => {
    if (activeTheme !== "all" && photo.theme !== activeTheme) return false;
    if (activeLocation && photo.category !== activeLocation) return false;
    return true;
  });

  const landscapePhotos = filtered.filter((photo) => photo.width > photo.height);
  const portraitPhotos = filtered.filter((photo) => photo.width <= photo.height);

  const currentIndex = filtered.findIndex((photo) => photo.id === lightboxId);
  const currentPhoto = currentIndex >= 0 ? filtered[currentIndex] : null;
  const previousPhoto = currentIndex > 0 ? filtered[currentIndex - 1] : null;
  const nextPhoto =
    currentIndex >= 0 && currentIndex < filtered.length - 1
      ? filtered[currentIndex + 1]
      : null;

  const setBusyWindow = useCallback((duration = 320) => {
    setLightboxBusy(true);
    if (busyTimeoutRef.current) {
      window.clearTimeout(busyTimeoutRef.current);
    }
    busyTimeoutRef.current = window.setTimeout(() => {
      setLightboxBusy(false);
      busyTimeoutRef.current = null;
    }, duration);
  }, []);

  const updateTheme = useCallback(
    (theme: string) => {
      const nextTheme = normalizeTheme(theme);
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete("location");
      if (nextTheme === "all") {
        nextParams.delete("theme");
      } else {
        nextParams.set("theme", nextTheme);
      }
      const nextQuery = nextParams.toString();
      const nextUrl = nextQuery
        ? `${window.location.pathname}?${nextQuery}`
        : window.location.pathname;

      window.history.pushState(null, "", nextUrl);
      setActiveTheme(nextTheme);
      setActiveLocation(null);
      setTargetPhotoId(nextParams.get("photo"));
    },
    []
  );

  const clearLocation = useCallback(() => {
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.delete("location");
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery
      ? `${window.location.pathname}?${nextQuery}`
      : window.location.pathname;
    window.history.pushState(null, "", nextUrl);
    setActiveLocation(null);
  }, []);

  const openLightbox = useCallback(
    (photoId: string) => {
      if (lightboxBusy) return;
      setLightboxId(photoId);
      setBusyWindow();
    },
    [lightboxBusy, setBusyWindow]
  );

  const closeLightbox = useCallback(() => {
    if (lightboxBusy && !currentPhoto) return;
    setLightboxId(null);
    setBusyWindow();
  }, [currentPhoto, lightboxBusy, setBusyWindow]);

  const goToPhoto = useCallback(
    (direction: "prev" | "next") => {
      if (lightboxBusy) return;
      const target = direction === "prev" ? previousPhoto : nextPhoto;
      if (!target) return;
      setLightboxId(target.id);
      setBusyWindow();
    },
    [lightboxBusy, nextPhoto, previousPhoto, setBusyWindow]
  );

  useEffect(() => {
    const syncFromQuery = () => {
      const nextQuery = readGalleryQuery();
      setActiveTheme(nextQuery.theme);
      setActiveLocation(nextQuery.location);
      setTargetPhotoId(nextQuery.photoId);
    };

    syncFromQuery();
    window.addEventListener("popstate", syncFromQuery);
    return () => window.removeEventListener("popstate", syncFromQuery);
  }, []);

  useEffect(() => {
    if (!targetPhotoId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`photo-${targetPhotoId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("photo-highlight");
        window.setTimeout(() => el.classList.remove("photo-highlight"), 1800);
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [activeTheme, targetPhotoId]);

  useEffect(() => {
    if (lightboxId && filtered.every((photo) => photo.id !== lightboxId)) {
      setLightboxId(null);
    }
  }, [filtered, lightboxId]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!lightboxId) return;
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        goToPhoto("prev");
      } else if (event.key === "ArrowRight") {
        goToPhoto("next");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeLightbox, goToPhoto, lightboxId]);

  useEffect(() => {
    if (!currentPhoto) return;
    [previousPhoto?.originalUrl, nextPhoto?.originalUrl]
      .filter(Boolean)
      .forEach((url) => {
        const image = new window.Image();
        image.src = url!;
      });
  }, [currentPhoto, nextPhoto, previousPhoto]);

  useEffect(() => {
    return () => {
      if (busyTimeoutRef.current) {
        window.clearTimeout(busyTimeoutRef.current);
      }
    };
  }, []);

  const titleSuffix = useMemo(() => {
    if (activeLocation) {
      return activeLocation.charAt(0).toUpperCase() + activeLocation.slice(1);
    }
    if (activeTheme === "all") return "All Photos";
    return activeTheme.charAt(0).toUpperCase() + activeTheme.slice(1);
  }, [activeLocation, activeTheme]);

  const themeBlurb = activeLocation
    ? `Photos from ${activeLocation.charAt(0).toUpperCase() + activeLocation.slice(1)}.`
    : THEME_BLURBS[activeTheme];

  const PhotoCard = useCallback(
    ({
      photo,
      sizes,
      aspectRatio,
    }: {
      photo: PhotoAsset;
      sizes: string;
      aspectRatio?: string;
    }) => (
      <ScrollReveal>
        <div id={`photo-${photo.id}`}>
          <div
            className="gallery-photo"
            onClick={() => openLightbox(photo.id)}
            style={{
              position: "relative",
              overflow: "hidden",
              background:
                "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 50%, #7a9aad 100%)",
              aspectRatio: aspectRatio ?? `${photo.width} / ${photo.height}`,
              cursor: lightboxBusy ? "default" : "pointer",
              pointerEvents: lightboxBusy ? "none" : "auto",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbUrl}
              srcSet={buildPhotoSrcSet(photo)}
              alt={getPhotoAlt(photo, "Photo")}
              width={getThumbIntrinsicSize(photo).width}
              height={getThumbIntrinsicSize(photo).height}
              sizes={sizes}
              loading="lazy"
              decoding="async"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        </div>
      </ScrollReveal>
    ),
    [lightboxBusy, openLightbox]
  );

  return (
    <div style={{ paddingTop: "52px" }}>
      <style>{`
        @keyframes photo-pulse {
          0%   { outline: 2px solid transparent; outline-offset: 4px; }
          20%  { outline: 2px solid var(--accent); outline-offset: 4px; }
          80%  { outline: 2px solid var(--accent); outline-offset: 4px; }
          100% { outline: 2px solid transparent; outline-offset: 4px; }
        }
        .photo-highlight { animation: photo-pulse 1.6s ease forwards; }
        .gallery-photo {
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), filter 0.5s ease;
        }
        .gallery-photo:hover {
          transform: scale(1.02);
          filter: saturate(1.12) brightness(1.04) contrast(1.03);
        }
        @media (prefers-reduced-motion: reduce) {
          .gallery-photo, .gallery-photo:hover { transition: none; transform: none; filter: none; }
        }
      `}</style>

      <section className="gallery-section" style={{ padding: "80px 80px 120px" }}>
        <SectionLabel number="03" label="Gallery" />

        <div
          className="gallery-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "32px",
            marginBottom: "60px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "560px" }}>
            <h1
              style={{
                fontFamily: "Libre Caslon Display, Georgia, serif",
                fontSize: "52px",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {titleSuffix}
            </h1>
            <p
              style={{
                fontFamily: "Crimson Pro, Georgia, serif",
                fontSize: "16px",
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--text-mid)",
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {themeBlurb}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
            <div style={{ display: "flex", gap: "22px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {THEME_FILTERS.map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateTheme(theme)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "10px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color:
                      activeTheme === theme && !activeLocation
                        ? "var(--text)"
                        : "var(--text-faint)",
                    borderBottom:
                      activeTheme === theme && !activeLocation
                        ? "1px solid var(--text)"
                        : "1px solid transparent",
                    paddingBottom: "3px",
                    transition: "color 0.2s ease",
                  }}
                >
                  {theme}
                </button>
              ))}
            </div>
            {activeLocation && (
              <button
                onClick={clearLocation}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  fontSize: "10px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--text)",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                aria-label={`Clear ${activeLocation} filter`}
              >
                <span>{activeLocation}</span>
                <span style={{ color: "var(--text-light)" }}>×</span>
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "100px 0",
              color: "var(--text-faint)",
              fontSize: "14px",
            }}
          >
            No photos in this theme yet
          </div>
        ) : (
          <motion.div
            key={activeTheme}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {landscapePhotos.length > 0 && (
              <div style={{ marginBottom: "80px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "20px",
                    marginBottom: "28px",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "Libre Caslon Display, Georgia, serif",
                      fontSize: "22px",
                      fontWeight: 400,
                      letterSpacing: "-0.01em",
                      color: "var(--text)",
                      lineHeight: 1,
                    }}
                  >
                    Landscape
                  </h2>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span
                    style={{
                      fontFamily: "DM Sans, system-ui, sans-serif",
                      fontSize: "11px",
                      color: "var(--text-faint)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {String(landscapePhotos.length).padStart(2, "0")}
                  </span>
                </div>
                <div
                  className="photo-grid-3col"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "12px",
                  }}
                >
                  {landscapePhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  ))}
                </div>
              </div>
            )}

            {portraitPhotos.length > 0 && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "20px",
                    marginBottom: "28px",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "Libre Caslon Display, Georgia, serif",
                      fontSize: "22px",
                      fontWeight: 400,
                      letterSpacing: "-0.01em",
                      color: "var(--text)",
                      lineHeight: 1,
                    }}
                  >
                    Portrait
                  </h2>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span
                    style={{
                      fontFamily: "DM Sans, system-ui, sans-serif",
                      fontSize: "11px",
                      color: "var(--text-faint)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {String(portraitPhotos.length).padStart(2, "0")}
                  </span>
                </div>
                <div
                  className="photo-grid-4col"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: "12px",
                  }}
                >
                  {portraitPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLightbox}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.92)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "min(1040px, 100%)",
                maxHeight: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentPhoto.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(event) => event.stopPropagation()}
                  onTouchStart={(event) => {
                    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
                  }}
                  onTouchEnd={(event) => {
                    const startX = touchStartXRef.current;
                    const endX = event.changedTouches[0]?.clientX ?? null;
                    if (startX == null || endX == null) return;
                    const deltaX = endX - startX;
                    if (Math.abs(deltaX) < 48) return;
                    if (deltaX > 0) {
                      goToPhoto("prev");
                    } else {
                      goToPhoto("next");
                    }
                    touchStartXRef.current = null;
                  }}
                  style={{
                    maxWidth: "900px",
                    width: "100%",
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div style={{ position: "relative", background: "#1a1a1a" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentPhoto.originalUrl}
                      alt={getPhotoAlt(currentPhoto, "Photo")}
                      width={currentPhoto.width}
                      height={currentPhoto.height}
                      decoding="async"
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "78vh",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: "22px 18px 18px",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      background: "#111",
                    }}
                  >
                    {currentPhoto.title && (
                      <h2
                        style={{
                          fontFamily: "Libre Caslon Display, Georgia, serif",
                          fontSize: "34px",
                          fontWeight: 400,
                          letterSpacing: "-0.02em",
                          lineHeight: 1.05,
                          color: "#fff",
                          marginBottom: "10px",
                        }}
                      >
                        {currentPhoto.title}
                      </h2>
                    )}

                    {currentPhoto.location && (
                      <p
                        style={{
                          fontSize: "10px",
                          letterSpacing: "0.24em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.62)",
                          marginBottom: currentPhoto.story || currentPhoto.caption ? "12px" : "0",
                        }}
                      >
                        {currentPhoto.location}
                      </p>
                    )}

                    {(currentPhoto.story || currentPhoto.caption) && (
                      <p
                        style={{
                          fontFamily: "Crimson Pro, Georgia, serif",
                          fontSize: "19px",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.78)",
                          marginBottom: "14px",
                        }}
                      >
                        {currentPhoto.story ?? currentPhoto.caption}
                      </p>
                    )}

                    <ExifBadge
                      camera={currentPhoto.camera}
                      lens={currentPhoto.lens}
                      aperture={currentPhoto.aperture}
                      shutter={currentPhoto.shutter}
                      iso={currentPhoto.iso}
                      filmSim={currentPhoto.filmSim}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  goToPhoto("prev");
                }}
                disabled={!previousPhoto}
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  width: "42px",
                  height: "42px",
                  borderRadius: "999px",
                  cursor: previousPhoto ? "pointer" : "default",
                  opacity: previousPhoto ? 1 : 0.3,
                  zIndex: 1001,
                }}
              >
                ‹
              </button>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  goToPhoto("next");
                }}
                disabled={!nextPhoto}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  width: "42px",
                  height: "42px",
                  borderRadius: "999px",
                  cursor: nextPhoto ? "pointer" : "default",
                  opacity: nextPhoto ? 1 : 0.3,
                  zIndex: 1001,
                }}
              >
                ›
              </button>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  closeLightbox();
                }}
                style={{
                  position: "fixed",
                  top: "20px",
                  right: "20px",
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1001,
                }}
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
