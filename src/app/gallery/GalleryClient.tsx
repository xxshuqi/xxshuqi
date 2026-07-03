"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

function normalizeLocation(value: string | null): string | null {
  if (!value) return null;
  return ALL_PLACES.includes(value as (typeof ALL_PLACES)[number]) ? value : null;
}

function getPhotoYear(photo: PhotoAsset): number | null {
  const createdAt = (photo as PhotoAsset & { createdAt?: string }).createdAt;
  if (!createdAt) return null;
  const year = new Date(createdAt).getFullYear();
  return Number.isFinite(year) ? year : null;
}

function readGalleryQuery() {
  const params = new URLSearchParams(window.location.search);
  const rawYear = params.get("year");
  const year = rawYear ? Number.parseInt(rawYear, 10) : null;

  return {
    year: Number.isFinite(year) ? year : null,
    location: normalizeLocation(params.get("location")),
    photoId: params.get("photo"),
  };
}

function interleavePhotoRatios(photos: PhotoAsset[]) {
  const landscape = photos.filter((photo) => photo.width > photo.height);
  const portrait = photos.filter((photo) => photo.width <= photo.height);
  const mixed: PhotoAsset[] = [];
  const pattern = ["landscape", "portrait", "portrait", "landscape", "portrait", "landscape"] as const;
  let landscapeIndex = 0;
  let portraitIndex = 0;

  while (landscapeIndex < landscape.length || portraitIndex < portrait.length) {
    for (const type of pattern) {
      if (type === "landscape" && landscapeIndex < landscape.length) {
        mixed.push(landscape[landscapeIndex]);
        landscapeIndex += 1;
      } else if (type === "portrait" && portraitIndex < portrait.length) {
        mixed.push(portrait[portraitIndex]);
        portraitIndex += 1;
      }
    }

    if (landscapeIndex >= landscape.length) {
      mixed.push(...portrait.slice(portraitIndex));
      break;
    }

    if (portraitIndex >= portrait.length) {
      mixed.push(...landscape.slice(landscapeIndex));
      break;
    }
  }

  return mixed;
}

export default function GalleryClient({ photos }: GalleryClientProps) {
  const timelineYears = useMemo(() => {
    const dataYears = photos
      .map(getPhotoYear)
      .filter((year): year is number => year !== null);
    const currentYear = new Date().getFullYear();
    const years = new Set<number>([currentYear - 2, currentYear - 1, currentYear]);
    dataYears.forEach((year) => years.add(year));
    return [...years].sort((a, b) => a - b);
  }, [photos]);

  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [targetPhotoId, setTargetPhotoId] = useState<string | null>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [lightboxBusy, setLightboxBusy] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const busyTimeoutRef = useRef<number | null>(null);

  const filtered = photos.filter((photo) => {
    if (activeYear !== null && getPhotoYear(photo) !== activeYear) return false;
    if (activeLocation && photo.category !== activeLocation) return false;
    return true;
  });
  const displayPhotos = useMemo(() => interleavePhotoRatios(filtered), [filtered]);

  const currentIndex = displayPhotos.findIndex((photo) => photo.id === lightboxId);
  const currentPhoto = currentIndex >= 0 ? displayPhotos[currentIndex] : null;
  const previousPhoto = currentIndex > 0 ? displayPhotos[currentIndex - 1] : null;
  const nextPhoto =
    currentIndex >= 0 && currentIndex < displayPhotos.length - 1
      ? displayPhotos[currentIndex + 1]
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

  const updateYear = useCallback(
    (year: number) => {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete("location");
      nextParams.set("year", String(year));
      const nextQuery = nextParams.toString();
      const nextUrl = nextQuery
        ? `${window.location.pathname}?${nextQuery}`
        : window.location.pathname;

      window.history.pushState(null, "", nextUrl);
      setActiveYear(year);
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
      const fallbackYear = timelineYears[timelineYears.length - 1] ?? null;
      setActiveYear(nextQuery.year ?? fallbackYear);
      setActiveLocation(nextQuery.location);
      setTargetPhotoId(nextQuery.photoId);
    };

    syncFromQuery();
    window.addEventListener("popstate", syncFromQuery);
    return () => window.removeEventListener("popstate", syncFromQuery);
  }, [timelineYears]);

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
  }, [activeYear, targetPhotoId]);

  useEffect(() => {
    if (lightboxId && displayPhotos.every((photo) => photo.id !== lightboxId)) {
      setLightboxId(null);
    }
  }, [displayPhotos, lightboxId]);

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

  const PhotoCard = useCallback(
    ({
      photo,
      sizes,
      index,
    }: {
      photo: PhotoAsset;
      sizes: string;
      index: number;
    }) => (
      <motion.div
        className="gallery-masonry-item"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.05 }}
        transition={{ duration: 0.7, delay: Math.min((index % 8) * 0.025, 0.16), ease: [0.16, 1, 0.3, 1] }}
      >
        <div id={`photo-${photo.id}`} className="gallery-masonry-anchor">
          <div
            className="gallery-photo"
            onClick={() => openLightbox(photo.id)}
            style={{
              position: "relative",
              overflow: "hidden",
              background:
                "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 50%, #7a9aad 100%)",
              aspectRatio: `${photo.width} / ${photo.height}`,
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
      </motion.div>
    ),
    [lightboxBusy, openLightbox]
  );

  return (
    <div>
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
        .gallery-masonry {
          column-count: 4;
          column-gap: 12px;
        }
        .gallery-masonry-item {
          display: block;
          break-inside: avoid;
          page-break-inside: avoid;
          margin: 0 0 12px;
        }
        .gallery-masonry-item:nth-child(2) {
          padding-top: 22px;
        }
        .gallery-masonry-item:nth-child(3) {
          padding-top: 8px;
        }
        .gallery-masonry-item:nth-child(4) {
          padding-top: 34px;
        }
        .gallery-masonry-item:nth-child(7n + 5) {
          padding-top: 12px;
        }
        .gallery-masonry-anchor {
          display: block;
        }
        @media (prefers-reduced-motion: reduce) {
          .gallery-photo, .gallery-photo:hover { transition: none; transform: none; filter: none; }
        }
        @media (max-width: 1100px) {
          .gallery-masonry {
            column-count: 3;
          }
        }
        @media (max-width: 760px) {
          .gallery-masonry {
            column-count: 2;
            column-gap: 10px;
          }
          .gallery-masonry-item {
            margin-bottom: 10px;
          }
          .gallery-masonry-item:nth-child(2),
          .gallery-masonry-item:nth-child(3),
          .gallery-masonry-item:nth-child(4),
          .gallery-masonry-item:nth-child(7n + 5) {
            padding-top: 0;
          }
        }
      `}</style>

      <section className="gallery-section" style={{ padding: "154px clamp(24px, 3vw, 54px) 96px" }}>
        <div
          className="gallery-header"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "22px",
            marginBottom: "34px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "16px" }}>
            <div
              className="gallery-timeline"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                width: "min(620px, 100%)",
                justifyContent: "flex-start",
                overflowX: "auto",
                padding: "12px 0 4px",
              }}
              aria-label="Gallery timeline"
            >
              {timelineYears.map((year, index) => {
                const active = activeYear === year && !activeLocation;
                const available = photos.some((photo) => getPhotoYear(photo) === year);

                return (
                  <button
                    key={year}
                    onClick={() => updateYear(year)}
                    className="gallery-timeline-step"
                    data-active={active}
                    data-available={available}
                    style={{
                      position: "relative",
                      flex: 1,
                      minWidth: "72px",
                      border: "none",
                      background: "transparent",
                      color: active ? "var(--text)" : "var(--text-light)",
                      cursor: "pointer",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: active ? 500 : 400,
                      letterSpacing: 0,
                      padding: "30px 0 0",
                    }}
                    aria-current={active ? "true" : undefined}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: "9px",
                        left: index === 0 ? "50%" : 0,
                        right: index === timelineYears.length - 1 ? "50%" : 0,
                        height: "1px",
                        background: "var(--border)",
                      }}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: active ? "1px" : "5px",
                        left: "50%",
                        width: active ? "18px" : "10px",
                        height: active ? "18px" : "10px",
                        borderRadius: "50%",
                        border: active
                          ? "1px solid var(--text)"
                          : "1px solid var(--text-faint)",
                        background: active ? "var(--text)" : "#fff",
                        transform: "translateX(-50%)",
                        transition: "all 0.2s ease",
                        boxShadow: active
                          ? "0 0 0 7px rgba(17,17,17,0.06)"
                          : "none",
                        opacity: available ? 1 : 0.38,
                      }}
                    />
                    <span style={{ opacity: available ? 1 : 0.38 }}>{year}</span>
                  </button>
                );
              })}
            </div>
            {activeLocation && (
              <button
                onClick={clearLocation}
                style={{
                  background: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontSize: "13px",
                  letterSpacing: 0,
                  color: "#fff",
                  padding: "9px 14px",
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
            key={`${activeYear ?? "all"}-${activeLocation ?? "all"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="gallery-masonry"
          >
            {displayPhotos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                sizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw"
              />
            ))}
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
            className="inspection-overlay"
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
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
                  className="inspection-panel"
                >
                  <div className="inspection-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentPhoto.originalUrl}
                      alt={getPhotoAlt(currentPhoto, "Photo")}
                      width={currentPhoto.width}
                      height={currentPhoto.height}
                      decoding="async"
                      style={{
                        display: "block",
                      }}
                    />
                  </div>

                  <div
                    className="inspection-copy"
                    style={{
                      background: "#111",
                    }}
                  >
                    {currentPhoto.location && (
                      <p
                        style={{
                          fontSize: "10px",
                          letterSpacing: "0.24em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.62)",
                          marginBottom: "22px",
                        }}
                      >
                        {currentPhoto.location}
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
                className="inspection-nav inspection-nav-prev"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPhoto("prev");
                }}
                disabled={!previousPhoto}
              >
                ‹
              </button>

              <button
                className="inspection-nav inspection-nav-next"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPhoto("next");
                }}
                disabled={!nextPhoto}
              >
                ›
              </button>

              <button
                className="inspection-close"
                onClick={(event) => {
                  event.stopPropagation();
                  closeLightbox();
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
