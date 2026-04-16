"use client";

import { useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface Photo {
  id: string;
  originalUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
}

interface PhotoEditorProps {
  photo: Photo;
  onClose: () => void;
  onSaved: (updated: Photo) => void;
}

const RATIO_GROUPS: Array<{
  label: string;
  ratios: Array<{ label: string; value: number | undefined }>;
}> = [
  {
    label: "Portrait",
    ratios: [
      { label: "9:16", value: 9 / 16 },
      { label: "2:3",  value: 2 / 3  },
      { label: "3:4",  value: 3 / 4  },
      { label: "4:5",  value: 4 / 5  },
    ],
  },
  {
    label: "Landscape",
    ratios: [
      { label: "5:4",  value: 5 / 4  },
      { label: "4:3",  value: 4 / 3  },
      { label: "3:2",  value: 3 / 2  },
      { label: "16:9", value: 16 / 9 },
    ],
  },
  {
    label: "Other",
    ratios: [
      { label: "1:1",  value: 1         },
      { label: "Free", value: undefined  },
    ],
  },
];

export default function PhotoEditor({ photo, onClose, onSaved }: PhotoEditorProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>(undefined);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [rotation, setRotation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const rotate = (delta: number) => {
    setRotation((r) => (((r + delta) % 360) + 360) % 360);
  };

  const selectRatio = (value: number | undefined) => {
    setAspect(value);
    if (value === undefined || !imgRef.current) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      return;
    }

    const img = imgRef.current;
    const imgW = img.width;
    const imgH = img.height;

    let cropW: number;
    let cropH: number;

    if (imgW / imgH > value) {
      // Image wider than target — fit height, trim width
      cropH = imgH;
      cropW = imgH * value;
    } else {
      // Image taller than target — fit width, trim height
      cropW = imgW;
      cropH = imgW / value;
    }

    const x = (imgW - cropW) / 2;
    const y = (imgH - cropH) / 2;

    setCrop({
      unit: "%",
      x: (x / imgW) * 100,
      y: (y / imgH) * 100,
      width: (cropW / imgW) * 100,
      height: (cropH / imgH) * 100,
    });
    setCompletedCrop({
      unit: "px",
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(cropW),
      height: Math.round(cropH),
    });
  };

  const reset = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setAspect(undefined);
    setRotation(0);
    setError("");
  };

  const save = async () => {
    const img = imgRef.current;
    if (!img) return;

    setSaving(true);
    setError("");

    const payload: {
      rotate?: number;
      crop?: { x: number; y: number; width: number; height: number };
    } = {};

    if (rotation) payload.rotate = rotation;

    if (completedCrop && completedCrop.width > 1 && completedCrop.height > 1) {
      // Convert from displayed-image pixel coords to source-image pixel coords.
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      payload.crop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };
    }

    if (!payload.rotate && !payload.crop) {
      setError("Make a crop selection or rotate the image first.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/photos/${photo.id}/transform`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Transform failed");
      }

      const updated = await res.json();
      onSaved(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transform failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={() => !saving && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "960px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "Libre Caslon Display, Georgia, serif",
                fontSize: "20px",
                fontWeight: 400,
              }}
            >
              Edit Photo
            </h3>
            <p style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
              Crop + rotate. Changes are saved to the original.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              background: "none",
              border: "none",
              fontSize: "22px",
              color: "#999",
              cursor: saving ? "not-allowed" : "pointer",
              padding: "4px 8px",
            }}
          >
            ×
          </button>
        </div>

        {/* Image + crop UI */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
            background: "#1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
          }}
        >
          <div
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.25s ease",
              maxWidth: "100%",
            }}
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              keepSelection
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={photo.originalUrl}
                alt=""
                style={{
                  maxWidth: "100%",
                  maxHeight: "60vh",
                  display: "block",
                }}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #eee",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            {/* Rotate controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#999",
                  marginRight: "4px",
                }}
              >
                Rotate
              </span>
              <button
                onClick={() => rotate(-90)}
                disabled={saving}
                style={btnStyle}
                title="Rotate 90° counter-clockwise"
              >
                ↺ 90°
              </button>
              <button
                onClick={() => rotate(90)}
                disabled={saving}
                style={btnStyle}
                title="Rotate 90° clockwise"
              >
                ↻ 90°
              </button>
              {rotation !== 0 && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#7a9aad",
                    marginLeft: "4px",
                  }}
                >
                  {rotation}°
                </span>
              )}
            </div>

            {/* Aspect ratio controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#999",
                }}
              >
                Ratio
              </span>
              {RATIO_GROUPS.map((group) => (
                <div key={group.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#bbb",
                      marginRight: "2px",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {group.label}
                  </span>
                  {group.ratios.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => selectRatio(a.value)}
                      disabled={saving}
                      style={{
                        ...btnStyle,
                        background: aspect === a.value ? "#111" : "#f0f0f0",
                        color: aspect === a.value ? "#fff" : "#555",
                      }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              <button onClick={reset} disabled={saving} style={btnStyle}>
                Reset
              </button>
            </div>
          </div>

          {error && (
            <p style={{ color: "#c00", fontSize: "12px" }}>{error}</p>
          )}

          {/* Footer buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              paddingTop: "4px",
            }}
          >
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                padding: "10px 20px",
                background: "#f0f0f0",
                color: "#333",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={save}
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
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "#f0f0f0",
  color: "#555",
  border: "none",
  borderRadius: "4px",
  fontSize: "12px",
  cursor: "pointer",
  fontFamily: "DM Sans, system-ui, sans-serif",
};
