import { prisma } from "@/lib/db";
import PhotoManager from "@/components/admin/PhotoManager";
import Link from "next/link";

export default async function AdminPhotosPage() {
  const photos = await prisma.photo.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 400,
              marginBottom: "4px",
              fontFamily: "Libre Caslon Display, Georgia, serif",
            }}
          >
            Photos
          </h1>
          <p style={{ color: "#999", fontSize: "13px" }}>
            {photos.length} photos total
          </p>
        </div>

        <Link
          href="/admin/upload"
          style={{
            padding: "10px 20px",
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "13px",
          }}
        >
          + Upload
        </Link>
      </div>

      <PhotoManager initialPhotos={photos.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      }))} />
    </div>
  );
}
