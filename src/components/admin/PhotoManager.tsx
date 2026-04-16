"use client";

import { useState } from "react";
import Image from "next/image";
import PhotoEditor from "./PhotoEditor";

interface Photo {
  id: string;
  thumbUrl: string;
  originalUrl: string;
  width: number;
  height: number;
  caption?: string | null;
  category?: string | null;
  camera?: string | null;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
}

interface PhotoManagerProps {
  initialPhotos: Photo[];
}

const CATEGORIES = [
  "travel",
  "street",
  "portrait",
  "food",
  "landscape",
  "architecture",
  "abstract",
];

export default function PhotoManager({ initialPhotos }: PhotoManagerProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [editing, setEditing] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Photo | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editingImage, setEditingImage] = useState<Photo | null>(null);

  const startEdit = (photo: Photo) => {
    setEditing(photo.id);
    setEditCaption(photo.caption ?? "");
    setEditCategory(photo.category ?? "");
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editCaption, category: editCategory }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
        );
        setEditing(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        alert("Failed to delete photo");
      }
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectAll = () => {
    setSelected(new Set(photos.map((p) => p.id)));
  };

  const performBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selected);
    try {
      await Promise.all(
        ids.map((id) => fetch(`/api/photos/${id}`, { method: "DELETE" }))
      );
      setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
      clearSelection();
    } finally {
      setBulkDeleting(false);
      setConfirmBulk(false);
    }
  };

  return (
    <div>
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "#111",
            color: "#fff",
            borderRadius: "6px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <span style={{ fontSize: "13px" }}>
              {selected.size} selected
            </span>
            <button
              onClick={selectAll}
              style={{
                background: "none",
                border: "none",
                color: "#ccc",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Select all
            </button>
            <button
              onClick={clearSelection}
              style={{
                background: "none",
                border: "none",
                color: "#ccc",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear
            </button>
          </div>
          <button
            onClick={() => setConfirmBulk(true)}
            style={{
              padding: "6px 14px",
              background: "#c00",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Delete {selected.size} photo{selected.size > 1 ? "s" : ""}
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {photos.map((photo) => {
          const isSelected = selected.has(photo.id);
          return (
            <div
              key={photo.id}
              style={{
                border: `1px solid ${isSelected ? "#7a9aad" : "#e8e8e8"}`,
                borderRadius: "6px",
                overflow: "hidden",
                background: "#fff",
                opacity: deleting === photo.id ? 0.4 : 1,
                transition: "opacity 0.2s, border-color 0.15s",
                boxShadow: isSelected ? "0 0 0 2px #7a9aad22" : "none",
              }}
            >
              <div
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  background: "#f0f0f0",
                }}
              >
                <Image
                  src={photo.thumbUrl}
                  alt={photo.caption ?? ""}
                  fill
                  sizes="200px"
                  style={{ objectFit: "cover" }}
                />

                {/* Selection checkbox */}
                <button
                  onClick={() => toggleSelect(photo.id)}
                  style={{
                    position: "absolute",
                    top: "6px",
                    left: "6px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: "none",
                    background: isSelected ? "#7a9aad" : "rgba(255,255,255,0.85)",
                    color: isSelected ? "#fff" : "transparent",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                  title={isSelected ? "Deselect" : "Select"}
                >
                  ✓
                </button>

              </div>

              <div style={{ padding: "12px" }}>
                {editing === photo.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <input
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      placeholder="Caption..."
                      style={{
                        border: "1px solid #e8e8e8",
                        borderRadius: "4px",
                        padding: "6px 8px",
                        fontSize: "12px",
                        width: "100%",
                      }}
                    />
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      style={{
                        border: "1px solid #e8e8e8",
                        borderRadius: "4px",
                        padding: "6px 8px",
                        fontSize: "12px",
                        width: "100%",
                      }}
                    >
                      <option value="">No category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => saveEdit(photo.id)}
                        disabled={saving}
                        style={{
                          flex: 1,
                          padding: "6px",
                          background: "#111",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        {saving ? "..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        style={{
                          flex: 1,
                          padding: "6px",
                          background: "#f0f0f0",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#555",
                        marginBottom: "8px",
                        minHeight: "18px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {photo.caption || (
                        <span style={{ color: "#ccc" }}>No caption</span>
                      )}
                    </p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => startEdit(photo)}
                        style={{
                          padding: "4px 8px",
                          background: "#f0f0f0",
                          border: "none",
                          borderRadius: "3px",
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setEditingImage(photo)}
                        style={{
                          padding: "4px 8px",
                          background: "#eef4f7",
                          border: "none",
                          borderRadius: "3px",
                          fontSize: "11px",
                          cursor: "pointer",
                          color: "#7a9aad",
                        }}
                      >
                        Crop/Rotate
                      </button>
                      <button
                        onClick={() => setConfirmDelete(photo)}
                        disabled={deleting === photo.id}
                        style={{
                          padding: "4px 8px",
                          background: "#fff0f0",
                          border: "none",
                          borderRadius: "3px",
                          fontSize: "11px",
                          cursor: deleting === photo.id ? "not-allowed" : "pointer",
                          color: "#c00",
                        }}
                      >
                        {deleting === photo.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {photos.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "60px",
              color: "#999",
              fontSize: "14px",
            }}
          >
            No photos yet. Upload some!
          </div>
        )}
      </div>

      {/* Single-delete confirmation modal */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "28px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                fontFamily: "Libre Caslon Display, Georgia, serif",
                fontSize: "22px",
                fontWeight: 400,
                marginBottom: "8px",
              }}
            >
              Delete this photo?
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#777",
                marginBottom: "20px",
                lineHeight: 1.6,
              }}
            >
              This will permanently remove the image file and its database
              record. This cannot be undone.
            </p>

            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  position: "relative",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "#f0f0f0",
                  flexShrink: 0,
                }}
              >
                <Image
                  src={confirmDelete.thumbUrl}
                  alt=""
                  fill
                  sizes="80px"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#333",
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {confirmDelete.caption || (
                    <span style={{ color: "#ccc" }}>No caption</span>
                  )}
                </p>
                {confirmDelete.camera && (
                  <p style={{ fontSize: "11px", color: "#999" }}>
                    {confirmDelete.camera}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting !== null}
                style={{
                  padding: "10px 20px",
                  background: "#f0f0f0",
                  color: "#333",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => performDelete(confirmDelete.id)}
                disabled={deleting !== null}
                style={{
                  padding: "10px 20px",
                  background: "#c00",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "13px",
                  cursor: deleting !== null ? "not-allowed" : "pointer",
                  opacity: deleting !== null ? 0.7 : 1,
                }}
              >
                {deleting !== null ? "Deleting..." : "Delete Photo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk-delete confirmation modal */}
      {confirmBulk && (
        <div
          onClick={() => !bulkDeleting && setConfirmBulk(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "28px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                fontFamily: "Libre Caslon Display, Georgia, serif",
                fontSize: "22px",
                fontWeight: 400,
                marginBottom: "8px",
              }}
            >
              Delete {selected.size} photo{selected.size > 1 ? "s" : ""}?
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#777",
                marginBottom: "24px",
                lineHeight: 1.6,
              }}
            >
              This will permanently remove all selected image files and their
              database records. This cannot be undone.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmBulk(false)}
                disabled={bulkDeleting}
                style={{
                  padding: "10px 20px",
                  background: "#f0f0f0",
                  color: "#333",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={performBulkDelete}
                disabled={bulkDeleting}
                style={{
                  padding: "10px 20px",
                  background: "#c00",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "13px",
                  cursor: bulkDeleting ? "not-allowed" : "pointer",
                  opacity: bulkDeleting ? 0.7 : 1,
                }}
              >
                {bulkDeleting
                  ? "Deleting..."
                  : `Delete ${selected.size} photo${selected.size > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop + rotate editor */}
      {editingImage && (
        <PhotoEditor
          photo={editingImage}
          onClose={() => setEditingImage(null)}
          onSaved={(updated) => {
            setPhotos((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
            );
            setEditingImage(null);
          }}
        />
      )}
    </div>
  );
}
