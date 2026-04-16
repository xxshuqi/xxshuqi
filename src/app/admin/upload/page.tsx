"use client";

import { useState } from "react";
import DropZone from "@/components/admin/DropZone";
import Image from "next/image";

interface UploadedPhoto {
  id: string;
  thumbUrl: string;
  originalUrl: string;
  caption?: string;
  category?: string;
  camera?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  filmSim?: string;
}

export default function UploadPage() {
  const [uploaded, setUploaded] = useState<UploadedPhoto[]>([]);

  return (
    <div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 400,
          marginBottom: "8px",
          fontFamily: "Libre Caslon Display, Georgia, serif",
        }}
      >
        Upload Photos
      </h1>
      <p style={{ color: "#999", fontSize: "13px", marginBottom: "40px" }}>
        Drag and drop photos to upload. EXIF data is extracted automatically.
      </p>

      <DropZone onUploaded={(photo) => setUploaded((prev) => [photo, ...prev])} />

      {uploaded.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h2
            style={{
              fontSize: "13px",
              color: "#999",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "16px",
              fontWeight: 400,
            }}
          >
            Just Uploaded ({uploaded.length})
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "12px",
            }}
          >
            {uploaded.map((photo) => (
              <div
                key={photo.id}
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    background: "linear-gradient(135deg, #c5d8e3, #7a9aad)",
                  }}
                >
                  <Image
                    src={photo.thumbUrl}
                    alt=""
                    fill
                    sizes="160px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div style={{ padding: "10px", fontSize: "11px", color: "#555" }}>
                  {photo.camera && <p>{photo.camera}</p>}
                  {photo.filmSim && (
                    <p style={{ color: "#7a9aad" }}>{photo.filmSim}</p>
                  )}
                  <div style={{ display: "flex", gap: "8px", color: "#999", marginTop: "4px" }}>
                    {photo.aperture && <span>{photo.aperture}</span>}
                    {photo.shutter && <span>{photo.shutter}</span>}
                    {photo.iso && <span>{photo.iso}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
