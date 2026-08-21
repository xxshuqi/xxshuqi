"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Photo } from "@/lib/data";
import { toDisplayPhotos, type DisplayPhoto } from "@/lib/photoDisplay";
import { buildPhotoSrcSet, getPhotoAlt, getThumbIntrinsicSize } from "@/lib/photoMedia";
import Lightbox from "./Lightbox";

const SHUTTER_DELAY_MS = 170;
const SHUTTER_TOTAL_MS = 540;
const WIDE_COLUMN_COUNT = 3;
const NARROW_COLUMN_COUNT = 2;
const WIDE_BREAKPOINT_PX = 1201;
const MOBILE_BREAKPOINT_PX = 760;
const SIDEBAR_WIDTH_PX = 260;

// A couple of trailing frames are pinned to sit right after another frame's
// column, keeping the last few images evenly spread regardless of screen size.
const ATTACH_AFTER: Record<string, string> = {
  "093": "092",
  "094": "091",
};

// Swap which column these frame pairs land in, but only at the narrow
// (2-column) breakpoint — the desktop layout is left as the algorithm finds it.
const MOBILE_SWAP_PAIRS: [string, string][] = [
  ["003", "004"],
  ["083", "084"],
];

// Mirrors the .portfolio-page / .portfolio-columns CSS at each breakpoint so
// the estimated gap-to-column-width ratio used for balancing matches reality.
function computeLayoutMetrics(viewportWidth: number) {
  const isWide = viewportWidth >= WIDE_BREAKPOINT_PX;
  const isMobile = viewportWidth <= MOBILE_BREAKPOINT_PX;
  const columnCount = isWide ? WIDE_COLUMN_COUNT : NARROW_COLUMN_COUNT;
  const sidebarWidth = isMobile ? 0 : SIDEBAR_WIDTH_PX;
  const gapPx = isMobile ? 10 : 16;
  const paddingPx = isMobile ? 14 : Math.min(48, Math.max(24, viewportWidth * 0.03));
  const contentWidth = viewportWidth - sidebarWidth - paddingPx * 2;
  const columnWidth = (contentWidth - gapPx * (columnCount - 1)) / columnCount;
  const gapRatio = columnWidth > 0 ? gapPx / columnWidth : 0;
  return { columnCount, gapRatio };
}

function useLayoutMetrics() {
  const [metrics, setMetrics] = useState(() => computeLayoutMetrics(1280));

  useEffect(() => {
    const sync = () => setMetrics(computeLayoutMetrics(window.innerWidth));
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return metrics;
}

interface PortfolioClientProps {
  photos: Photo[];
}

export default function PortfolioClient({ photos }: PortfolioClientProps) {
  const frames = useMemo(() => toDisplayPhotos(photos), [photos]);
  const { columnCount, gapRatio } = useLayoutMetrics();
  const columns = useMemo(() => {
    const estHeight = (photo: DisplayPhoto) => photo.height / photo.width + gapRatio;
    const pinned = new Set(Object.keys(ATTACH_AFTER));
    const heights = Array.from({ length: columnCount }, () => 0);
    const result: DisplayPhoto[][] = Array.from({ length: columnCount }, () => []);

    frames.forEach((photo) => {
      let shortest = 0;
      for (let i = 1; i < columnCount; i++) {
        if (heights[i] < heights[shortest]) shortest = i;
      }
      result[shortest].push(photo);
      heights[shortest] += estHeight(photo);
    });

    // Nudge trailing photos from the tallest column to the shortest one
    // whenever that narrows the gap, so columns end close to level.
    for (let pass = 0; pass < columnCount * 6; pass++) {
      let tallest = 0;
      let shortest = 0;
      for (let i = 1; i < columnCount; i++) {
        if (heights[i] > heights[tallest]) tallest = i;
        if (heights[i] < heights[shortest]) shortest = i;
      }
      if (tallest === shortest) break;

      let moveIndex = -1;
      for (let i = result[tallest].length - 1; i >= 0; i--) {
        if (!pinned.has(result[tallest][i].num)) {
          moveIndex = i;
          break;
        }
      }
      if (moveIndex === -1) break;

      const photo = result[tallest][moveIndex];
      const h = estHeight(photo);
      const currentGap = heights[tallest] - heights[shortest];
      const newGap = Math.abs(heights[tallest] - h - (heights[shortest] + h));
      if (newGap >= currentGap) break;

      result[tallest].splice(moveIndex, 1);
      result[shortest].push(photo);
      heights[tallest] -= h;
      heights[shortest] += h;
    }

    Object.entries(ATTACH_AFTER).forEach(([moveNum, afterNum]) => {
      const moveColumn = result.find((column) => column.some((photo) => photo.num === moveNum));
      const moveIndex = moveColumn?.findIndex((photo) => photo.num === moveNum) ?? -1;
      if (!moveColumn || moveIndex === -1) return;
      const [moved] = moveColumn.splice(moveIndex, 1);

      const targetColumn = result.find((column) => column.some((photo) => photo.num === afterNum));
      const targetIndex = targetColumn?.findIndex((photo) => photo.num === afterNum) ?? -1;
      if (!targetColumn || targetIndex === -1) return;
      targetColumn.splice(targetIndex + 1, 0, moved);
    });

    if (columnCount === NARROW_COLUMN_COUNT) {
      MOBILE_SWAP_PAIRS.forEach(([numA, numB]) => {
        let colA = -1;
        let idxA = -1;
        let colB = -1;
        let idxB = -1;
        result.forEach((column, columnIndex) => {
          const iA = column.findIndex((photo) => photo.num === numA);
          if (iA !== -1) {
            colA = columnIndex;
            idxA = iA;
          }
          const iB = column.findIndex((photo) => photo.num === numB);
          if (iB !== -1) {
            colB = columnIndex;
            idxB = iB;
          }
        });
        if (colA === -1 || colB === -1) return;
        const photoA = result[colA][idxA];
        const photoB = result[colB][idxB];
        result[colA][idxA] = photoB;
        result[colB][idxB] = photoA;
      });
    }

    return result;
  }, [frames, columnCount, gapRatio]);
  const [light, setLight] = useState<DisplayPhoto | null>(null);
  const [shutter, setShutter] = useState(false);

  const triggerShutter = useCallback((action: () => void) => {
    setShutter(true);
    window.setTimeout(action, SHUTTER_DELAY_MS);
    window.setTimeout(() => setShutter(false), SHUTTER_TOTAL_MS);
  }, []);

  const openLightbox = useCallback(
    (photo: DisplayPhoto) => triggerShutter(() => setLight(photo)),
    [triggerShutter]
  );

  const closeLightbox = useCallback(() => triggerShutter(() => setLight(null)), [triggerShutter]);

  return (
    <div className="portfolio-page">
      <motion.div
        className="portfolio-columns"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {columns.map((column, columnIndex) => (
          <div className="portfolio-column" key={columnIndex}>
            {column.map((photo) => {
              const intrinsic = getThumbIntrinsicSize(photo);
              const index = Number(photo.num) - 1;
              return (
                <button
                  key={photo.id}
                  type="button"
                  className="portfolio-frame"
                  data-orientation={photo.orientation}
                  onClick={() => openLightbox(photo)}
                  aria-label={`Open ${getPhotoAlt(photo, "photo")}`}
                >
                  <span className="portfolio-image-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbUrl}
                      srcSet={buildPhotoSrcSet(photo)}
                      alt={getPhotoAlt(photo, "Photo")}
                      width={intrinsic.width}
                      height={intrinsic.height}
                      sizes="(max-width: 640px) 46vw, (max-width: 1100px) 30vw, 22vw"
                      loading={index < 6 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </motion.div>

      {light && <Lightbox photo={light} onClose={closeLightbox} />}
      {shutter && <div className="lightbox-shutter" />}
    </div>
  );
}
