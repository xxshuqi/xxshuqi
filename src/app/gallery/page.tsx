"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";
import ScrollReveal from "@/components/ui/ScrollReveal";
import ExifBadge from "@/components/ui/ExifBadge";
import { motion, AnimatePresence } from "framer-motion";

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
  _count?: { likes: number; comments: number };
  comments?: { author: string; body: string }[];
}

interface CommentItem {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

const CATEGORIES = ["all", "travel", "street", "portrait", "food", "landscape", "architecture"];

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("bunnies_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bunnies_session", id);
  }
  return id;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ── Comment panel (per card) ─────────────────────────────────────────────────

function CommentPanel({ photoId, onClose, onCommentAdded }: { photoId: string; onClose: () => void; onCommentAdded: () => void }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/photos/${photoId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [photoId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !body.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/photos/${photoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, body }),
    });
    if (res.ok) {
      const c = await res.json();
      setComments((prev) => [c, ...prev]);
      setBody("");
      onCommentAdded();
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{ overflow: "hidden" }}
    >
      <div style={{ borderTop: "1px solid var(--border)", padding: "16px 0 20px", marginTop: "10px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-light)" }}>
            Comments {comments.length > 0 && <span style={{ color: "var(--text-faint)" }}>· {comments.length}</span>}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: "16px", padding: 0, lineHeight: 1 }}>
            ×
          </button>
        </div>

        {/* Comment list */}
        {loading ? (
          <p style={{ fontSize: "12px", color: "var(--text-faint)", marginBottom: "14px" }}>Loading…</p>
        ) : comments.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--text-faint)", marginBottom: "14px" }}>No comments yet.</p>
        ) : (
          <div
            style={{
              maxHeight: "168px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "16px",
              paddingRight: "4px",
            }}
          >
            {comments.map((c) => (
              <div key={c.id}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text)" }}>{c.author}</span>
                  <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-mid)", fontWeight: 300, lineHeight: 1.5 }}>{c.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add comment form */}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            maxLength={60}
            style={{ border: "1px solid var(--border)", borderRadius: "3px", padding: "6px 10px", fontSize: "12px", color: "var(--text)", background: "var(--bg)", outline: "none", fontFamily: "DM Sans, system-ui, sans-serif" }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave a comment…"
            maxLength={500}
            rows={2}
            style={{ border: "1px solid var(--border)", borderRadius: "3px", padding: "6px 10px", fontSize: "12px", color: "var(--text)", background: "var(--bg)", resize: "none", outline: "none", fontFamily: "DM Sans, system-ui, sans-serif" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={submitting || !author.trim() || !body.trim()}
              style={{
                padding: "5px 14px",
                background: submitting || !author.trim() || !body.trim() ? "var(--bg-off)" : "var(--text)",
                color: submitting || !author.trim() || !body.trim() ? "var(--text-faint)" : "#fff",
                border: "none", borderRadius: "3px", fontSize: "11px",
                cursor: submitting ? "wait" : "pointer",
                letterSpacing: "0.05em", fontFamily: "DM Sans, system-ui, sans-serif", transition: "all 0.15s ease",
              }}
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likePending, setLikePending] = useState<Set<string>>(new Set());
  const [openComments, setOpenComments] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const targetPhotoId = searchParams.get("photo");

  useEffect(() => {
    const url = activeCategory === "all" ? "/api/photos" : `/api/photos?category=${activeCategory}`;
    setLoading(true);
    setOpenComments(null);
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const list: Photo[] = Array.isArray(data) ? data : [];
        setPhotos(list);
        setLoading(false);
        // Scroll to photo if ?photo= param is present
        if (targetPhotoId) {
          setTimeout(() => {
            const el = document.getElementById(`photo-${targetPhotoId}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              el.classList.add("photo-highlight");
              setTimeout(() => el.classList.remove("photo-highlight"), 1800);
            }
          }, 100);
        }
      });
  }, [activeCategory, targetPhotoId]);

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    fetch(`/api/photos/liked?session=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.liked)) setLikedIds(new Set(data.liked));
      });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const handleScroll = () => setOpenComments(null);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLike = useCallback(async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likePending.has(photoId)) return;
    const sessionId = getSessionId();

    setLikePending((s) => new Set(s).add(photoId));
    const wasLiked = likedIds.has(photoId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      wasLiked ? next.delete(photoId) : next.add(photoId);
      return next;
    });
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? { ...p, _count: { ...p._count!, likes: (p._count?.likes ?? 0) + (wasLiked ? -1 : 1) } }
          : p
      )
    );

    try {
      const res = await fetch(`/api/photos/${photoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      setLikedIds((prev) => {
        const next = new Set(prev);
        data.liked ? next.add(photoId) : next.delete(photoId);
        return next;
      });
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, _count: { ...p._count!, likes: data.count } } : p
        )
      );
    } finally {
      setLikePending((s) => { const next = new Set(s); next.delete(photoId); return next; });
    }
  }, [likedIds, likePending]);

  const toggleComments = useCallback((photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenComments((prev) => (prev === photoId ? null : photoId));
  }, []);

  const landscapePhotos = photos.filter((p) => p.width > p.height);
  const portraitPhotos = photos.filter((p) => p.width <= p.height);

  const PhotoCard = ({ photo, sizes }: { photo: Photo; sizes: string }) => {
    const liked = likedIds.has(photo.id);
    const pending = likePending.has(photo.id);
    const commentsOpen = openComments === photo.id;

    return (
      <ScrollReveal>
        <div id={`photo-${photo.id}`}>
          {/* Thumbnail */}
          <div
            onClick={() => setLightbox(photo)}
            style={{
              position: "relative", overflow: "hidden",
              background: "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 50%, #7a9aad 100%)",
              aspectRatio: `${photo.width} / ${photo.height}`, cursor: "pointer",
            }}
          >
            <Image src={photo.thumbUrl} alt={photo.caption ?? ""} fill sizes={sizes} style={{ objectFit: "cover" }} />
          </div>

          {/* Caption */}
          {photo.caption && (
            <p style={{ fontSize: "13px", color: "var(--text-light)", marginTop: "6px", fontWeight: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {photo.caption}
            </p>
          )}

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border)", margin: "8px 0" }} />

          {/* Like + Comment icons — right aligned, below divider */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "14px", marginBottom: "8px" }}>
            <button
              onClick={(e) => toggleLike(photo.id, e)}
              disabled={pending}
              style={{
                background: "none", border: "none", cursor: pending ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: "4px", padding: 0,
                color: liked ? "#d96b6b" : "var(--text-faint)",
                fontSize: "13px", transition: "color 0.15s ease",
                fontFamily: "DM Sans, system-ui, sans-serif",
              }}
            >
              <HeartIcon filled={liked} />
              <span>{photo._count?.likes ?? 0}</span>
            </button>

            <button
              onClick={(e) => toggleComments(photo.id, e)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "4px", padding: 0,
                color: commentsOpen ? "var(--text-mid)" : "var(--text-faint)",
                fontSize: "13px", transition: "color 0.15s ease",
                fontFamily: "DM Sans, system-ui, sans-serif",
              }}
            >
              <CommentIcon />
              <span>{photo._count?.comments ?? 0}</span>
            </button>
          </div>

          {/* No comments — encourage first comment */}
          {!commentsOpen && (photo._count?.comments ?? 0) === 0 && (
            <span
              onClick={(e) => toggleComments(photo.id, e)}
              style={{ fontSize: "12px", color: "var(--text-faint)", fontWeight: 300, cursor: "pointer", fontStyle: "italic" }}
            >
              Be the first to comment…
            </span>
          )}

          {/* Latest single comment preview — shown when panel is closed */}
          {!commentsOpen && photo.comments?.[0] && (
            <div
              onClick={(e) => toggleComments(photo.id, e)}
              style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "6px", cursor: "pointer" }}
            >
              <span>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-mid)", marginRight: "5px" }}>
                  {photo.comments[0].author}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-light)", fontWeight: 300 }}>
                  {photo.comments[0].body.length > 80 ? photo.comments[0].body.slice(0, 80) + "…" : photo.comments[0].body}
                </span>
              </span>
              {(photo._count?.comments ?? 0) > 1 && (
                <span
                  style={{ fontSize: "12px", color: "var(--text-faint)", letterSpacing: "0.05em", flexShrink: 0 }}
                  title={`${photo._count?.comments} comments`}
                >
                  ···
                </span>
              )}
            </div>
          )}

          {/* Inline comment panel */}
          <AnimatePresence>
            {commentsOpen && (
              <CommentPanel
                key={photo.id}
                photoId={photo.id}
                onClose={() => setOpenComments(null)}
                onCommentAdded={() =>
                  setPhotos((prev) =>
                    prev.map((p) =>
                      p.id === photo.id
                        ? { ...p, _count: { ...p._count!, comments: (p._count?.comments ?? 0) + 1 } }
                        : p
                    )
                  )
                }
              />
            )}
          </AnimatePresence>
        </div>
      </ScrollReveal>
    );
  };

  return (
    <div style={{ paddingTop: "52px" }}>
      <style>{`
        @keyframes photo-pulse {
          0%   { outline: 2px solid transparent; outline-offset: 4px; }
          20%  { outline: 2px solid var(--accent); outline-offset: 4px; }
          80%  { outline: 2px solid var(--accent); outline-offset: 4px; }
          100% { outline: 2px solid transparent; outline-offset: 4px; }
        }
        .photo-highlight { animation: photo-pulse 1.6s ease forwards; }
      `}</style>
      <section style={{ padding: "80px 80px 60px" }}>
        <SectionLabel number="03" label="Gallery" />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "60px" }}>
          <h1 style={{ fontFamily: "Libre Caslon Display, Georgia, serif", fontSize: "52px", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }}>
            All Photos
          </h1>
          <div style={{ display: "flex", gap: "20px" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
                  color: activeCategory === cat ? "var(--text)" : "var(--text-faint)",
                  borderBottom: activeCategory === cat ? "1px solid var(--text)" : "none",
                  paddingBottom: "2px", transition: "color 0.2s ease",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "3/4", background: "linear-gradient(135deg, #c5d8e3 0%, #9bb8c9 50%, #7a9aad 100%)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: "var(--text-faint)", fontSize: "14px" }}>
            No photos in this category yet
          </div>
        ) : (
          <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {landscapePhotos.length > 0 && (
              <div style={{ marginBottom: "80px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                  <span style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-faint)" }}>Landscape</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>{landscapePhotos.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {landscapePhotos.map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} sizes="(max-width: 768px) 50vw, 33vw" />
                  ))}
                </div>
              </div>
            )}

            {portraitPhotos.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                  <span style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-faint)" }}>Portrait</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>{portraitPhotos.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                  {portraitPhotos.map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} sizes="(max-width: 768px) 50vw, 25vw" />
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={() => setLightbox(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "900px", width: "100%" }}
            >
              <div style={{ position: "relative", background: "#1a1a1a" }}>
                <Image
                  src={lightbox.originalUrl} alt={lightbox.caption ?? ""}
                  width={lightbox.width} height={lightbox.height}
                  style={{ width: "100%", height: "auto", maxHeight: "80vh", objectFit: "contain", display: "block" }}
                />
              </div>
              <div style={{ padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "1px", background: "#111" }}>
                {lightbox.caption && (
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", fontWeight: 300, padding: "0 16px 8px" }}>
                    {lightbox.caption}
                  </p>
                )}
                <div style={{ padding: "0 16px" }}>
                  <ExifBadge camera={lightbox.camera} lens={lightbox.lens} aperture={lightbox.aperture} shutter={lightbox.shutter} iso={lightbox.iso} filmSim={lightbox.filmSim} />
                </div>
              </div>
            </motion.div>

            <button
              onClick={() => setLightbox(null)}
              style={{ position: "fixed", top: "20px", right: "20px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
