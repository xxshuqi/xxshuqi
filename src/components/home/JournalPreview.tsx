"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface JournalEntry {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  category?: string | null;
  createdAt: string;
}

interface JournalPreviewProps {
  entries: JournalEntry[];
}

export default function JournalPreview({ entries }: JournalPreviewProps) {
  if (entries.length === 0) {
    return (
      <p style={{ color: "var(--text-faint)", fontSize: "13px" }}>
        No journal entries yet
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {entries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            delay: i * 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <Link
            href={`/journal/${entry.slug}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr auto",
                gap: "24px",
                alignItems: "start",
                padding: "28px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  color: "var(--text-faint)",
                  paddingTop: "3px",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div>
                <h3
                  style={{
                    fontFamily: "Libre Caslon Display, Georgia, serif",
                    fontSize: "20px",
                    fontWeight: 400,
                    color: "var(--text)",
                    marginBottom: "6px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {entry.title}
                </h3>
                {entry.subtitle && (
                  <p
                    style={{
                      fontSize: "13px",
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
                  }}
                >
                  {new Date(entry.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
