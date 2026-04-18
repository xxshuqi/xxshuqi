"use client";

export default function VerticalText() {
  return (
    <>
      {/* Left side */}
      <div
        className="vertical-text-side"
        style={{
          position: "fixed",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          zIndex: 50,
          fontSize: "9px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--text-faint)",
          fontWeight: 400,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        Fujifilm · 2026
      </div>

      {/* Right side */}
      <div
        className="vertical-text-side"
        style={{
          position: "fixed",
          right: "16px",
          top: "50%",
          transform: "translateY(-50%) rotate(90deg)",
          zIndex: 50,
          fontSize: "9px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--text-faint)",
          fontWeight: 400,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        Photo Diary
      </div>
    </>
  );
}
