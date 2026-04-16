import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getJournalEntries } from "@/lib/data";

export default function JournalPage() {
  const entries = getJournalEntries().filter((e) => e.published);

  return (
    <div style={{ paddingTop: "52px" }}>
      <section style={{ padding: "80px 80px 120px" }}>
        <SectionLabel number="05" label="Journal" />

        <h1
          style={{
            fontFamily: "Libre Caslon Display, Georgia, serif",
            fontSize: "52px",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: "80px",
          }}
        >
          Field Notes
        </h1>

        {entries.length === 0 ? (
          <p style={{ color: "var(--text-faint)", fontSize: "14px" }}>
            No entries published yet
          </p>
        ) : (
          <div>
            {entries.map((entry, i) => (
              <ScrollReveal key={entry.id} delay={i * 0.08}>
                <Link href={`/journal/${entry.slug}`} style={{ textDecoration: "none" }}>
                  <article
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr auto",
                      gap: "32px",
                      alignItems: "start",
                      padding: "40px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "12px",
                          letterSpacing: "0.2em",
                          color: "var(--text-faint)",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div>
                      <h2
                        style={{
                          fontFamily: "Libre Caslon Display, Georgia, serif",
                          fontSize: "28px",
                          fontWeight: 400,
                          color: "var(--text)",
                          letterSpacing: "-0.01em",
                          marginBottom: "10px",
                        }}
                      >
                        {entry.title}
                      </h2>
                      {entry.subtitle && (
                        <p
                          style={{
                            fontSize: "18px",
                            color: "var(--text-mid)",
                            fontWeight: 300,
                            fontFamily: "Crimson Pro, Georgia, serif",
                          }}
                        >
                          {entry.subtitle}
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: "right", paddingTop: "4px" }}>
                      {entry.category && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "9px",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "var(--accent)",
                            marginBottom: "6px",
                          }}
                        >
                          {entry.category}
                        </span>
                      )}
                      <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </article>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
