import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";

// Follow-up: ship the first real entry together with /journal/[slug]
// so homepage journal links have a real destination.
export default function JournalPage() {
  return (
    <div style={{ paddingTop: "52px" }}>
      <section
        className="journal-section"
        style={{
          padding: "80px 80px 120px",
          minHeight: "calc(100vh - 52px)",
        }}
      >
        <SectionLabel number="04" label="Journal" />

        <div
          style={{
            maxWidth: "620px",
            paddingTop: "24px",
          }}
        >
          <h1
            style={{
              fontFamily: "Libre Caslon Display, Georgia, serif",
              fontSize: "52px",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginBottom: "24px",
            }}
          >
            Journal
          </h1>
          <p
            style={{
              fontFamily: "Crimson Pro, Georgia, serif",
              fontSize: "22px",
              lineHeight: 1.7,
              color: "var(--text-mid)",
              marginBottom: "20px",
            }}
          >
            The first entries are coming soon. For now, the photographs are carrying the
            story one frame at a time.
          </p>
          <Link
            href="/gallery"
            style={{
              fontSize: "11px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--text)",
              textDecoration: "none",
              borderBottom: "1px solid var(--text)",
              paddingBottom: "2px",
            }}
          >
            Browse the Gallery
          </Link>
        </div>
      </section>
    </div>
  );
}
