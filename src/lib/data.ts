import fs from "fs";
import path from "path";
import type { PhotoAsset } from "./photoMedia";

export interface Photo extends PhotoAsset {
  filename: string;
  blurhash?: string | null;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  journalEntryId?: string | null;
}

export function getPhotos(): Photo[] {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "public/data/photos.json"),
    "utf-8"
  );
  return JSON.parse(raw) as Photo[];
}
