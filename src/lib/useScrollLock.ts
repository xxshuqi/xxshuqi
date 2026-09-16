"use client";

import { useEffect } from "react";

/**
 * Pins <body> at its current scroll offset while `locked` is true, and restores
 * both the styles and the scroll position when it goes false.
 *
 * This exists for iOS Safari. A full-viewport `position: fixed` overlay is sized
 * to the *layout* viewport, but once the toolbars retract the *visible* area is
 * taller — measured on device, 742 against 850. The overlay then stops short of
 * the bottom of the screen and whatever is painted behind it shows through in
 * the leftover band. That was the grey strip under the open nav drawer, and the
 * same mechanism produced the seam above the sticky header.
 *
 * Pinning the body takes it out of flow, so the document collapses to viewport
 * height. With nothing left to scroll, Safari restores its toolbars, the layout
 * viewport matches the visual viewport again, and a fixed overlay covers the
 * screen edge to edge.
 *
 * Used by both the lightbox and the mobile nav drawer — keep it in one place so
 * a fix to this rather subtle workaround applies to both.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
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
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      // Restoring the styles alone drops the page back to the top, because the
      // negative offset was the only thing holding the position.
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
