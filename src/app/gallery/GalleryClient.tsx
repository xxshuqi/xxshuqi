"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import SectionLabel from "@/components/ui/SectionLabel";
import ScrollReveal from "@/components/ui/ScrollReveal";
import ExifBadge from "@/components/ui/ExifBadge";

interface Photo {
  id: string;
  thumbUrl: string;
  originalUrl: string;
  width: number;
  height: number;
  caption?: string | null;
  category?: string | null;
  camera?: string | null;
  lens?: string | null;
  aperture?: string | null;
  shutter?: string | null;
  iso?: string | null;
  filmSim?: string | null;
}

interface GalleryClientProps {
  photos: Photo[];
}

const CATEGORIES = ["all", "travel", "street", "portrait", "food", "landscape", "architecture"];

// Tiny component that reads ?photo= and scrolls/highlights the target.
// Wrapped in Suspense so the parent GalleryClient can be statically rendered.
function PhotoHighlight() {
  const searchParams = useSearchParams();
  const targetPhotoId = searchParams.get("photo");

  useEffect(() => {
    if (!targetPhotoId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`photo-${targetPhotoId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("photo-highlight");
        setTimeout(() => el.classList.remove("photo-highlight"), 1800);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [targetPhotoId]);

  return null;
}

export default function GalleryClient({ photos }: GalleryClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  // Filter by category
  const filtered = activeCategory === "all"
    ? photos
    : photos.filter((p) => p.category === activeCategory);

  const landscapePhotos = filtered.filter((p) => p.width > p.height);
  const portraitPhotos = filtered.filter((p) => p.width <= p.height);

  // Close lightbox on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const PhotoCard = useCallback(
    ({ photo, sizes }: { photo: Photo; sizes: string }) => (
      <ScrollReveal>
        <div id={`photo-${photo.id}`}>
          <div
            onClick={() => setLightbox(photo)}
            style={{
              position: "relative",
              overflow: "hidden",
              background: "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 50%, #7a9aad 100%)",
              aspectRatio: `${photo.width} / ${photo.height}`,
              cursor: "pointer",
            }}
          >
            <Image
              src={photo.thumbUrl}
              alt={photo.caption ?? ""}
              fill
              sizes={sizes}
              style={{ objectFit: "cover" }}
            />
          </div>

          {photo.caption && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-light)",
                marginTop: "6px",
                fontWeight: 300,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {photo.caption}
            </p>
          )}
        </div>
      </ScrollReveal>
    ),
    []
  );

  return (
    <div style={{ paddingTop: "52px" }}>
      {/* Deep-link: rendered outside Suspense boundary so it doesn't block static HTML */}
      <Suspense fallback={null}>
        <PhotoHighlight />
      </Suspense>

      <style>{`
        @keyframes photo-pulse {
          0%   { outline: 2px solid transparent; outline-offset: 4px; }
          20%  { outline: 2px solid var(--accent); outline-offset: 4px; }
          80%  { outline: 2px solid var(--accent); outline-offset: 4px; }
          100% { outline: 2px solid transparent; outline-offset: 4px; }
        }
        .photo-highlight { animation: photo-pulse 1.6s ease forwards; }
      `}</style>

      <section className="gallery-section" style={{ padding: "80px 80px 120px" }}>
        <SectionLabel number="03" label="Gallery" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "60px",
          }}
        >
          <h1
            style={{
              fontFamily: "Libre Caslon Display, Georgia, serif",
              fontSize: "52px",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            All Photos
          </h1>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: activeCategory === cat ? "var(--text)" : "var(--text-faint)",
                  borderBottom: activeCategory === cat ? "1px solid var(--text)" : "none",
                  paddingBottom: "2px",
                  transition: "color 0.2s ease",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "100px 0",
              color: "var(--text-faint)",
              fontSize: "14px",
            }}
          >
            No photos in this category yet
          </div>
        ) : (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {landscapePhotos.length > 0 && (
              <div style={{ marginBottom: "80px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--text-faint)",
                    }}
                  >
                    Landscape
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>
                    {landscapePhotos.length}
                  </span>
                </div>
                <div
                  className="photo-grid-3col"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                  }}
                >
                  {landscapePhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  ))}
                </div>
              </div>
            )}

            {portraitPhotos.length > 0 && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--text-faint)",
                    }}
                  >
                    Portrait
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>
                    {portraitPhotos.length}
                  </span>
                </div>
                <div
                  className="photo-grid-4col"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                  }}
                >
                  {portraitPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setLightbox(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.92)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "900px", width: "100%" }}
            >
              <div style={{ position: "relative", background: "#1a1a1a" }}>
                <Image
                  src={lightbox.originalUrl}
                  alt={lightbox.caption ?? ""}
                  width={lightbox.width}
                  height={lightbox.height}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              <div
                style={{
                  padding: "16px 0",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  marginTop: "1px",
                  background: "#111",
                }}
              >
                {lightbox.caption && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.7)",
                      fontWeight: 300,
                      padding: "0 16px 8px",
                    }}
                  >
                    {lightbox.caption}
                  </p>
                )}
                <div style={{ padding: "0 16px" }}>
                  <ExifBadge
                    camera={lightbox.camera}
                    lens={lightbox.lens}
                    aperture={lightbox.aperture}
                    shutter={lightbox.shutter}
                    iso={lightbox.iso}
                    filmSim={lightbox.filmSim}
                  />
                </div>
              </div>
            </motion.div>

            <button
              onClick={() => setLightbox(null)}
              style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1001,
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
