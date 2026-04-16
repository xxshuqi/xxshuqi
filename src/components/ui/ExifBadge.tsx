interface ExifBadgeProps {
  camera?: string | null;
  lens?: string | null;
  aperture?: string | null;
  shutter?: string | null;
  iso?: string | null;
  filmSim?: string | null;
}

export default function ExifBadge({
  camera,
  lens,
  aperture,
  shutter,
  iso,
  filmSim,
}: ExifBadgeProps) {
  const items = [
    { label: "Camera", value: camera },
    { label: "Lens", value: lens },
    { label: "Aperture", value: aperture },
    { label: "Shutter", value: shutter },
    { label: "ISO", value: iso },
    { label: "Film", value: filmSim },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        marginTop: "8px",
      }}
    >
      {items.map(({ label, value }) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span
            style={{
              fontSize: "9px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-mid)",
              fontWeight: 300,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
