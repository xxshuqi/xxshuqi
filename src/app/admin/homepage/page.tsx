import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";
import HomepageEditor from "@/components/admin/HomepageEditor";

export default async function HomepageLayoutPage() {
  const [settings, photos] = await Promise.all([
    Promise.resolve(getSettings()),
    prisma.photo.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 200,
      select: { id: true, thumbUrl: true, originalUrl: true, caption: true, width: true, height: true, featured: true },
    }),
  ]);

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
        Homepage Layout
      </h1>
      <p style={{ color: "#999", fontSize: "13px", marginBottom: "40px" }}>
        Reorder sections, set hero background, and configure counts
      </p>

      <HomepageEditor
        initialSections={settings.sections}
        initialHero={settings.hero}
        photos={photos}
        initialFeaturedId={photos.find((p) => p.featured)?.id ?? null}
      />
    </div>
  );
}
