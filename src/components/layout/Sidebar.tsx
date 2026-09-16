"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useScrollLock } from "@/lib/useScrollLock";

const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/xxshuqi/",
  email: "mailto:shuqi_520@outlook.com",
};

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect
        x="2.75"
        y="5"
        width="18.5"
        height="14"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.6 6.6 L12 12.6 L20.4 6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // The drawer and its scrim are full-viewport fixed overlays. Without this
  // they stop at the layout viewport and leave a grey band of bare scrim along
  // the bottom of the screen once Safari has retracted its toolbars.
  useScrollLock(open);

  const socials = (
    <div className="sidebar-socials">
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="sidebar-social-link"
      >
        <InstagramIcon />
      </a>
      <a
        href={SOCIAL_LINKS.email}
        aria-label="Email ShuQi"
        className="sidebar-social-link"
      >
        <MailIcon />
      </a>
    </div>
  );

  return (
    <>
      {/* Mobile header — position: sticky (see globals.css). Because it's
          painted with the page content, it never lags iOS Safari's toolbar
          transitions, so no gap opens above it. Its padding-top is the
          safe-area inset, which is 0 in Safari's browser mode and only
          non-zero when the site runs standalone from the Home Screen. */}
      <div className="sidebar-topbar">
        <Link href="/" className="sidebar-topbar-title" onClick={() => setOpen(false)}>
          The Wandering Bunny
        </Link>
        <button
          type="button"
          className="sidebar-menu-toggle"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </div>

      <aside className="sidebar" data-open={open}>
        <div className="sidebar-inner">
          <Link href="/" className="sidebar-title" onClick={() => setOpen(false)}>
            The Wandering Bunny
          </Link>

          <nav className="sidebar-nav" aria-label="Primary navigation">
            <Link
              href="/"
              className="sidebar-link"
              /* /portfolio/ still resolves, as a redirect, so keep it active there too. */
              data-active={pathname === "/" || pathname?.startsWith("/portfolio")}
              onClick={() => setOpen(false)}
            >
              Portfolio
            </Link>

            <Link
              href="/about"
              className="sidebar-link"
              data-active={pathname?.startsWith("/about")}
              onClick={() => setOpen(false)}
            >
              About
            </Link>

            {socials}
          </nav>

          <p className="sidebar-copyright">
            © 2026 The Wandering Bunny. All rights reserved.
          </p>
        </div>
      </aside>

      {open && <button type="button" className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    </>
  );
}
