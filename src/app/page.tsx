import { prisma } from "@/lib/db";
import { getSettings, SectionConfig } from "@/lib/settings";
import Hero from "@/components/home/Hero";
import FeaturedStory from "@/components/home/FeaturedStory";
import PhotoGrid from "@/components/home/PhotoGrid";
import FilmStrip from "@/components/home/FilmStrip";
import JournalPreview from "@/components/home/JournalPreview";
import SectionLabel from "@/components/ui/SectionLabel";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const revalidate = 60;

export default async function HomePage() {
  const settings = getSettings();
  const { sections, hero } = settings;

  const visible = (id: SectionConfig["id"]) =>
    sections.find((s) => s.id === id)?.visible ?? true;

  const count = (id: SectionConfig["id"], fallback: number) =>
    sections.find((s) => s.id === id)?.count ?? fallback;

  const [featuredPhotos, recentPhotos, filmStripPhotos, journalEntries, bgPhoto] =
    await Promise.all([
      visible("featured")
        ? prisma.photo.findMany({ where: { featured: true }, orderBy: { createdAt: "desc" }, take: 1 })
        : Promise.resolve([]),
      visible("grid")
        ? prisma.photo.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: count("grid", 8) })
        : Promise.resolve([]),
      visible("filmstrip")
        ? prisma.photo.findMany({ orderBy: { createdAt: "desc" }, take: count("filmstrip", 12) })
        : Promise.resolve([]),
      visible("journal")
        ? prisma.journalEntry.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: count("journal", 3) })
        : Promise.resolve([]),
      hero.bgPhotoId
        ? prisma.photo.findUnique({ where: { id: hero.bgPhotoId }, select: { originalUrl: true } })
        : Promise.resolve(null),
    ]);

  const featuredPhoto = featuredPhotos[0] ?? null;
  const heroBgUrl = bgPhoto?.originalUrl ?? null;

  // Build section order
  const sectionNumber = (id: string) => {
    const visibleSections = sections.filter((s) => s.visible);
    const idx = visibleSections.findIndex((s) => s.id === id);
    return idx >= 0 ? String(idx + 1).padStart(2, "0") : "00";
  };

  const renderSection = (section: SectionConfig, i: number) => {
    if (!section.visible) return null;

    switch (section.id) {
      case "hero":
        return (
          <Hero
            key="hero"
            title={hero.title}
            tagline={hero.tagline}
            bgUrl={heroBgUrl}
            bgAnimation={hero.bgAnimation}
            bgOverlay={hero.bgOverlay}
          />
        );

      case "featured":
        return (
          <ScrollReveal key="featured">
            <section style={{ padding: "120px 80px" }}>
              <SectionLabel number={sectionNumber("featured")} label="Featured" />
              <FeaturedStory photo={featuredPhoto} />
            </section>
          </ScrollReveal>
        );

      case "grid":
        return (
          <ScrollReveal key="grid">
            <section style={{ padding: "0 80px 120px" }}>
              <SectionLabel number={sectionNumber("grid")} label="Recent Work" />
              <PhotoGrid photos={recentPhotos} />
            </section>
          </ScrollReveal>
        );

      case "filmstrip":
        return filmStripPhotos.length > 0 ? (
          <ScrollReveal key="filmstrip">
            <section style={{ marginBottom: "120px" }}>
              <div style={{ padding: "0 80px", marginBottom: "32px" }}>
                <SectionLabel number={sectionNumber("filmstrip")} label="Contact Sheet" />
              </div>
              <FilmStrip photos={filmStripPhotos} />
            </section>
          </ScrollReveal>
        ) : null;

      case "journal":
        return (
          <ScrollReveal key="journal">
            <section style={{ padding: "0 80px 120px" }}>
              <SectionLabel number={sectionNumber("journal")} label="Journal" />
              <JournalPreview
                entries={journalEntries.map((e) => ({
                  ...e,
                  createdAt: e.createdAt.toISOString(),
                }))}
              />
            </section>
          </ScrollReveal>
        );

      default:
        return null;
    }
  };

  return <>{sections.map((section, i) => renderSection(section, i))}</>;
}
