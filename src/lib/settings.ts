import fs from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "homepage-settings.json");

export interface SectionConfig {
  id: "hero" | "featured" | "grid" | "filmstrip" | "journal";
  label: string;
  visible: boolean;
  count?: number;
}

export interface GearItem {
  label: string;
  value: string;
}

export interface AboutConfig {
  heading: string;
  bio: string; // paragraphs separated by \n\n
  gear: GearItem[];
}

export interface HeroConfig {
  title: string;
  tagline: string;
  bgPhotoId?: string | null;
  bgAnimation?: "kenburns" | "zoom" | "none";
  bgOverlay?: number; // 0–1, white overlay opacity
}

export interface HomepageSettings {
  sections: SectionConfig[];
  hero: HeroConfig;
  about: AboutConfig;
}

export const DEFAULT_ABOUT: AboutConfig = {
  heading: "The Photographer",
  bio: "The Wandering Bunny is a personal photography journal. A quiet place for photos made slowly, on Fujifilm cameras, with attention to light, texture, and the kind of moments that pass without announcement.\n\nShot on the Fujifilm X-T30 II with a 14-45mm kit lens. Always drawn to Classic Negative for its quiet, slightly faded warmth.",
  gear: [
    { label: "Body", value: "Fujifilm X-T30 II" },
    { label: "Lens", value: "Fujinon XC 14–45mm" },
    { label: "Film sims", value: "Classic Negative, Classic Chrome, Acros" },
  ],
};

export const DEFAULT_SETTINGS: HomepageSettings = {
  sections: [
    { id: "hero", label: "Hero", visible: true },
    { id: "featured", label: "Featured", visible: true },
    { id: "grid", label: "Photo Grid", visible: true, count: 8 },
    { id: "filmstrip", label: "Film Strip", visible: true, count: 12 },
    { id: "journal", label: "Journal", visible: true, count: 3 },
  ],
  hero: {
    title: "Bunnies.",
    tagline:
      "A personal photo diary. Slow moments, quiet streets, and honest light, captured on Fujifilm.",
    bgPhotoId: null,
    bgAnimation: "kenburns",
    bgOverlay: 0.45,
  },
  about: DEFAULT_ABOUT,
};

export function getSettings(): HomepageSettings {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<HomepageSettings>;
    return {
      sections: parsed.sections ?? DEFAULT_SETTINGS.sections,
      hero: { ...DEFAULT_SETTINGS.hero, ...(parsed.hero ?? {}) },
      about: { ...DEFAULT_ABOUT, ...(parsed.about ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: HomepageSettings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}
