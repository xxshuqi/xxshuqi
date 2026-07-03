"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import AnimatedBunny from "./AnimatedBunny";

export default function Nav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHidden(window.scrollY > 96);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className="site-menu"
      aria-label="Site navigation"
      initial={{ x: "-50%", y: "42vh", opacity: 0, scale: 0.94 }}
      animate={{
        x: "-50%",
        y: hidden ? -120 : 0,
        opacity: hidden ? 0 : 1,
        scale: hidden ? 0.96 : 1,
      }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href="/" className="site-menu-mark" aria-label="The Wandering Bunny home">
        <AnimatedBunny />
      </Link>

      <LayoutGroup>
        <div className="site-menu-links">
          <Link
            href="/gallery"
            className="site-menu-link"
            data-active={pathname.startsWith("/gallery")}
            aria-current={pathname.startsWith("/gallery") ? "page" : undefined}
          >
            {pathname.startsWith("/gallery") && (
              <motion.span
                className="site-menu-active-indicator"
                layoutId="site-menu-active-indicator"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="site-menu-link-label">Gallery</span>
          </Link>

          <Link
            href="/about"
            className="site-menu-link"
            data-active={pathname.startsWith("/about")}
            aria-current={pathname.startsWith("/about") ? "page" : undefined}
          >
            {pathname.startsWith("/about") && (
              <motion.span
                className="site-menu-active-indicator"
                layoutId="site-menu-active-indicator"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="site-menu-link-label">About Me</span>
          </Link>
        </div>
      </LayoutGroup>
    </motion.nav>
  );
}
