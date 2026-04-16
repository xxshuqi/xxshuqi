import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminJournalPage() {
  const entries = await prisma.journalEntry.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true } } },
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 400,
              marginBottom: "4px",
              fontFamily: "Libre Caslon Display, Georgia, serif",
            }}
          >
            Journal
          </h1>
          <p style={{ color: "#999", fontSize: "13px" }}>
            {entries.length} entries
          </p>
        </div>

        <Link
          href="/admin/journal/new"
          style={{
            padding: "10px 20px",
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "13px",
          }}
        >
          + New Entry
        </Link>
      </div>

      {entries.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px",
            color: "#ccc",
            fontSize: "14px",
          }}
        >
          No journal entries yet
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "24px",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom:
                  i < entries.length - 1 ? "1px solid #e8e8e8" : "none",
                background: "#fff",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 400,
                      color: "#111",
                    }}
                  >
                    {entry.title}
                  </h3>
                  <span
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      background: entry.published ? "#e8f5e8" : "#f5f5f5",
                      color: entry.published ? "#2a7a2a" : "#999",
                    }}
                  >
                    {entry.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#999" }}>
                  {entry.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {entry._count.photos > 0 && ` · ${entry._count.photos} photos`}
                  {entry.category && ` · ${entry.category}`}
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  href={`/admin/journal/${entry.id}/edit`}
                  style={{
                    padding: "6px 14px",
                    background: "#f0f0f0",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#555",
                    textDecoration: "none",
                  }}
                >
                  Edit
                </Link>
                {entry.published && (
                  <Link
                    href={`/journal/${entry.slug}`}
                    target="_blank"
                    style={{
                      padding: "6px 14px",
                      background: "#f0f0f0",
                      borderRadius: "4px",
                      fontSize: "12px",
                      color: "#555",
                      textDecoration: "none",
                    }}
                  >
                    View ↗
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
