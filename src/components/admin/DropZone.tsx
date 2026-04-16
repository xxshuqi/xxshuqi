"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

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

interface DropZoneProps {
  onUploaded?: (photo: UploadedPhoto) => void;
}

export default function DropZone({ onUploaded }: DropZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      setProgress([]);

      for (const file of acceptedFiles) {
        setProgress((p) => [...p, `Uploading ${file.name}...`]);

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error(await res.text());

          const photo = await res.json();
          setProgress((p) =>
            p.map((msg) =>
              msg.includes(file.name)
                ? `✓ ${file.name} uploaded`
                : msg
            )
          );
          onUploaded?.(photo);
        } catch (err) {
          setProgress((p) =>
            p.map((msg) =>
              msg.includes(file.name)
                ? `✗ ${file.name} failed`
                : msg
            )
          );
        }
      }

      setUploading(false);
    },
    [onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/heic": [".heic"],
    },
    multiple: true,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? "#7a9aad" : "#e8e8e8"}`,
          borderRadius: "8px",
          padding: "60px 40px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          background: isDragActive ? "rgba(122, 154, 173, 0.05)" : "#fafafa",
        }}
      >
        <input {...getInputProps()} />
        <div style={{ marginBottom: "16px", fontSize: "32px" }}>
          {isDragActive ? "⬇" : "☁"}
        </div>
        <p style={{ fontSize: "14px", color: "#555", marginBottom: "8px" }}>
          {isDragActive
            ? "Drop photos here"
            : "Drag & drop photos, or click to select"}
        </p>
        <p style={{ fontSize: "12px", color: "#999" }}>
          JPG, PNG, WEBP, HEIC · Multiple files supported
        </p>
      </div>

      {progress.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          {progress.map((msg, i) => (
            <div
              key={i}
              style={{
                padding: "8px 12px",
                background: msg.startsWith("✓")
                  ? "#f0f8f0"
                  : msg.startsWith("✗")
                  ? "#fdf0f0"
                  : "#f8f8f8",
                borderRadius: "4px",
                marginBottom: "4px",
                fontSize: "13px",
                color: msg.startsWith("✓")
                  ? "#2d7a2d"
                  : msg.startsWith("✗")
                  ? "#a00"
                  : "#555",
              }}
            >
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
