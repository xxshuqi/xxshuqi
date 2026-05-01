"use client";

import Link from "next/link";
import { motion, PanInfo, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export type FeaturedPhoto = {
  id: string;
  imageUrl: string;
  filmSimulation: string;
  title: string;
  quote: string;
  camera: string;
  aperture: string;
  shutter: string;
  galleryUrl: string;
  srcSet?: string;
  width?: number;
  height?: number;
  alt?: string;
};

interface FeaturedBookProps {
  photos: FeaturedPhoto[];
}

function clampIndex(index: number, length: number) {
  if (length === 0) return 0;
  return (index + length) % length;
}

export default function FeaturedBook({ photos }: FeaturedBookProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const reducedMotion = useReducedMotion();

  const active = photos[current];

  const meta = useMemo(
    () => [active?.camera, active?.aperture, active?.shutter].filter(Boolean),
    [active]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setDirection(-1);
        setCurrent((value) => clampIndex(value - 1, photos.length));
      }
      if (event.key === "ArrowRight") {
        setDirection(1);
        setCurrent((value) => clampIndex(value + 1, photos.length));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [photos.length]);

  if (photos.length === 0 || !active) {
    return (
      <div className="featured-book-empty">
        <p>No featured photo yet</p>
      </div>
    );
  }

  const navigate = (offset: number) => {
    if (photos.length <= 1) return;
    setDirection(offset > 0 ? 1 : -1);
    setCurrent((value) => clampIndex(value + offset, photos.length));
  };

  const handleSwipe = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 60) return;
    setDirection(info.offset.x < 0 ? 1 : -1);
    setCurrent((value) => clampIndex(value + (info.offset.x < 0 ? 1 : -1), photos.length));
  };

  return (
    <div className="featured-book-wrap">
      <div className="featured-book-desktop" aria-label="Featured photo book">
        <div className="featured-book-spread" aria-label={active.title}>
          <motion.button
            key={`photo-${active.id}`}
            type="button"
            className="featured-book-photo-page"
            aria-label="Previous photo"
            onClick={() => navigate(-1)}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : {
                    opacity: 0.72,
                    rotateY: direction > 0 ? -38 : 0,
                    scale: direction > 0 ? 1.015 : 1,
                  }
            }
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            transition={{
              duration: reducedMotion ? 0.18 : 0.58,
              ease: [0.45, 0, 0.2, 1],
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.imageUrl}
              srcSet={active.srcSet}
              sizes="(max-width: 768px) 100vw, 38vw"
              alt={active.alt ?? active.title}
              width={active.width}
              height={active.height}
            />
          </motion.button>

          <div className="featured-book-divider" aria-hidden="true" />

          <motion.article
            key={`text-${active.id}`}
            className="featured-book-text-page"
            role="button"
            tabIndex={0}
            aria-label="Next photo"
            onClick={() => navigate(1)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(1);
              }
            }}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : {
                    opacity: 0.72,
                    rotateY: direction < 0 ? 38 : 0,
                    scale: direction < 0 ? 1.015 : 1,
                  }
            }
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            transition={{
              duration: reducedMotion ? 0.18 : 0.58,
              ease: [0.45, 0, 0.2, 1],
            }}
          >
            <p className="featured-book-eyebrow">{active.filmSimulation}</p>
            <h2>{active.title}</h2>
            <p className="featured-book-quote">&ldquo;{active.quote}&rdquo;</p>
            <div className="featured-book-meta">
              {meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <Link
              className="featured-book-cta"
              href="/gallery"
              onClick={(event) => event.stopPropagation()}
            >
              View All Photos
            </Link>
          </motion.article>
        </div>

        <div className="featured-book-dots" aria-label="Featured page position">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              aria-label={`Show ${photo.title}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => {
                setDirection(index > current ? 1 : -1);
                setCurrent(index);
              }}
            />
          ))}
        </div>
      </div>

      <div className="featured-book-mobile" aria-label="Featured photo carousel">
        <motion.div
          className="featured-book-mobile-track"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.14}
          onDragEnd={handleSwipe}
          animate={{ x: `${current * -100}%` }}
          transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {photos.map((photo) => (
            <article
              key={photo.id}
              className="featured-book-mobile-card"
              aria-label={photo.title}
            >
              <button
                type="button"
                className="featured-book-mobile-zone featured-book-mobile-zone-prev"
                aria-label="Previous photo"
                onClick={() => navigate(-1)}
              />
              <button
                type="button"
                className="featured-book-mobile-zone featured-book-mobile-zone-next"
                aria-label="Next photo"
                onClick={() => navigate(1)}
              />
              <Link href={photo.galleryUrl} className="featured-book-mobile-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  srcSet={photo.srcSet}
                  sizes="100vw"
                  alt={photo.alt ?? photo.title}
                  width={photo.width}
                  height={photo.height}
                />
              </Link>
              <p className="featured-book-eyebrow">{photo.filmSimulation}</p>
              <h2>{photo.title}</h2>
              <p className="featured-book-quote">&ldquo;{photo.quote}&rdquo;</p>
              <div className="featured-book-meta">
                {[photo.camera, photo.aperture, photo.shutter]
                  .filter(Boolean)
                  .map((item) => (
                    <span key={item}>{item}</span>
                  ))}
              </div>
            </article>
          ))}
        </motion.div>
        <div className="featured-book-dots" aria-label="Featured slide position">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              aria-label={`Show ${photo.title}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => {
                setDirection(index > current ? 1 : -1);
                setCurrent(index);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
