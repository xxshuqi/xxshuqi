"use client";

import { useEffect, useRef, useState } from "react";

/**
 * On-screen viewport readout for debugging the iOS Safari top/bottom seams.
 *
 * Only mounts when the URL carries ?debug=1, so normal visitors never see it.
 * Tracks the WORST value seen for each metric, so the numbers survive until a
 * screenshot is taken — the seam only appears mid-scroll and would otherwise be
 * gone by the time you look.
 */

// Bumped by hand on each debug deploy so a screenshot proves which build the
// phone actually loaded (rules out Safari serving a cached page).
const BUILD = "probe-4-abs";

type Row = { k: string; v: string; bad?: boolean };

export default function ViewportProbe() {
  const [on, setOn] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const selfRef = useRef<HTMLDivElement>(null);
  const worst = useRef({ hdrTop: 0, hdrAt: 0, introShort: 0, introAt: 0, vvOff: 0 });

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    setOn(true);
  }, []);

  useEffect(() => {
    if (!on) return;
    const vv = window.visualViewport;

    const sample = () => {
      const w = worst.current;
      const hdr = document.querySelector(".sidebar-topbar");
      const intro = document.querySelector(".intro-overlay");
      const scrollY = Math.round(window.scrollY);

      // sticky top:0 — rect.top should be exactly 0 at all times.
      let hdrTop = 0;
      if (hdr) {
        hdrTop = hdr.getBoundingClientRect().top;
        if (hdrTop > w.hdrTop) { w.hdrTop = hdrTop; w.hdrAt = scrollY; }
      }
      // overlay should reach the bottom of the visible area.
      let introShort = 0;
      if (intro && vv) {
        introShort = vv.height - intro.getBoundingClientRect().bottom;
        if (introShort > w.introShort) { w.introShort = introShort; w.introAt = scrollY; }
      }
      if (vv && Math.abs(vv.offsetTop) > Math.abs(w.vvOff)) w.vvOff = vv.offsetTop;

      const selfTop = selfRef.current?.getBoundingClientRect().top ?? 0;
      const padTop = getComputedStyle(document.documentElement)
        .getPropertyValue("--topbar-pad-top").trim() || "(unset)";

      setRows([
        { k: "BUILD", v: BUILD },
        { k: "dvh", v: CSS.supports("height", "100dvh") ? "yes" : "NO", bad: !CSS.supports("height", "100dvh") },
        { k: "vp-fit", v: /viewport-fit/.test(
            document.querySelector('meta[name=viewport]')?.getAttribute("content") || "")
            ? "STILL COVER" : "clean",
          bad: /viewport-fit/.test(document.querySelector('meta[name=viewport]')?.getAttribute("content") || "") },
        { k: "--pad-top", v: padTop, bad: padTop !== "0px" && padTop !== "(unset)" },
        { k: "grain", v: (() => {
          const a = getComputedStyle(document.body, "::after");
          return a.content === "none" ? "OFF" : `on/${a.position}`;
        })() },
        { k: "intro h", v: intro ? getComputedStyle(intro).height : "unmounted" },
        { k: "—", v: "—" },
        { k: "innerH", v: String(window.innerHeight) },
        { k: "clientH", v: String(document.documentElement.clientHeight) },
        { k: "vv.h", v: vv ? vv.height.toFixed(1) : "n/a" },
        { k: "inner−vv", v: vv ? (window.innerHeight - vv.height).toFixed(1) : "n/a",
          bad: !!vv && Math.abs(window.innerHeight - vv.height) > 1 },
        { k: "vv.offTop", v: vv ? vv.offsetTop.toFixed(1) : "n/a", bad: !!vv && Math.abs(vv.offsetTop) > 0.5 },
        { k: "vv.pageTop", v: vv ? vv.pageTop.toFixed(1) : "n/a" },
        { k: "vv.scale", v: vv ? vv.scale.toFixed(3) : "n/a" },
        { k: "scrollY", v: String(scrollY) },
        { k: "—", v: "—" },
        { k: "hdr.top", v: hdrTop.toFixed(1), bad: hdrTop > 0.5 },
        { k: "hdr MAX", v: `${w.hdrTop.toFixed(1)} @${w.hdrAt}`, bad: w.hdrTop > 0.5 },
        { k: "intro short", v: introShort.toFixed(1), bad: introShort > 0.5 },
        { k: "intro MAX", v: `${w.introShort.toFixed(1)} @${w.introAt}`, bad: w.introShort > 0.5 },
        { k: "vvOff MAX", v: w.vvOff.toFixed(1), bad: Math.abs(w.vvOff) > 0.5 },
        { k: "probe.top", v: selfTop.toFixed(1) },
      ]);
    };

    sample();
    const id = window.setInterval(sample, 100);
    const opts = { passive: true } as AddEventListenerOptions;
    window.addEventListener("scroll", sample, opts);
    window.addEventListener("resize", sample, opts);
    vv?.addEventListener("resize", sample);
    vv?.addEventListener("scroll", sample);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("scroll", sample, opts);
      window.removeEventListener("resize", sample, opts);
      vv?.removeEventListener("resize", sample);
      vv?.removeEventListener("scroll", sample);
    };
  }, [on]);

  if (!on) return null;

  return (
    <div
      ref={selfRef}
      style={{
        position: "fixed",
        // Vertically centred so it never covers the top or bottom seam itself.
        top: "50%",
        left: 8,
        transform: "translateY(-50%)",
        zIndex: 100000,
        background: "rgba(0,0,0,0.88)",
        color: "#7CFF9B",
        font: "500 11px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        padding: "8px 10px",
        borderRadius: 6,
        pointerEvents: "none",
        minWidth: 168,
      }}
    >
      {rows.map((r, i) =>
        r.k === "—" ? (
          <div key={i} style={{ borderTop: "1px solid #444", margin: "4px 0" }} />
        ) : (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#8a8a8a" }}>{r.k}</span>
            <span style={{ color: r.bad ? "#FF6B6B" : "#7CFF9B", fontWeight: r.bad ? 700 : 500 }}>
              {r.v}
            </span>
          </div>
        )
      )}
    </div>
  );
}
