"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/gallery", label: "Gallery" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
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
        The Wandering Bunny.
      </Link>

      <div style={{ display: "flex", gap: "36px", alignItems: "center" }}>
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
    </nav>
  );
}
