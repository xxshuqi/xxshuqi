"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { PhotoAsset } from "@/lib/photoMedia";
import {
  buildPhotoSrcSet,
  getPhotoAlt,
  getThumbIntrinsicSize,
} from "@/lib/photoMedia";

interface FeaturedStoryProps {
  photo: PhotoAsset | null;
}

export default function FeaturedStory({ photo }: FeaturedStoryProps) {
  if (!photo) {
    return (
      <div
        className="featured-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 1.05fr) minmax(260px, 0.95fr)",
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
        gridTemplateColumns: "minmax(320px, 1.05fr) minmax(260px, 0.95fr)",
        gap: "56px",
        alignItems: "center",
      }}
    >
      <Link
        href={`/gallery?photo=${photo.id}`}
        style={{
          display: "block",
          minWidth: 0,
          width: "100%",
          maxWidth: "640px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          whileHover="hovered"
          style={{ width: "100%" }}
        >
          <motion.div
            style={{
              position: "relative",
              overflow: "hidden",
              background:
                "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 50%, #7a9aad 100%)",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <motion.div
              variants={{
                hovered: {
                  scale: 1.04,
                  filter: "saturate(1.15) brightness(1.06) contrast(1.05)",
                },
              }}
              initial={{ filter: "saturate(1) brightness(1) contrast(1)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: "100%" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                srcSet={buildPhotoSrcSet(photo)}
                sizes="(max-width: 768px) 100vw, 46vw"
                alt={getPhotoAlt(photo, "Featured photo")}
                width={getThumbIntrinsicSize(photo).width}
                height={getThumbIntrinsicSize(photo).height}
                decoding="async"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </Link>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: "420px" }}
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

        {photo.title && (
          <h2
            style={{
              fontFamily: "DM Sans, system-ui, sans-serif",
              fontSize: "40px",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: "var(--text)",
              marginBottom: "16px",
            }}
          >
            {photo.title}
          </h2>
        )}

        {photo.caption && (
          <p
            style={{
              fontFamily: "DM Sans, system-ui, sans-serif",
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
