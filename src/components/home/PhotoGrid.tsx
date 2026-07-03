"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { PhotoAsset } from "@/lib/photoMedia";
import {
  buildPhotoSrcSet,
  getPhotoAlt,
  getThumbIntrinsicSize,
} from "@/lib/photoMedia";

interface PhotoGridProps {
  photos: PhotoAsset[];
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function PhotoGrid({ photos }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 0",
          color: "var(--text-faint)",
          fontSize: "13px",
          letterSpacing: "0.1em",
        }}
      >
        No photos yet
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      // Fires the stagger on mount instead of waiting for an IntersectionObserver
      // event. This section is often visible-ish on first paint; whileInView was
      // leaving thumbnails stuck at opacity:0 when the section was already in view.
      animate="show"
      className="photo-mosaic-grid"
    >
      {photos.map((photo, index) => {
        const label = photo.location ?? photo.category ?? photo.theme ?? "Frame";

        return (
          <motion.div
            key={photo.id}
            variants={item}
            className={`photo-mosaic-item photo-mosaic-item-${index + 1}`}
          >
            <Link
              href={`/gallery?photo=${photo.id}`}
              aria-label={`Open ${getPhotoAlt(photo, "photo")} in gallery`}
              className="photo-mosaic-link"
            >
              <motion.div
                whileHover="hovered"
                className="photo-mosaic-frame"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  background:
                    "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 50%, #7a9aad 100%)",
                }}
              >
                <motion.div
                  variants={{
                    hovered: {
                      scale: 1.05,
                      filter: "saturate(1.15) brightness(1.06) contrast(1.05)",
                    },
                  }}
                  initial={{ filter: "saturate(1) brightness(1) contrast(1)" }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  style={{ width: "100%", height: "100%" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.originalUrl}
                    srcSet={buildPhotoSrcSet(photo)}
                    sizes={
                      index === 0
                        ? "(max-width: 768px) 100vw, 48vw"
                        : "(max-width: 768px) 50vw, 24vw"
                    }
                    alt={getPhotoAlt(photo, "Photo")}
                    width={getThumbIntrinsicSize(photo).width}
                    height={getThumbIntrinsicSize(photo).height}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                    }}
                  />
                </motion.div>
              </motion.div>
              <div className="photo-mosaic-caption" aria-hidden="true">
                <span>{label}</span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
