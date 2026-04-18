"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface Photo {
  id: string;
  originalUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  caption?: string | null;
  camera?: string | null;
  aperture?: string | null;
  shutter?: string | null;
  filmSim?: string | null;
}

interface FeaturedStoryProps {
  photo: Photo | null;
}

export default function FeaturedStory({ photo }: FeaturedStoryProps) {
  if (!photo) {
    return (
      <div
        className="featured-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "60px",
          alignItems: "center",
          padding: "80px 0",
        }}
      >
        <div
          style={{
            aspectRatio: "4/5",
            background:
              "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 100%)",
          }}
        />
        <div>
          <p style={{ color: "var(--text-faint)", fontSize: "13px" }}>
            No featured photo yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="featured-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "80px",
        alignItems: "center",
      }}
    >
      <Link href={`/gallery?photo=${photo.id}`} style={{ display: "block" }}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        whileHover="hovered"
        style={{
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 50%, #7a9aad 100%)",
          cursor: "pointer",
        }}
      >
        <motion.div
          variants={{
            hovered: { scale: 1.04, filter: "saturate(1.15) brightness(1.06) contrast(1.05)" },
          }}
          initial={{ filter: "saturate(1) brightness(1) contrast(1)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src={photo.originalUrl}
            alt={photo.caption ?? "Featured photo"}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
        </motion.div>
      </motion.div>
      </Link>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        {photo.filmSim && (
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "20px",
            }}
          >
            {photo.filmSim}
          </p>
        )}

        {photo.caption && (
          <p
            style={{
              fontFamily: "Crimson Pro, Georgia, serif",
              fontSize: "28px",
              fontWeight: 300,
              lineHeight: 1.4,
              color: "var(--text)",
              marginBottom: "32px",
            }}
          >
            &ldquo;{photo.caption}&rdquo;
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          {[
            photo.camera,
            photo.aperture,
            photo.shutter,
          ]
            .filter(Boolean)
            .map((val, i) => (
              <span
                key={i}
                style={{
                  fontSize: "11px",
                  color: "var(--text-light)",
                  fontWeight: 300,
                }}
              >
                {val}
              </span>
            ))}
        </div>

        <Link
          href="/gallery"
          style={{
            fontSize: "11px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--text)",
            textDecoration: "none",
            borderBottom: "1px solid var(--text)",
            paddingBottom: "2px",
          }}
        >
          View All Photos
        </Link>
      </motion.div>
    </div>
  );
}
