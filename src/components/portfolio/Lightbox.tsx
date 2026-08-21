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
