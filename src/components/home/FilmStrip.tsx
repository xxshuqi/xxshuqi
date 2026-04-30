"use client";

import { useEffect, useRef, useState } from "react";
import type { PhotoAsset } from "@/lib/photoMedia";
import { getPhotoAlt } from "@/lib/photoMedia";

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
  const [paused, setPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const directionRef = useRef(1);

  if (photos.length === 0) return null;

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    let rafId = 0;
    let lastTime = 0;

    const tick = (time: number) => {
      if (!lastTime) lastTime = time;
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (!paused) {
        const maxScroll = Math.max(0, node.scrollWidth - node.clientWidth);
        if (maxScroll > 0) {
          const nextLeft =
            node.scrollLeft + directionRef.current * SPEED_PX_PER_SEC * delta;
          if (nextLeft >= maxScroll) {
            node.scrollLeft = maxScroll;
            directionRef.current = -1;
          } else if (nextLeft <= 0) {
            node.scrollLeft = 0;
            directionRef.current = 1;
          } else {
            node.scrollLeft = nextLeft;
          }
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [paused]);

  return (
    <>
      <style>{`
        .filmstrip-scroll {
          scrollbar-width: none;
        }
        .filmstrip-scroll::-webkit-scrollbar {
          display: none;
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
            ref={scrollerRef}
            className="filmstrip-scroll"
            data-contact-sheet
            style={{ overflowX: "auto", overflowY: "hidden" }}
          >
            <div
              style={{
                display: "flex",
                gap: `${ITEM_GAP}px`,
                width: "max-content",
                padding: "0 12px",
              }}
            >
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
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
                    {String(index + 1).padStart(2, "0")}A
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Perforations />
      </div>
    </>
  );
}
