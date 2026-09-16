"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { DisplayPhoto } from "@/lib/photoDisplay";
import { equipmentLine, lightboxExposureLine, lightboxHeading } from "@/lib/photoDisplay";
import { getPhotoAlt } from "@/lib/photoMedia";
import { useScrollLock } from "@/lib/useScrollLock";

// The same curve the rest of the site animates on — see PortfolioClient and
// the CSS transitions in globals.css.
const EASE = [0.16, 1, 0.3, 1] as const;

interface LightboxProps {
  photo: DisplayPhoto;
  onClose: () => void;
}

export default function Lightbox({ photo, onClose }: LightboxProps) {
  // Respects the OS "reduce motion" setting — the site already honours it in
  // CSS, so the lightbox should not be the one place that ignores it.
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Pinned while open so iOS Safari restores its toolbars and this fixed
  // overlay reaches the bottom of the screen. See useScrollLock.
  useScrollLock(true);

  const exposure = lightboxExposureLine(photo);
  const equipment = equipmentLine(photo);

  return (
    <motion.div
      className="lightbox"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
    >
      <motion.figure
        // The backdrop fades on its own timing; the photo lifts in slightly
        // slower and a touch later, so it reads as arriving rather than as the
        // whole overlay appearing at once.
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}
        transition={{
          duration: reduceMotion ? 0 : 0.52,
          ease: EASE,
          delay: reduceMotion ? 0 : 0.04,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.originalUrl}
          alt={getPhotoAlt(photo, "Photo")}
          width={photo.width}
          height={photo.height}
          decoding="async"
        />
        <motion.figcaption
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.4,
            ease: EASE,
            delay: reduceMotion ? 0 : 0.22,
          }}
        >
          <span className="lightbox-meta-primary">{lightboxHeading(photo)}</span>
          {(exposure || equipment) && (
            <span className="lightbox-meta-cycle">
              {exposure && <span className="lightbox-meta-exposure">{exposure}</span>}
              {equipment && <span className="lightbox-meta-equipment">{equipment}</span>}
            </span>
          )}
        </motion.figcaption>
      </motion.figure>
    </motion.div>
  );
}
