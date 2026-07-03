"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PhotoAsset } from "@/lib/photoMedia";
import {
  buildPhotoSrcSet,
  getPhotoAlt,
  getThumbIntrinsicSize,
} from "@/lib/photoMedia";

interface PortfolioWallProps {
  photos: PhotoAsset[];
}

function formatLocation(photo: PhotoAsset) {
  return photo.location || photo.category || "Untitled place";
}

function ExifRow({ photo }: { photo: PhotoAsset }) {
  const items = [
    { label: "Camera", value: photo.camera },
    { label: "Lens", value: photo.lens },
    { label: "Aperture", value: photo.aperture },
    { label: "Shutter", value: photo.shutter },
    { label: "ISO", value: photo.iso },
    { label: "Film", value: photo.filmSim },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <dl className="inspection-meta-grid">
      {items.map(({ label, value }) => (
        <div key={label} className="inspection-meta-item">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const DESK_LAYOUT = [
  { x: 4, y: 10, w: 230, r: -8 },
  { x: 22, y: 5, w: 210, r: 6 },
  { x: 42, y: 9, w: 245, r: -3 },
  { x: 64, y: 4, w: 220, r: 7 },
  { x: 78, y: 18, w: 205, r: -5 },
  { x: 10, y: 33, w: 215, r: 9 },
  { x: 31, y: 28, w: 240, r: -7 },
  { x: 54, y: 31, w: 225, r: 4 },
  { x: 72, y: 39, w: 232, r: -9 },
  { x: 2, y: 57, w: 235, r: -4 },
  { x: 24, y: 58, w: 220, r: 8 },
  { x: 48, y: 55, w: 250, r: -6 },
  { x: 70, y: 63, w: 215, r: 5 },
  { x: 14, y: 76, w: 205, r: -10 },
  { x: 37, y: 78, w: 228, r: 3 },
  { x: 60, y: 77, w: 238, r: -2 },
];

export default function PortfolioWall({ photos }: PortfolioWallProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [topPhotoId, setTopPhotoId] = useState<string | null>(null);
  const deskRef = useRef<HTMLDivElement | null>(null);
  const suppressClickRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);

  const deskPhotos = useMemo(() => photos.slice(0, 40), [photos]);
  const activeIndex = deskPhotos.findIndex((photo) => photo.id === activeId);
  const activePhoto = activeIndex >= 0 ? deskPhotos[activeIndex] : null;
  const previousPhoto = activeIndex > 0 ? deskPhotos[activeIndex - 1] : null;
  const nextPhoto =
    activeIndex >= 0 && activeIndex < deskPhotos.length - 1
      ? deskPhotos[activeIndex + 1]
      : null;

  const openPhoto = useCallback((photoId: string) => {
    setActiveId(photoId);
  }, []);

  const closePhoto = useCallback(() => {
    setActiveId(null);
  }, []);

  const goTo = useCallback(
    (direction: "prev" | "next") => {
      const target = direction === "prev" ? previousPhoto : nextPhoto;
      if (target) setActiveId(target.id);
    },
    [nextPhoto, previousPhoto]
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!activePhoto) return;
      if (event.key === "Escape") closePhoto();
      if (event.key === "ArrowLeft") goTo("prev");
      if (event.key === "ArrowRight") goTo("next");
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activePhoto, closePhoto, goTo]);

  return (
    <div className="portfolio-page">
      <motion.header
        className="portfolio-intro"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.16, delayChildren: 0.22 } },
        }}
      >
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        >
          Fragments from elsewhere.
        </motion.h1>
      </motion.header>

      <section className="polaroid-desk-section" aria-label="Overview photo desk">
        <motion.div
          className="polaroid-desk"
          ref={deskRef}
          initial={{ opacity: 0, y: 28, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.05, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        >
          {deskPhotos.map((photo, index) => {
          const intrinsic = getThumbIntrinsicSize(photo);
          const layout = DESK_LAYOUT[index % DESK_LAYOUT.length];
          const row = Math.floor(index / DESK_LAYOUT.length);
          const left = Math.min(82, layout.x + row * 3.4);
          const top = Math.min(84, layout.y + row * 2.8);

          return (
            <motion.button
              key={photo.id}
              type="button"
              className="polaroid-card"
              drag
              dragConstraints={deskRef}
              dragElastic={0.08}
              dragMomentum={false}
              initial={{
                opacity: 0,
                y: 70,
                scale: 0.86,
                rotate: layout.r + (index % 2 === 0 ? -14 : 14),
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotate: layout.r,
                zIndex: topPhotoId === photo.id ? 80 : index + 1,
              }}
              whileHover={{ y: -6, rotate: layout.r * 0.72 }}
              whileDrag={{
                scale: 1.045,
                rotate: layout.r * 0.35,
                zIndex: 100,
                cursor: "grabbing",
              }}
              transition={{
                opacity: {
                  duration: 0.42,
                  delay: 1.2 + Math.min(index * 0.028, 0.82),
                },
                y: {
                  type: "spring",
                  stiffness: 210,
                  damping: 24,
                  delay: 1.2 + Math.min(index * 0.028, 0.82),
                },
                scale: {
                  type: "spring",
                  stiffness: 230,
                  damping: 25,
                  delay: 1.2 + Math.min(index * 0.028, 0.82),
                },
                rotate: { type: "spring", stiffness: 260, damping: 28 },
              }}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `min(${layout.w}px, 45vw)`,
              }}
              onPointerDown={() => setTopPhotoId(photo.id)}
              onDragStart={() => {
                suppressClickRef.current = true;
                setTopPhotoId(photo.id);
              }}
              onClick={() => {
                if (suppressClickRef.current) {
                  suppressClickRef.current = false;
                  return;
                }
                openPhoto(photo.id);
              }}
            >
              <span
                className="polaroid-image-wrap"
                style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbUrl}
                  srcSet={buildPhotoSrcSet(photo)}
                  alt={getPhotoAlt(photo, "Recent work")}
                  width={intrinsic.width}
                  height={intrinsic.height}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 38vw"
                  loading={index < 8 ? "eager" : "lazy"}
                  decoding="async"
                />
              </span>
              <span className="polaroid-caption">
                <span>{formatLocation(photo)}</span>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </span>
            </motion.button>
          );
          })}
        </motion.div>
      </section>

      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className="inspection-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closePhoto}
          >
            <motion.div
              className="inspection-panel"
              key={activePhoto.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
                goTo(deltaX > 0 ? "prev" : "next");
                touchStartXRef.current = null;
              }}
            >
              <div className="inspection-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePhoto.originalUrl}
                  alt={getPhotoAlt(activePhoto, "Photo")}
                  width={activePhoto.width}
                  height={activePhoto.height}
                  decoding="async"
                />
              </div>

              <div className="inspection-copy">
                <p className="inspection-place">{formatLocation(activePhoto)}</p>
                <ExifRow photo={activePhoto} />
              </div>
            </motion.div>

            <button
              type="button"
              className="inspection-close"
              onClick={(event) => {
                event.stopPropagation();
                closePhoto();
              }}
              aria-label="Close photo"
            >
              ×
            </button>

            <button
              type="button"
              className="inspection-nav inspection-nav-prev"
              onClick={(event) => {
                event.stopPropagation();
                goTo("prev");
              }}
              disabled={!previousPhoto}
              aria-label="Previous photo"
            >
              ‹
            </button>

            <button
              type="button"
              className="inspection-nav inspection-nav-next"
              onClick={(event) => {
                event.stopPropagation();
                goTo("next");
              }}
              disabled={!nextPhoto}
              aria-label="Next photo"
            >
              ›
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
