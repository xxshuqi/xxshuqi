"use client";

import { useEffect } from "react";
import type { DisplayPhoto } from "@/lib/photoDisplay";
import { equipmentLine, lightboxExposureLine, lightboxHeading } from "@/lib/photoDisplay";
import { getPhotoAlt } from "@/lib/photoMedia";

interface LightboxProps {
  photo: DisplayPhoto;
  onClose: () => void;
}

export default function Lightbox({ photo, onClose }: LightboxProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock the background scroll while the lightbox is open. On iOS Safari a
  // scrollable page behind a fixed overlay lets the toolbar move and leaves
  // strips of the page showing above/below the overlay. Pinning the body
  // (position: fixed at the current offset) freezes it, so the fixed
  // lightbox reliably covers the whole screen — restored + re-scrolled on close.
  useEffect(() => {
    const { body } = document;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const exposure = lightboxExposureLine(photo);
  const equipment = equipmentLine(photo);

  return (
    <div className="lightbox" onClick={onClose}>
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.originalUrl}
          alt={getPhotoAlt(photo, "Photo")}
          width={photo.width}
          height={photo.height}
          decoding="async"
        />
        <figcaption>
          <span className="lightbox-meta-primary">{lightboxHeading(photo)}</span>
          {(exposure || equipment) && (
            <span className="lightbox-meta-cycle">
              {exposure && <span className="lightbox-meta-exposure">{exposure}</span>}
              {equipment && <span className="lightbox-meta-equipment">{equipment}</span>}
            </span>
          )}
        </figcaption>
      </figure>
    </div>
  );
}
