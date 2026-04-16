"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface SectionConfig {
  id: string;
  label: string;
  visible: boolean;
  count?: number;
}

interface HeroConfig {
  title: string;
  tagline: string;
  bgPhotoId?: string | null;
  bgAnimation?: "kenburns" | "zoom" | "none";
  bgOverlay?: number;
}

interface Photo {
  id: string;
  thumbUrl: string;
  originalUrl: string;
  caption?: string | null;
  width: number;
  height: number;
  featured?: boolean;
}

interface Props {
  initialSections: SectionConfig[];
  initialHero: HeroConfig;
  photos: Photo[];
  initialFeaturedId: string | null;
}

const SECTION_ICONS: Record<string, string> = {
  hero: "⬜",
  featured: "★",
  grid: "⊞",
  filmstrip: "▤",
  journal: "✎",
};

const SECTION_DESC: Record<string, string> = {
  hero: "Full-screen opening with title & tagline",
  featured: "Single highlighted photo story",
  grid: "Multi-column photo grid",
  filmstrip: "Horizontal scrolling contact sheet",
  journal: "Recent journal entry previews",
};

const ANIMATION_OPTIONS: { value: HeroConfig["bgAnimation"]; label: string; desc: string }[] = [
  { value: "kenburns", label: "Ken Burns", desc: "Slow zoom + subtle pan" },
  { value: "zoom", label: "Slow Zoom", desc: "Gentle zoom in & out" },
  { value: "none", label: "Static", desc: "No animation" },
];

export default function HomepageEditor({ initialSections, initialHero, photos, initialFeaturedId }: Props) {
  const [sections, setSections] = useState<SectionConfig[]>(initialSections);
  const [hero, setHero] = useState<HeroConfig>({
    bgAnimation: "kenburns",
    bgOverlay: 0.45,
    ...initialHero,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const selectedPhoto = photos.find((p) => p.id === hero.bgPhotoId) ?? null;

  // Featured photo state (saved directly to DB, not settings.json)
  const [featuredId, setFeaturedId] = useState<string | null>(initialFeaturedId);
  const [featuringSaving, setFeaturingSaving] = useState(false);

  const setFeatured = async (photoId: string | null) => {
    setFeaturingSaving(true);
    try {
      // Unfeature previous
      if (featuredId && featuredId !== photoId) {
        await fetch(`/api/photos/${featuredId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ featured: false }),
        });
      }
      // Feature new
      if (photoId) {
        await fetch(`/api/photos/${photoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ featured: true }),
        });
      }
      setFeaturedId(photoId);
    } finally {
      setFeaturingSaving(false);
    }
  };

  /* ── drag-to-reorder ── */
  const handleDragStart = (i: number) => { dragIndex.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i); };
  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndex.current;
    if (fromIndex === null || fromIndex === toIndex) { setDragOver(null); return; }
    const next = [...sections];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setSections(next);
    dragIndex.current = null;
    setDragOver(null);
  };
  const handleDragEnd = () => { dragIndex.current = null; setDragOver(null); };

  const toggleVisible = (i: number) =>
    setSections((prev) => prev.map((s, idx) => idx === i ? { ...s, visible: !s.visible } : s));

  const setCount = (i: number, val: number) =>
    setSections((prev) => prev.map((s, idx) => idx === i ? { ...s, count: val } : s));

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...sections];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setSections(next);
  };
  const moveDown = (i: number) => {
    if (i === sections.length - 1) return;
    const next = [...sections];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setSections(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections, hero }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    border: "1px solid #e8e8e8",
    borderRadius: "4px",
    padding: "10px 12px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    fontFamily: "DM Sans, system-ui, sans-serif",
    background: "#fff",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#999",
    marginBottom: "6px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>

      {/* ── 1. Hero text ── */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>Hero Text</h2>
        <p style={{ fontSize: "12px", color: "#999", marginBottom: "16px" }}>
          Title and tagline shown on the opening screen
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input value={hero.title} onChange={(e) => setHero((h) => ({ ...h, title: e.target.value }))}
              placeholder="Bunnies." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tagline</label>
            <textarea value={hero.tagline} onChange={(e) => setHero((h) => ({ ...h, tagline: e.target.value }))}
              rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </div>
        </div>
      </div>

      {/* ── 3. Hero background ── */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>Hero Background</h2>
        <p style={{ fontSize: "12px", color: "#999", marginBottom: "20px" }}>
          Choose a photo from your library to fill the hero section
        </p>

        {/* Current selection preview */}
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", marginBottom: "20px" }}>
          <div style={{
            width: "180px", height: "110px", borderRadius: "6px", overflow: "hidden", flexShrink: 0,
            background: "linear-gradient(135deg, #c5d8e3, #7a9aad)",
            border: "1px solid #e8e8e8", position: "relative",
          }}>
            {selectedPhoto ? (
              <Image src={selectedPhoto.thumbUrl} alt="" fill sizes="180px" style={{ objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "12px", color: "rgba(255,255,255,0.7)", textAlign: "center", padding: "12px" }}>
                No background selected
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Animation type */}
            <div>
              <label style={labelStyle}>Animation</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {ANIMATION_OPTIONS.map((opt) => (
                  <button key={opt.value}
                    onClick={() => setHero((h) => ({ ...h, bgAnimation: opt.value }))}
                    style={{
                      padding: "7px 14px",
                      border: "1px solid",
                      borderColor: hero.bgAnimation === opt.value ? "#7a9aad" : "#e8e8e8",
                      borderRadius: "4px",
                      background: hero.bgAnimation === opt.value ? "#f0f6fa" : "#fff",
                      color: hero.bgAnimation === opt.value ? "#7a9aad" : "#555",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: hero.bgAnimation === opt.value ? 500 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                    <span style={{ display: "block", fontSize: "10px", color: "#bbb", fontWeight: 400, marginTop: "1px" }}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Overlay slider */}
            <div>
              <label style={labelStyle}>
                White overlay — {Math.round((hero.bgOverlay ?? 0.45) * 100)}%
                <span style={{ fontWeight: 300, marginLeft: "8px", textTransform: "none", letterSpacing: 0 }}>
                  (0% = raw photo, 100% = fully white)
                </span>
              </label>
              <input
                type="range" min={0} max={100}
                value={Math.round((hero.bgOverlay ?? 0.45) * 100)}
                onChange={(e) => setHero((h) => ({ ...h, bgOverlay: parseInt(e.target.value) / 100 }))}
                style={{ width: "100%", accentColor: "#7a9aad" }}
              />
            </div>

            {selectedPhoto && (
              <button onClick={() => setHero((h) => ({ ...h, bgPhotoId: null }))}
                style={{ alignSelf: "flex-start", background: "none", border: "1px solid #e8e8e8", borderRadius: "4px", padding: "5px 12px", fontSize: "12px", color: "#999", cursor: "pointer" }}>
                Remove background
              </button>
            )}
          </div>
        </div>

        {/* Photo grid picker */}
        {photos.length === 0 ? (
          <div style={{ border: "1px dashed #e8e8e8", borderRadius: "4px", padding: "24px", textAlign: "center", fontSize: "13px", color: "#bbb" }}>
            No photos uploaded yet. Upload photos first.
          </div>
        ) : (
          <div style={{ border: "1px solid #e8e8e8", borderRadius: "6px", padding: "12px", maxHeight: "300px", overflowY: "auto" }}>
            <p style={{ fontSize: "11px", color: "#bbb", marginBottom: "10px", letterSpacing: "0.05em" }}>
              Click a photo to use as background
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
              {photos.map((photo) => {
                const isSelected = hero.bgPhotoId === photo.id;
                return (
                  <div key={photo.id} onClick={() => setHero((h) => ({ ...h, bgPhotoId: isSelected ? null : photo.id }))}
                    title={photo.caption ?? ""}
                    style={{
                      position: "relative", cursor: "pointer", borderRadius: "4px", overflow: "hidden",
                      aspectRatio: "1",
                      outline: isSelected ? "2.5px solid #7a9aad" : "2.5px solid transparent",
                      outlineOffset: "1px",
                      transition: "outline-color 0.12s",
                    }}
                  >
                    <Image src={photo.thumbUrl} alt={photo.caption ?? ""} fill sizes="80px" style={{ objectFit: "cover" }} />
                    <div style={{
                      position: "absolute", inset: 0,
                      background: isSelected ? "rgba(122,154,173,0.25)" : "transparent",
                      transition: "background 0.12s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSelected && (
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#7a9aad", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Featured Photo ── */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>Featured Photo</h2>
        <p style={{ fontSize: "12px", color: "#999", marginBottom: "16px" }}>
          Shown in the Featured section on the homepage · click to select, click again to unfeature
          {featuringSaving && <span style={{ marginLeft: "10px", color: "#7a9aad" }}>Saving…</span>}
        </p>

        {/* Current featured preview */}
        {featuredId && (() => {
          const fp = photos.find((p) => p.id === featuredId);
          return fp ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "10px 14px", background: "#f0f6fa", borderRadius: "6px", border: "1px solid #c5d8e3" }}>
              <div style={{ width: "48px", height: "48px", position: "relative", borderRadius: "4px", overflow: "hidden", flexShrink: 0 }}>
                <Image src={fp.thumbUrl} alt="" fill sizes="48px" style={{ objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", color: "#7a9aad", fontWeight: 500, marginBottom: "2px" }}>Currently featured</p>
                <p style={{ fontSize: "12px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fp.caption || "No caption"}</p>
              </div>
              <button
                onClick={() => setFeatured(null)}
                disabled={featuringSaving}
                style={{ background: "none", border: "1px solid #c5d8e3", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", color: "#7a9aad", cursor: "pointer" }}
              >
                Unfeature
              </button>
            </div>
          ) : null;
        })()}

        {photos.length === 0 ? (
          <div style={{ border: "1px dashed #e8e8e8", borderRadius: "4px", padding: "24px", textAlign: "center", fontSize: "13px", color: "#bbb" }}>
            No photos uploaded yet.
          </div>
        ) : (
          <div style={{ border: "1px solid #e8e8e8", borderRadius: "6px", padding: "12px", maxHeight: "280px", overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
              {photos.map((photo) => {
                const isSelected = featuredId === photo.id;
                return (
                  <div
                    key={photo.id}
                    onClick={() => !featuringSaving && setFeatured(isSelected ? null : photo.id)}
                    title={photo.caption ?? ""}
                    style={{
                      position: "relative", cursor: featuringSaving ? "wait" : "pointer",
                      borderRadius: "4px", overflow: "hidden", aspectRatio: "1",
                      outline: isSelected ? "2.5px solid #7a9aad" : "2.5px solid transparent",
                      outlineOffset: "1px", transition: "outline-color 0.12s",
                    }}
                  >
                    <Image src={photo.thumbUrl} alt={photo.caption ?? ""} fill sizes="80px" style={{ objectFit: "cover" }} />
                    <div style={{
                      position: "absolute", inset: 0,
                      background: isSelected ? "rgba(122,154,173,0.25)" : "transparent",
                      transition: "background 0.12s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSelected && (
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#7a9aad", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Sections ── */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>Sections</h2>
        <p style={{ fontSize: "12px", color: "#999", marginBottom: "16px" }}>
          Drag to reorder · toggle eye to show/hide · set item counts where available
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {sections.map((section, i) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                border: "1px solid",
                borderColor: dragOver === i ? "#7a9aad" : "#e8e8e8",
                borderRadius: "6px",
                background: dragOver === i ? "#f0f6fa" : "#fff",
                opacity: section.visible ? 1 : 0.5,
                cursor: "grab",
                transition: "border-color 0.15s, background 0.15s",
                userSelect: "none",
              }}
            >
              <div style={{ color: "#ccc", fontSize: "16px", cursor: "grab", flexShrink: 0 }}>⠿</div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0 }}>
                <button onClick={() => moveUp(i)} disabled={i === 0}
                  style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#ddd" : "#aaa", padding: "0 2px", fontSize: "10px", lineHeight: 1 }}>▲</button>
                <button onClick={() => moveDown(i)} disabled={i === sections.length - 1}
                  style={{ background: "none", border: "none", cursor: i === sections.length - 1 ? "default" : "pointer", color: i === sections.length - 1 ? "#ddd" : "#aaa", padding: "0 2px", fontSize: "10px", lineHeight: 1 }}>▼</button>
              </div>

              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#999", flexShrink: 0, fontFamily: "monospace" }}>
                {String(i + 1).padStart(2, "0")}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px" }}>{SECTION_ICONS[section.id] ?? "◻"}</span>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#111" }}>{section.label}</span>
                </div>
                <p style={{ fontSize: "12px", color: "#bbb", marginTop: "2px" }}>{SECTION_DESC[section.id]}</p>
              </div>

              {section.count !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <span style={{ fontSize: "11px", color: "#bbb" }}>Show</span>
                  <input type="number" min={1} max={section.id === "journal" ? 10 : 48}
                    value={section.count}
                    onChange={(e) => setCount(i, Math.max(1, parseInt(e.target.value) || 1))}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: "52px", border: "1px solid #e8e8e8", borderRadius: "4px", padding: "4px 8px", fontSize: "13px", textAlign: "center", outline: "none" }}
                  />
                  <span style={{ fontSize: "11px", color: "#bbb" }}>items</span>
                </div>
              )}

              <button onClick={() => toggleVisible(i)} title={section.visible ? "Hide section" : "Show section"}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: section.visible ? "#7a9aad" : "#ddd", flexShrink: 0, padding: "0 4px", lineHeight: 1 }}>
                {section.visible ? "👁" : "🚫"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Save ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: "11px 28px", background: "#111", color: "#fff", border: "none", borderRadius: "4px", fontSize: "13px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Save Layout"}
        </button>
        {saved && <span style={{ fontSize: "13px", color: "#4caf50" }}>✓ Saved — homepage updated</span>}
        {error && <span style={{ fontSize: "13px", color: "#c00" }}>{error}</span>}
      </div>
    </div>
  );
}
