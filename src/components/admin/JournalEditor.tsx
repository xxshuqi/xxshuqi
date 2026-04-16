"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Photo {
  id: string;
  thumbUrl: string;
  caption?: string | null;
  camera?: string | null;
  width: number;
  height: number;
}

interface JournalEditorProps {
  initial?: {
    id: string;
    title: string;
    subtitle?: string | null;
    slug: string;
    body: string;
    category?: string | null;
    published: boolean;
    photoIds?: string[];
  };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function JournalEditor({ initial }: JournalEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [published, setPublished] = useState(initial?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Photo picker
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initial?.photoIds ?? [])
  );
  const [photosLoading, setPhotosLoading] = useState(true);

  useEffect(() => {
    fetch("/api/photos?limit=200")
      .then((r) => r.json())
      .then((data) => {
        setAllPhotos(Array.isArray(data) ? data : []);
        setPhotosLoading(false);
      })
      .catch(() => setPhotosLoading(false));
  }, []);

  const togglePhoto = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initial) {
      setSlug(slugify(val));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const payload = {
        title,
        subtitle,
        slug,
        body,
        category,
        published,
        photoIds: Array.from(selectedIds),
      };
      const res = initial
        ? await fetch(`/api/journal/${initial.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/journal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }

      router.push("/admin/journal");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
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
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "#999",
    marginBottom: "6px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Entry title..."
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Subtitle</label>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Optional subtitle..."
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Slug</label>
        <input
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          placeholder="url-slug"
          style={{ ...inputStyle, fontFamily: "monospace", fontSize: "13px" }}
        />
      </div>

      <div>
        <label style={labelStyle}>Category</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="travel, street, portrait..."
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Body (Markdown)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your journal entry in Markdown..."
          rows={18}
          style={{
            ...inputStyle,
            resize: "vertical",
            fontFamily: "monospace",
            fontSize: "13px",
            lineHeight: 1.7,
          }}
        />
      </div>

      {/* Photo Picker */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
          <label style={labelStyle}>Attach Photos</label>
          {selectedIds.size > 0 && (
            <span style={{ fontSize: "12px", color: "var(--accent)" }}>
              {selectedIds.size} selected
            </span>
          )}
        </div>

        {photosLoading ? (
          <div style={{ fontSize: "13px", color: "#ccc", padding: "20px 0" }}>
            Loading photos...
          </div>
        ) : allPhotos.length === 0 ? (
          <div
            style={{
              border: "1px dashed #e8e8e8",
              borderRadius: "4px",
              padding: "24px",
              textAlign: "center",
              fontSize: "13px",
              color: "#bbb",
            }}
          >
            No photos uploaded yet. Upload photos first.
          </div>
        ) : (
          <div
            style={{
              border: "1px solid #e8e8e8",
              borderRadius: "4px",
              padding: "12px",
              maxHeight: "320px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "8px",
              }}
            >
              {allPhotos.map((photo) => {
                const selected = selectedIds.has(photo.id);
                return (
                  <div
                    key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    title={photo.caption ?? photo.camera ?? ""}
                    style={{
                      position: "relative",
                      cursor: "pointer",
                      borderRadius: "3px",
                      overflow: "hidden",
                      aspectRatio: "1",
                      outline: selected ? "2px solid #7a9aad" : "2px solid transparent",
                      outlineOffset: "1px",
                      transition: "outline-color 0.15s ease",
                    }}
                  >
                    <Image
                      src={photo.thumbUrl}
                      alt={photo.caption ?? ""}
                      fill
                      sizes="80px"
                      style={{ objectFit: "cover" }}
                    />
                    {/* Selection overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: selected
                          ? "rgba(122,154,173,0.3)"
                          : "rgba(0,0,0,0)",
                        transition: "background 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && (
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: "#7a9aad",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

        {selectedIds.size > 0 && (
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              marginTop: "8px",
              background: "none",
              border: "none",
              fontSize: "12px",
              color: "#999",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Clear selection
          </button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            style={{ width: "16px", height: "16px" }}
          />
          <span style={{ fontSize: "14px", color: "#555" }}>Published</span>
        </label>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {error && (
            <span style={{ color: "#c00", fontSize: "13px" }}>{error}</span>
          )}
          <button
            onClick={() => router.back()}
            style={{
              padding: "10px 20px",
              background: "#f0f0f0",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 24px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
