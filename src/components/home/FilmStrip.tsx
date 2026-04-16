"use client";

import { useState } from "react";
import Image from "next/image";

interface Photo {
  id: string;
  thumbUrl: string;
  width: number;
  height: number;
  caption?: string | null;
}

interface FilmStripProps {
  photos: Photo[];
}

const ITEM_WIDTH = 140;
const ITEM_GAP = 8;
const SPEED_PX_PER_SEC = 28;
const MIN_FILL_PX = 3200;

function Perforations() {
  return (
    <div
      style={{
        height: "20px",
        background: "var(--text)",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        gap: "8px",
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: "10px",
            height: "10px",
            background: "#ffffff",
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function FilmStrip({ photos }: FilmStripProps) {
  const [paused, setPaused] = useState(false);

  if (photos.length === 0) return null;

  const singleWidth =
    photos.length * ITEM_WIDTH + (photos.length - 1) * ITEM_GAP;

  const copies = Math.max(2, Math.ceil(MIN_FILL_PX / singleWidth) + 1);
  const animDistance = singleWidth + ITEM_GAP; // one full set + one gap
  const duration = singleWidth / SPEED_PX_PER_SEC;

  const track = Array.from({ length: copies }, (_, ci) =>
    photos.map((p) => ({ ...p, _key: `${p.id}-${ci}` }))
  ).flat();

  return (
    <>
      <style>{`
        @keyframes filmstrip-loop {
          from { transform: translateX(-${animDistance}px); }
          to   { transform: translateX(0); }
        }
        .filmstrip-track {
          animation: filmstrip-loop ${duration}s linear infinite;
          will-change: transform;
        }
        .filmstrip-track--paused {
          animation-play-state: paused;
        }
        .filmstrip-frame {
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), filter 0.4s ease;
        }
        .filmstrip-frame:hover {
          transform: scale(1.08);
          filter: saturate(1.1) contrast(1.1) brightness(1.1) !important;
          z-index: 1;
        }
      `}</style>

      <div style={{ overflow: "hidden" }}>
        <Perforations />

        <div
          style={{ background: "#1a1a1a", padding: "12px 0", overflow: "hidden", cursor: "pointer" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className={`filmstrip-track${paused ? " filmstrip-track--paused" : ""}`}
            style={{ display: "flex", gap: `${ITEM_GAP}px`, width: "max-content" }}
          >
            {track.map((photo, i) => (
              <div
                key={photo._key}
                className="filmstrip-frame"
                style={{
                  flexShrink: 0,
                  width: `${ITEM_WIDTH}px`,
                  height: "100px",
                  position: "relative",
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #2a3a45 0%, #1a2a35 100%)",
                  filter: "saturate(0.7) contrast(1.1)",
                }}
              >
                <Image
                  src={photo.thumbUrl}
                  alt={photo.caption ?? ""}
                  fill
                  sizes="140px"
                  style={{ objectFit: "cover", opacity: 0.9 }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    right: "6px",
                    fontSize: "9px",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                  }}
                >
                  {String((i % photos.length) + 1).padStart(2, "0")}A
                </span>
              </div>
            ))}
          </div>
        </div>

        <Perforations />
      </div>
    </>
  );
}
