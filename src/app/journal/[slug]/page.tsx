import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import { getJournalEntries, type JournalPhoto } from "@/lib/data";

// Required for static export: pre-render all published slugs at build time
export async function generateStaticParams() {
  const entries = getJournalEntries().filter((e) => e.published);
  return entries.map((e) => ({ slug: e.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getJournalEntries().find(
    (e) => e.slug === slug && e.published
  );
  if (!entry) return {};

  const cover =
    entry.photos.find((p) => p.id === entry.coverPhotoId) ?? entry.photos[0];
  const description = entry.subtitle ?? entry.body.slice(0, 160);

  return {
    title: `${entry.title} — The Wandering Bunny`,
    description,
    openGraph: {
      title: entry.title,
      description,
      type: "article",
      images: cover
        ? [
            {
              url: cover.originalUrl,
              width: cover.width,
              height: cover.height,
              alt: cover.caption ?? entry.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description,
      images: cover ? [cover.originalUrl] : undefined,
    },
  };
}

export default async function JournalEntryPage({ params }: PageProps) {
  const { slug } = await params;
  const entries = getJournalEntries();
  const entry = entries.find((e) => e.slug === slug && e.published);

  if (!entry) notFound();

  const formattedDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ paddingTop: "52px" }}>
      <article style={{ padding: "80px 80px 120px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ marginBottom: "60px" }}>
            <SectionLabel number="04" label="Journal" />
          </div>

          {/* Header */}
          <header style={{ marginBottom: "60px" }}>
            {entry.category && (
              <p
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.3em",
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
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                marginBottom: "16px",
              }}
            >
              {entry.title}
            </h1>

            {entry.subtitle && (
              <p
                style={{
                  fontFamily: "Crimson Pro, Georgia, serif",
                  fontSize: "20px",
                  fontStyle: "italic",
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
                textTransform: "uppercase",
              }}
            >
              {formattedDate}
            </p>
          </header>

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
                className="journal-photos-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                {entry.photos.map((photo: JournalPhoto) => (
                  <div key={photo.id}>
                    <Link
                      href={`/gallery?photo=${photo.id}`}
                      style={{ display: "block" }}
                    >
                      <div
                        style={{
                          position: "relative",
                          overflow: "hidden",
                          background:
                            "linear-gradient(135deg, #c5d8e3 0%, #7a9aad 100%)",
                          aspectRatio: `${photo.width} / ${photo.height}`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.thumbUrl}
                          srcSet={`${photo.thumbUrl} 1200w, ${photo.originalUrl} 2400w`}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          alt={photo.caption ?? ""}
                          width={photo.width}
                          height={photo.height}
                          loading="lazy"
                          decoding="async"
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    </Link>
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

          {/* Footer link back to journal index */}
          <div
            style={{
              marginTop: "80px",
              paddingTop: "40px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <Link
              href="/journal"
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
              ← All Entries
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
