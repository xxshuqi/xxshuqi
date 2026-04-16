"use client";

import Image from "next/image";
import { useState } from "react";
import ExifBadge from "./ExifBadge";

interface Photo {
  id: string;
  thumbUrl: string;
  originalUrl: string;
  width: number;
  height: number;
  caption?: string | null;
  camera?: string | null;
  lens?: string | null;
  aperture?: string | null;
  shutter?: string | null;
  iso?: string | null;
  filmSim?: string | null;
  category?: string | null;
}

interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
  showExif?: boolean;
}

export default function PhotoCard({
  photo,
  onClick,
  showExif = false,
}: PhotoCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: onClick ? "pointer" : "default",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 50%, #7a9aad 100%)",
          aspectRatio: `${photo.width} / ${photo.height}`,
        }}
      >
        <Image
          src={photo.thumbUrl}
          alt={photo.caption ?? "Photo"}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          style={{
            objectFit: "cover",
            transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: hovered && onClick ? "scale(1.03)" : "scale(1)",
          }}
        />

        {/* Category tag */}
        {photo.category && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              fontSize: "9px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.85)",
              padding: "3px 6px",
              background: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(4px)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          >
            {photo.category}
          </div>
        )}
      </div>

      {(photo.caption || showExif) && (
        <div style={{ paddingTop: "8px" }}>
          {photo.caption && (
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-mid)",
                fontWeight: 300,
                lineHeight: 1.5,
              }}
            >
              {photo.caption}
            </p>
          )}
          {showExif && (
            <ExifBadge
              camera={photo.camera}
              lens={photo.lens}
              aperture={photo.aperture}
              shutter={photo.shutter}
              iso={photo.iso}
              filmSim={photo.filmSim}
            />
          )}
        </div>
      )}
    </div>
  );
}
