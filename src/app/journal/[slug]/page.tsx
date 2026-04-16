import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import { getJournalEntries } from "@/lib/data";

// Required for static export: tell Next.js which slugs to generate at build time
export async function generateStaticParams() {
  const entries = getJournalEntries().filter((e) => e.published);
  return entries.map((e) => ({ slug: e.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function JournalEntryPage({ params }: PageProps) {
  const { slug } = await params;
  const entries = getJournalEntries();
  const entry = entries.find((e) => e.slug === slug && e.published);

  if (!entry) notFound();

  return (
    <div style={{ paddingTop: "52px" }}>
      <article style={{ padding: "80px 80px 120px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ marginBottom: "60px" }}>
            <SectionLabel number="05" label="Journal" />

            <Link
              href="/journal"
              style={{
                display: "inline-block",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                textDecoration: "none",
                marginBottom: "40px",
              }}
            >
              ← All Entries
            </Link>

            {entry.category && (
              <p
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  marginBottom: "16px",
                }}
              >
                {entry.category}
              </p>
            )}

            <h1
              style={{
                fontFamily: "Libre Caslon Display, Georgia, serif",
                fontSize: "48px",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: "var(--text)",
                marginBottom: "16px",
              }}
            >
              {entry.title}
            </h1>

            {entry.subtitle && (
              <p
                style={{
                  fontFamily: "Crimson Pro, Georgia, serif",
                  fontSize: "22px",
                  fontWeight: 300,
                  color: "var(--text-mid)",
                  marginBottom: "24px",
                  lineHeight: 1.5,
                }}
              >
                {entry.subtitle}
              </p>
            )}

            <p
              style={{
                fontSize: "11px",
                color: "var(--text-faint)",
                letterSpacing: "0.15em",
              }}
            >
              {new Date(entry.createdAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Body */}
          <div
            style={{
              fontFamily: "Crimson Pro, Georgia, serif",
              fontSize: "19px",
              fontWeight: 300,
              lineHeight: 1.85,
              color: "var(--text)",
            }}
          >
            {entry.body.split("\n\n").map((para, i) => (
              <p key={i} style={{ marginBottom: "1.5em" }}>
                {para}
              </p>
            ))}
          </div>

          {/* Attached photos */}
          {entry.photos.length > 0 && (
            <div style={{ marginTop: "80px" }}>
              <div
                style={{
                  width: "40px",
                  height: "1px",
                  background: "var(--border)",
                  marginBottom: "40px",
                }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                {entry.photos.map((photo) => (
                  <div key={photo.id}>
                    <div
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        background:
                          "linear-gradient(135deg, #c5d8e3 0%, #7a9aad 100%)",
                        aspectRatio: `${photo.width} / ${photo.height}`,
                      }}
                    >
                      <Image
                        src={photo.thumbUrl}
                        alt={photo.caption ?? ""}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    {photo.caption && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-light)",
                          marginTop: "6px",
                          fontWeight: 300,
                        }}
                      >
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
