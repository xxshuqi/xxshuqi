import { getSettings, SectionConfig } from "@/lib/settings";
import { getPhotos, getJournalEntries } from "@/lib/data";
import Hero from "@/components/home/Hero";
import FeaturedStory from "@/components/home/FeaturedStory";
import PhotoGrid from "@/components/home/PhotoGrid";
import FilmStrip from "@/components/home/FilmStrip";
import JournalPreview from "@/components/home/JournalPreview";
import SectionLabel from "@/components/ui/SectionLabel";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function HomePage() {
  const settings = getSettings();
  const { sections, hero } = settings;

  const allPhotos = getPhotos();
  const allJournal = getJournalEntries();

  const visible = (id: SectionConfig["id"]) =>
    sections.find((s) => s.id === id)?.visible ?? true;

  const count = (id: SectionConfig["id"], fallback: number) =>
    sections.find((s) => s.id === id)?.count ?? fallback;

  const featuredPhoto = visible("featured")
    ? (allPhotos.find((p) => p.featured) ?? null)
    : null;

  const recentPhotos = visible("grid")
    ? allPhotos.slice(0, count("grid", 8))
    : [];

  const filmStripPhotos = visible("filmstrip")
    ? allPhotos.slice(0, count("filmstrip", 12))
    : [];

  const journalEntries = visible("journal")
    ? allJournal.filter((e) => e.published).slice(0, count("journal", 3))
    : [];

  const heroBgUrl = hero.bgPhotoId
    ? (allPhotos.find((p) => p.id === hero.bgPhotoId)?.originalUrl ?? null)
    : null;

  const sectionNumber = (id: string) => {
    const visibleSections = sections.filter((s) => s.visible);
    const idx = visibleSections.findIndex((s) => s.id === id);
    return idx >= 0 ? String(idx + 1).padStart(2, "0") : "00";
  };

  const renderSection = (section: SectionConfig) => {
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
              <JournalPreview entries={journalEntries} />
            </section>
          </ScrollReveal>
        );

      default:
        return null;
    }
  };

  return <>{sections.map((section) => renderSection(section))}</>;
}
