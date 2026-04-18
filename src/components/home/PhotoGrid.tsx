"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Photo {
  id: string;
  thumbUrl: string;
  originalUrl: string;
  width: number;
  height: number;
  caption?: string | null;
  category?: string | null;
}

interface PhotoGridProps {
  photos: Photo[];
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function PhotoGrid({ photos }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 0",
          color: "var(--text-faint)",
          fontSize: "13px",
          letterSpacing: "0.1em",
        }}
      >
        No photos yet
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="photo-grid-4col"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px",
      }}
    >
      {photos.map((photo) => (
        <motion.div key={photo.id} variants={item}>
          <Link href={`/gallery?photo=${photo.id}`} style={{ display: "block" }}>
            <motion.div
              whileHover="hovered"
              style={{
                position: "relative",
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 50%, #7a9aad 100%)",
                aspectRatio: "4 / 5",
              }}
            >
              <motion.div
                variants={{
                  hovered: { scale: 1.05, filter: "saturate(1.15) brightness(1.06) contrast(1.05)" },
                }}
                initial={{ filter: "saturate(1) brightness(1) contrast(1)" }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: "absolute", inset: 0 }}
              >
                <Image
                  src={photo.originalUrl}
                  alt={photo.caption ?? "Photo"}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  style={{ objectFit: "cover" }}
                />
              </motion.div>
            </motion.div>
            {photo.caption && (
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-light)",
                  fontWeight: 300,
                  marginTop: "6px",
                  lineHeight: 1.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {photo.caption}
              </p>
            )}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
