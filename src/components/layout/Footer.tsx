export default function Footer() {
  return (
    <footer
      className="site-footer"
      style={{
        borderTop: "1px solid var(--border)",
        padding: "40px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "120px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--text-faint)",
        }}
      >
        The Wandering Bunny · 2026
      </span>
    </footer>
  );
}
