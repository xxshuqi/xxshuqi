interface SectionLabelProps {
  number: string;
  label: string;
}

export default function SectionLabel({ number, label }: SectionLabelProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "40px",
      }}
    >
      <span
        style={{
          fontSize: "10px",
          letterSpacing: "0.3em",
          color: "var(--text-faint)",
          fontWeight: 400,
        }}
      >
        {number}
      </span>
      <div
        style={{
          flex: 1,
          height: "1px",
          background: "var(--border)",
        }}
      />
      <span
        style={{
          fontSize: "10px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--text-light)",
          fontWeight: 400,
        }}
      >
        {label}
      </span>
    </div>
  );
}
