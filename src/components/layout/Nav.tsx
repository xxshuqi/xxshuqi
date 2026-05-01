"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const links = [
  { href: "/gallery", label: "Gallery" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
];

function HamburgerIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
      <rect width="20" height="1.5" fill="currentColor" />
      <rect y="6.25" width="20" height="1.5" fill="currentColor" />
      <rect y="12.5" width="20" height="1.5" fill="currentColor" />
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: "52px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "32px",
          paddingRight: "32px",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "Libre Caslon Display, Georgia, serif",
            fontSize: "16px",
            letterSpacing: "0.06em",
            color: "var(--text)",
            textDecoration: "none",
          }}
        >
          The Wandering Bunny
        </Link>

        {/* Desktop links - hidden on mobile via CSS */}
        <div
          className="nav-desktop-links"
          style={{ display: "flex", gap: "36px", alignItems: "center" }}
        >
          {links.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: active ? "var(--text)" : "var(--text-light)",
                  textDecoration: "none",
                  fontWeight: 400,
                  transition: "color 0.2s ease",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Hamburger button - shown only on mobile via CSS */}
        <button
          className="nav-hamburger-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          style={{
            display: "none", // shown via CSS on mobile
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text)",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
            fontSize: "22px",
            lineHeight: 1,
          }}
        >
          {open ? "×" : <HamburgerIcon />}
        </button>
      </nav>

      {/* Mobile full-screen menu overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: "40px",
            paddingRight: "40px",
            paddingTop: "52px",
          }}
        >
          {links.map(({ href, label }, i) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{
                fontFamily: "Libre Caslon Display, Georgia, serif",
                fontSize: "clamp(36px, 10vw, 52px)",
                fontWeight: 400,
                color: "var(--text)",
                textDecoration: "none",
                padding: "20px 0",
                borderBottom: i < links.length - 1 ? "1px solid var(--border)" : "none",
                letterSpacing: "-0.01em",
                display: "block",
              }}
            >
              {label}
            </Link>
          ))}

          <div style={{ marginTop: "48px", display: "flex", gap: "24px" }}>
            {["Gallery", "Journal", "About"].map((_, i) => null)}
          </div>

          <p
            style={{
              position: "absolute",
              bottom: "40px",
              left: "40px",
              fontSize: "10px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
            }}
          >
            The Wandering Bunny · 2026
          </p>
        </div>
      )}
    </>
  );
}
