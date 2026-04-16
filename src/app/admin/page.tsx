import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export default async function AdminDashboard() {
  const [totalPhotos, totalEntries, recentPhotos] = await Promise.all([
    prisma.photo.count(),
    prisma.journalEntry.count(),
    prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const stats = [
    { label: "Total Photos", value: totalPhotos },
    { label: "Journal Entries", value: totalEntries },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 400,
          marginBottom: "8px",
          fontFamily: "Libre Caslon Display, Georgia, serif",
        }}
      >
        Dashboard
      </h1>
      <p style={{ color: "#999", fontSize: "13px", marginBottom: "40px" }}>
        Welcome back
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "48px" }}>
        {stats.map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "24px 28px",
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              background: "#fff",
              minWidth: "140px",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: 300,
                color: "#111",
                lineHeight: 1,
                marginBottom: "6px",
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: "12px", color: "#999", letterSpacing: "0.1em" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "48px" }}>
        <Link
          href="/admin/upload"
          style={{
            padding: "12px 20px",
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "13px",
            letterSpacing: "0.05em",
          }}
        >
          + Upload Photos
        </Link>
        <Link
          href="/admin/journal/new"
          style={{
            padding: "12px 20px",
            background: "#f0f0f0",
            color: "#555",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "13px",
            letterSpacing: "0.05em",
          }}
        >
          + New Journal Entry
        </Link>
      </div>

      {/* Recent uploads */}
      {recentPhotos.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: "14px",
              color: "#999",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "16px",
              fontWeight: 400,
            }}
          >
            Recent Uploads
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "8px",
            }}
          >
            {recentPhotos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  aspectRatio: "1",
                  position: "relative",
                  background: "linear-gradient(135deg, #c5d8e3, #7a9aad)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={photo.thumbUrl}
                  alt={photo.caption ?? ""}
                  fill
                  sizes="120px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
