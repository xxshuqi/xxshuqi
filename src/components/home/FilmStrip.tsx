import type { PhotoAsset } from "@/lib/photoMedia";
import { getPhotoAlt } from "@/lib/photoMedia";
import type { CSSProperties } from "react";

interface FilmStripProps {
  photos: PhotoAsset[];
}

const ITEM_WIDTH = 140;
const ITEM_GAP = 8;
const SPEED_PX_PER_SEC = 28;

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
  if (photos.length === 0) return null;

  const sequenceWidth = photos.length * (ITEM_WIDTH + ITEM_GAP);
  const duration = Math.max(18, sequenceWidth / SPEED_PX_PER_SEC);
  const repeatedPhotos = [...photos, ...photos];

  return (
    <>
      <style>{`
        @keyframes filmstrip-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        .filmstrip-track {
          animation: filmstrip-marquee var(--filmstrip-duration) linear infinite;
          display: flex;
          gap: ${ITEM_GAP}px;
          padding: 0 12px;
          width: max-content;
          will-change: transform;
        }
        .filmstrip-track:hover {
          animation-play-state: paused;
        }
        .filmstrip-frame {
          flex-shrink: 0;
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
        >
          <div
            className="filmstrip-track"
            data-contact-sheet
            style={{ "--filmstrip-duration": `${duration}s` } as CSSProperties}
          >
            {repeatedPhotos.map((photo, index) => (
              <div
                key={`${photo.id}-${index}`}
                className="filmstrip-frame"
                style={{
                  width: `${ITEM_WIDTH}px`,
                  height: "100px",
                  position: "relative",
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #2a3a45 0%, #1a2a35 100%)",
                  filter: "saturate(0.7) contrast(1.1)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbUrl}
                  alt={getPhotoAlt(photo, "")}
                  width="140"
                  height="100"
                  loading="lazy"
                  decoding="async"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.9,
                  }}
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
                  {String((index % photos.length) + 1).padStart(2, "0")}A
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
