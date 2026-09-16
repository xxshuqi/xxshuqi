"use client";

import { useEffect, useLayoutEffect } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Stops the page scrolling while `locked` is true.
 *
 * Locks with `overflow: hidden` on <html>, which freezes scrolling **without
 * touching the scroll position**. Nothing is saved and nothing is restored, so
 * there is no moment where the page sits at the wrong offset — the class of bug
 * that made closing the lightbox jolt.
 *
 * ── What this replaced, and why ─────────────────────────────────────────────
 *
 * This used to pin <body> with `position: fixed; top: -scrollY`. That is the
 * common recipe, and it works, but releasing it is inherently two steps: clear
 * the styles, which drops the document to scroll 0 because the negative offset
 * was the only thing holding the position, then scroll back. Those two steps
 * can straddle a painted frame and the page visibly jolts — measured at ~10 CSS
 * px off a screen recording, settling back about 300ms later.
 *
 * Moving the cleanup to useLayoutEffect (before paint) did not fix it, and
 * neither did disabling scroll anchoring. The technique itself is the problem:
 * any approach that destroys the scroll offset and puts it back has a window
 * where the two disagree. Not destroying it removes the window entirely.
 *
 * The trade: `overflow: hidden` is less absolute than a pinned body on iOS
 * Safari, where touch scrolling can still get through in some cases. That was
 * the original reason for the pin — a scrollable page moves Safari's toolbars,
 * which resizes the visual viewport under a fixed overlay. That risk is much
 * smaller now: the film grain no longer sits in a full-viewport fixed layer
 * (see globals.css), which was the actual trigger for the seam, and .lightbox
 * sizes itself with 100dvh so it tracks the visible area on its own.
 *
 * A page that scrolls slightly behind an overlay is a small cosmetic problem.
 * A page that jumps every single time you close one is not.
 */
export function useScrollLock(locked: boolean) {
  useIsomorphicLayoutEffect(() => {
    if (!locked) return;

    const root = document.documentElement;
    const { body } = document;

    // Hiding the scrollbar reclaims its width and shifts the layout sideways.
    // Harmless on macOS, where scrollbars overlay; visible on Windows and Linux
    // as a jump in the other axis, which is what we are here to avoid.
    const scrollbarWidth = window.innerWidth - root.clientWidth;

    const previous = {
      overflow: root.style.overflow,
      paddingRight: body.style.paddingRight,
    };

    root.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + scrollbarWidth}px`;
    }

    return () => {
      root.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [locked]);
}
