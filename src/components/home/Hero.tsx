"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface HeroProps {
  title?: string;
  tagline?: string;
  bgUrl?: string | null;
  bgAnimation?: "kenburns" | "zoom" | "none";
  bgOverlay?: number;
}

export default function Hero({
  title = "Bunnies.",
  tagline = "A personal photo diary. Slow moments, quiet streets, and honest light, captured on Fujifilm.",
  bgUrl = null,
  bgAnimation = "kenburns",
  bgOverlay = 0.45,
}: HeroProps) {
  const hasBg = !!bgUrl;
  const textColor = hasBg ? "#fff" : "var(--text)";
  const textMid = hasBg ? "rgba(255,255,255,0.8)" : "var(--text-mid)";
  const textFaint = hasBg ? "rgba(255,255,255,0.45)" : "var(--text-faint)";
  const borderColor = hasBg ? "rgba(255,255,255,0.3)" : "var(--border)";
  const linkSecondary = hasBg ? "rgba(255,255,255,0.6)" : "var(--text-light)";

  const bgClass =
    bgAnimation === "kenburns"
      ? "hero-bg-kenburns"
      : bgAnimation === "zoom"
      ? "hero-bg-zoom"
      : "";

  return (
    <section
      className="hero-section"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingLeft: "80px",
        paddingRight: "80px",
        paddingTop: "52px",
        position: "relative",
        overflow: "hidden",
        // Fujifilm gradient shows instantly while hero image loads
        background: "linear-gradient(135deg, #c5d8e3 0%, #b8ccda 50%, #7a9aad 100%)",
      }}
    >
      {/* Background image */}
      {hasBg && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              overflow: "hidden",
            }}
          >
            <Image
              src={bgUrl!}
              alt=""
              fill
              priority
              sizes="100vw"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNjNWQ4ZTMiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzliYjhjOSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzdhOWFhZCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+"
              style={{ objectFit: "cover" }}
              className={bgClass}
            />
          </div>

          {/* White overlay to keep it film-toned & text readable */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background: `rgba(255, 255, 255, ${bgOverlay})`,
            }}
          />
        </>
      )}

      {/* Content — sits above bg */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Top label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "60px",
          }}
        >
          <span
            style={{
              fontSize: "9px",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: textFaint,
            }}
          >
            01
          </span>
          <div style={{ width: "40px", height: "1px", background: borderColor }} />
          <span
            style={{
              fontSize: "9px",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: textFaint,
            }}
          >
            Photo Diary
          </span>
        </motion.div>

        {/* Main heading */}
        <div style={{ maxWidth: "680px" }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "Libre Caslon Display, Georgia, serif",
              fontSize: "clamp(52px, 8vw, 96px)",
              fontWeight: 400,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              color: textColor,
              marginBottom: "32px",
            }}
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "15px",
              color: textMid,
              fontWeight: 300,
              lineHeight: 1.7,
              maxWidth: "380px",
              marginBottom: "48px",
            }}
          >
            {tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", gap: "32px", alignItems: "center" }}
          >
            <Link
              href="/gallery"
              style={{
                fontSize: "11px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: textColor,
                textDecoration: "none",
                borderBottom: `1px solid ${textColor}`,
                paddingBottom: "2px",
              }}
            >
              View Gallery
            </Link>
            <Link
              href="/journal"
              style={{
                fontSize: "11px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: linkSecondary,
                textDecoration: "none",
              }}
            >
              Read Journal
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom right corner info */}
      <motion.div
        className="hero-bottom-info"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        style={{
          position: "absolute",
          bottom: "40px",
          right: "80px",
          textAlign: "right",
          zIndex: 2,
        }}
      >
        <p
          style={{
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: textFaint,
            lineHeight: 2,
          }}
        >
          Fujifilm X-T30 II
          <br />
          Classic Negative
          <br />
          2026
        </p>
      </motion.div>
    </section>
  );
}
