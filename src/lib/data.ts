import fs from "fs";
import path from "path";

export interface Photo {
  id: string;
  filename: string;
  originalUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  blurhash?: string | null;
  caption?: string | null;
  category?: string | null;
  camera?: string | null;
  lens?: string | null;
  aperture?: string | null;
  shutter?: string | null;
  iso?: string | null;
  filmSim?: string | null;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  journalEntryId?: string | null;
}

export interface JournalPhoto {
  id: string;
  originalUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  caption?: string | null;
}

export interface JournalEntry {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  body: string;
  category?: string | null;
  published: boolean;
  coverPhotoId?: string | null;
  createdAt: string;
  photos: JournalPhoto[];
}

export function getPhotos(): Photo[] {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "public/data/photos.json"),
    "utf-8"
  );
  return JSON.parse(raw) as Photo[];
}

export function getJournalEntries(): JournalEntry[] {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "public/data/journal.json"),
    "utf-8"
  );
  return JSON.parse(raw) as JournalEntry[];
}
