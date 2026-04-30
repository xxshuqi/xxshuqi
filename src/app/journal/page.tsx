import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import { getJournalEntries } from "@/lib/data";

export default function JournalPage() {
  const entries = getJournalEntries()
    .filter((e) => e.published)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

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
            maxWidth: "720px",
            paddingTop: "24px",
          }}
        >
          <h1
            style={{
              fontFamily: "DM Sans, system-ui, sans-serif",
              fontSize: "52px",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginBottom: "24px",
            }}
          >
            Journal
          </h1>

          {entries.length === 0 ? (
            <>
              <p
                style={{
                  fontFamily: "DM Sans, system-ui, sans-serif",
                  fontSize: "22px",
                  lineHeight: 1.7,
                  color: "var(--text-mid)",
                  marginBottom: "20px",
                }}
              >
                The first entries are coming soon. For now, the photographs are
                carrying the story one frame at a time.
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
            </>
          ) : (
            <>
              <p
                style={{
                  fontFamily: "DM Sans, system-ui, sans-serif",
                  fontSize: "20px",
                  lineHeight: 1.7,
                  color: "var(--text-mid)",
                  marginBottom: "60px",
                }}
              >
                Short notes from the road, paired with the frames they came from.
              </p>

              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {entries.map((entry, i) => {
                  const dateLabel = new Date(entry.createdAt).toLocaleDateString(
                    "en-US",
                    { month: "short", year: "numeric" }
                  );
                  return (
                    <li key={entry.id}>
                      <Link
                        href={`/journal/${entry.slug}`}
                        style={{
                          textDecoration: "none",
                          display: "block",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "60px 1fr auto",
                            gap: "24px",
                            alignItems: "start",
                            padding: "32px 0",
                            borderTop: i === 0 ? "1px solid var(--border)" : "none",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              letterSpacing: "0.2em",
                              color: "var(--text-faint)",
                              paddingTop: "6px",
                            }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>

                          <div>
                            <h2
                              style={{
                                fontFamily:
                                  "DM Sans, system-ui, sans-serif",
                                fontSize: "26px",
                                fontWeight: 400,
                                color: "var(--text)",
                                marginBottom: "8px",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.15,
                              }}
                            >
                              {entry.title}
                            </h2>
                            {entry.subtitle && (
                              <p
                                style={{
                                  fontFamily: "DM Sans, system-ui, sans-serif",
                                  fontSize: "15px",
                                  color: "var(--text-light)",
                                  fontWeight: 300,
                                }}
                              >
                                {entry.subtitle}
                              </p>
                            )}
                          </div>

                          <div style={{ textAlign: "right" }}>
                            {entry.category && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  letterSpacing: "0.2em",
                                  textTransform: "uppercase",
                                  color: "var(--accent)",
                                  display: "block",
                                  marginBottom: "4px",
                                }}
                              >
                                {entry.category}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--text-faint)",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {dateLabel}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
