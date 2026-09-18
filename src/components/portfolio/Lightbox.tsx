"use client";

import { useEffect, useState } from "react";
import type { DisplayPhoto } from "@/lib/photoDisplay";
import { equipmentLine, lightboxExposureLine, lightboxHeading } from "@/lib/photoDisplay";
import {
  buildLightboxSources,
  buildThumbSources,
  getPhotoAlt,
  getThumbIntrinsicSize,
  LIGHTBOX_SIZES,
} from "@/lib/photoMedia";
import { useScrollLock } from "@/lib/useScrollLock";

interface LightboxProps {
  photo: DisplayPhoto;
  onClose: () => void;
}

export default function Lightbox({ photo, onClose }: LightboxProps) {
  const [isFullImageLoaded, setIsFullImageLoaded] = useState(false);

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
  const fullSources = buildLightboxSources(photo);
  const previewSources = buildThumbSources(photo);
  const intrinsic = getThumbIntrinsicSize(photo);

  return (
    <div className="lightbox" onClick={onClose}>
      <figure>
        <div className="lightbox-image-stage" data-loaded={isFullImageLoaded}>
          <picture className="lightbox-image-preview" aria-hidden="true">
            <source
              type="image/webp"
              srcSet={previewSources.webpSrcSet}
              sizes={LIGHTBOX_SIZES}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSources.jpegSrc}
              alt=""
              width={intrinsic.width}
              height={intrinsic.height}
            />
          </picture>

          <picture className="lightbox-image-full">
            <source
              type="image/avif"
              srcSet={fullSources.avifSrcSet}
              sizes={LIGHTBOX_SIZES}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.originalUrl}
              alt={getPhotoAlt(photo, "Photo")}
              width={intrinsic.width}
              height={intrinsic.height}
              decoding="async"
              fetchPriority="high"
              onLoad={() => setIsFullImageLoaded(true)}
            />
          </picture>
        </div>
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
