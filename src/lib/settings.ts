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
  bio: "Bunnies. is a personal photography journal — a quiet place for photos made slowly, on Fujifilm cameras, with attention to light, texture, and the kind of moments that pass without announcement.\n\nThe name comes from that feeling of something caught in suspension: a street at 6am, the last light on a wall, a person unaware of being seen. Bunnies. — as in quiet, as in not-moving, as in continuing.\n\nShot primarily on the X-T5, with a preference for Classic Chrome and Acros. Mostly 23mm. Sometimes 35mm.",
  gear: [
    { label: "Body", value: "Fujifilm X-T5" },
    { label: "Primary lens", value: "Fujinon XF 23mm ƒ/2 R WR" },
    { label: "Secondary", value: "Fujinon XF 35mm ƒ/1.4 R" },
    { label: "Film sims", value: "Classic Chrome, Acros, Eterna Cinema" },
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
      "A personal photo diary. Slow moments, quiet streets, and honest light — captured on Fujifilm.",
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
