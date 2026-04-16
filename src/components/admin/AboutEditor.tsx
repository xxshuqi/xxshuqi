"use client";

import { useState } from "react";

interface GearItem {
  label: string;
  value: string;
}

interface AboutConfig {
  heading: string;
  bio: string;
  gear: GearItem[];
}

export default function AboutEditor({ initial }: { initial: AboutConfig }) {
  const [heading, setHeading] = useState(initial.heading);
  const [bio, setBio] = useState(initial.bio);
  const [gear, setGear] = useState<GearItem[]>(initial.gear);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const updateGear = (i: number, field: keyof GearItem, val: string) =>
    setGear((prev) => prev.map((g, idx) => idx === i ? { ...g, [field]: val } : g));

  const addGearRow = () =>
    setGear((prev) => [...prev, { label: "", value: "" }]);

  const removeGearRow = (i: number) =>
    setGear((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ about: { heading, bio, gear } }),
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

  const inputStyle: React.CSSProperties = {
    border: "1px solid #e8e8e8",
    borderRadius: "4px",
    padding: "10px 12px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    fontFamily: "DM Sans, system-ui, sans-serif",
    background: "#fff",
    boxSizing: "border-box",
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
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

      {/* Heading */}
      <div>
        <label style={labelStyle}>Page Heading</label>
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="The Photographer"
          style={inputStyle}
        />
        <p style={{ fontSize: "11px", color: "#bbb", marginTop: "6px" }}>
          Shown as the large title at the top of the About page
        </p>
      </div>

      {/* Bio */}
      <div>
        <label style={labelStyle}>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={10}
          placeholder="Write your bio here. Separate paragraphs with a blank line."
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, fontFamily: "monospace", fontSize: "13px" }}
        />
        <p style={{ fontSize: "11px", color: "#bbb", marginTop: "6px" }}>
          Separate paragraphs with a blank line (double Enter)
        </p>
      </div>

      {/* Gear */}
      <div>
        <label style={labelStyle}>Gear</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {gear.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "8px", alignItems: "center" }}>
              <input
                value={item.label}
                onChange={(e) => updateGear(i, "label", e.target.value)}
                placeholder="Label (e.g. Body)"
                style={{ ...inputStyle, fontSize: "13px" }}
              />
              <input
                value={item.value}
                onChange={(e) => updateGear(i, "value", e.target.value)}
                placeholder="Value (e.g. Fujifilm X-T5)"
                style={{ ...inputStyle, fontSize: "13px" }}
              />
              <button
                onClick={() => removeGearRow(i)}
                title="Remove row"
                style={{
                  background: "none",
                  border: "1px solid #e8e8e8",
                  borderRadius: "4px",
                  width: "34px",
                  height: "34px",
                  cursor: "pointer",
                  color: "#bbb",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}

          <button
            onClick={addGearRow}
            style={{
              alignSelf: "flex-start",
              marginTop: "4px",
              padding: "7px 14px",
              background: "#f8f8f8",
              border: "1px solid #e8e8e8",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#555",
              cursor: "pointer",
            }}
          >
            + Add row
          </button>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "11px 28px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "13px",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span style={{ fontSize: "13px", color: "#4caf50" }}>✓ Saved — about page updated</span>}
        {error && <span style={{ fontSize: "13px", color: "#c00" }}>{error}</span>}
      </div>
    </div>
  );
}
