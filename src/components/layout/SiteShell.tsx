"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";

const INTRO_STORAGE_KEY = "wanderingbunny-intro-shown";
const HOLD_MS = 1800;

function hasSeenIntro() {
  try {
    return sessionStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
  } catch {
    // ignore — sessionStorage unavailable, intro will just replay next time
  }
}

export default function SiteShell({ children }: { children: ReactNode }) {
  // Defaults to true so the very first paint (server-rendered HTML, before
  // hydration) always covers the sidebar/content — nothing to flash behind it.
  const [showIntro, setShowIntro] = useState(true);

  useLayoutEffect(() => {
    if (hasSeenIntro()) {
      // Resolves before the browser paints the hydrated result, so repeat
      // visitors never see the overlay at all.
      setShowIntro(false);
      return;
    }

    const timer = window.setTimeout(() => {
      markIntroSeen();
      setShowIntro(false);
    }, HOLD_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="site-shell">
      <Sidebar />
      <div className="site-content">{children}</div>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="intro-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              Photographs shot on Fujifilm.
            </motion.p>
            <motion.span
              className="intro-overlay-contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              @thewanderingbunny.com
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
