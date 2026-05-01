import { getSettings, SectionConfig } from "@/lib/settings";
import { getPhotos, getJournalEntries } from "@/lib/data";
import {
  buildPhotoSrcSet,
  getPhotoAlt,
  getThumbIntrinsicSize,
} from "@/lib/photoMedia";
import Hero from "@/components/home/Hero";
import FeaturedBook from "@/components/home/FeaturedBook";
import type { FeaturedPhoto } from "@/components/home/FeaturedBook";
import PhotoGrid from "@/components/home/PhotoGrid";
import FilmStrip from "@/components/home/FilmStrip";
import JournalPreview from "@/components/home/JournalPreview";
import SectionLabel from "@/components/ui/SectionLabel";
import ScrollReveal from "@/components/ui/ScrollReveal";

const HOME_SIDE_PADDING = "80px";
const HOME_SECTION_SPACING = "80px";

export default function HomePage() {
  const settings = getSettings();
  const { sections, hero } = settings;

  const allPhotos = getPhotos();
  const allJournal = getJournalEntries();

  const visible = (id: SectionConfig["id"]) =>
    sections.find((s) => s.id === id)?.visible ?? true;

  const count = (id: SectionConfig["id"], fallback: number) =>
    sections.find((s) => s.id === id)?.count ?? fallback;

  const featuredPhotos = visible("featured")
    ? [
        ...allPhotos.filter((p) => p.featured),
        ...allPhotos.filter((p) => !p.featured && p.title && p.story),
      ]
        .filter((photo) => photo.title && photo.story)
        .map((photo): FeaturedPhoto => {
          const intrinsic = getThumbIntrinsicSize(photo);

          return {
            id: photo.id,
            imageUrl: photo.thumbUrl,
            srcSet: buildPhotoSrcSet(photo),
            width: intrinsic.width,
            height: intrinsic.height,
            alt: getPhotoAlt(photo, "Featured photo"),
            filmSimulation: (photo.filmSim ?? "Classic Negative").toUpperCase(),
            title: photo.title ?? "",
            quote: photo.story ?? "",
            camera: photo.camera ?? "",
            aperture: photo.aperture ?? "",
            shutter: photo.shutter ?? "",
            galleryUrl: `/gallery?photo=${photo.id}`,
          };
        })
        .slice(0, 5)
    : [];

  const recentPhotos = visible("grid")
    ? allPhotos.slice(0, Math.max(count("grid", 14), 14))
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
            <section
              className="section-featured"
              style={{ padding: `100px ${HOME_SIDE_PADDING} ${HOME_SECTION_SPACING}` }}
            >
              <SectionLabel number={sectionNumber("featured")} label="Featured" />
              <FeaturedBook photos={featuredPhotos} />
            </section>
          </ScrollReveal>
        );

      case "grid":
        return (
          <ScrollReveal key="grid">
            <section
              className="section-grid"
              style={{ padding: `0 ${HOME_SIDE_PADDING} ${HOME_SECTION_SPACING}` }}
            >
              <SectionLabel number={sectionNumber("grid")} label="Recent Work" />
              <PhotoGrid photos={recentPhotos} />
            </section>
          </ScrollReveal>
        );

      case "filmstrip":
        return filmStripPhotos.length > 0 ? (
          <ScrollReveal key="filmstrip">
            <section
              className="section-filmstrip-wrap"
              style={{ marginBottom: HOME_SECTION_SPACING }}
            >
              <div
                className="section-filmstrip-label"
                style={{ padding: `0 ${HOME_SIDE_PADDING}`, marginBottom: "24px" }}
              >
                <SectionLabel number={sectionNumber("filmstrip")} label="Contact Sheet" />
              </div>
              <FilmStrip photos={filmStripPhotos} />
            </section>
          </ScrollReveal>
        ) : null;

      case "journal":
        return (
          <ScrollReveal key="journal">
            <section
              className="section-journal"
              style={{ padding: `0 ${HOME_SIDE_PADDING} ${HOME_SECTION_SPACING}` }}
            >
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
