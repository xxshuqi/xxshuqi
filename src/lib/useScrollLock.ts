"use client";

import { useEffect, useLayoutEffect } from "react";

// useLayoutEffect warns when React renders on the server. The lightbox and the
// nav drawer only ever mount from client state, so this never fires during SSR
// — but the guard keeps the warning away if that changes.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
 * ── Why useLayoutEffect, not useEffect ──────────────────────────────────────
 *
 * Releasing the lock is two steps: clear the styles, which drops the document
 * back to scroll 0 because the negative offset was the only thing holding the
 * position, then scroll back. A useEffect cleanup runs *after* the browser has
 * painted, so that pair could straddle a painted frame and the page visibly
 * jolted — measured at ~10 CSS px, settling back about 300ms later. It only
 * became visible when the shutter flash that used to cover the close was
 * removed. useLayoutEffect runs its cleanup synchronously before paint, so
 * there is no frame in between to see.
 *
 * Used by both the lightbox and the mobile nav drawer — keep it in one place so
 * a fix to this rather subtle workaround applies to both.
 */
export function useScrollLock(locked: boolean) {
  useIsomorphicLayoutEffect(() => {
    if (!locked) return;

    const { body } = document;
    // Rounded: window.scrollY is fractional at non-integer zoom or on some
    // trackpads, and a fractional offset in, integer out is its own small jump.
    const scrollY = Math.round(window.scrollY);
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      overflowAnchor: body.style.overflowAnchor,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    // The document shrinks to viewport height while pinned and grows back on
    // release. Chrome's scroll anchoring tries to compensate for that on its
    // own, which fights the scrollTo below.
    body.style.overflowAnchor = "none";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
      // Restored last, so scroll anchoring stays disabled across the scrollTo
      // above rather than re-engaging midway through it.
      body.style.overflowAnchor = previous.overflowAnchor;
    };
  }, [locked]);
}
