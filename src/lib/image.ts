import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { encode } from "blurhash";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const ORIGINALS_DIR = path.join(UPLOADS_DIR, "originals");
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, "thumbnails");

export async function ensureUploadDirs() {
  await fs.mkdir(ORIGINALS_DIR, { recursive: true });
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
}

export async function processImage(
  buffer: Buffer,
  filename: string
): Promise<{
  originalUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  blurhash: string;
}> {
  await ensureUploadDirs();

  const ext = path.extname(filename).toLowerCase() || ".jpg";
  const base = path.basename(filename, ext);
  const safeName = `${base}-${Date.now()}${ext}`;

  // Process original (max 2400px wide)
  const originalSharp = sharp(buffer);
  const metadata = await originalSharp.metadata();
  const originalWidth = metadata.width ?? 1200;
  const originalHeight = metadata.height ?? 800;

  let processedOriginal = originalSharp;
  if (originalWidth > 2400) {
    processedOriginal = originalSharp.resize(2400, undefined, {
      withoutEnlargement: true,
    });
  }

  const originalBuffer = await processedOriginal
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();

  await fs.writeFile(path.join(ORIGINALS_DIR, safeName), originalBuffer);

  // Generate thumbnail (600px wide)
  const thumbBuffer = await sharp(buffer)
    .resize(600, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();

  const thumbName = `thumb-${safeName}`;
  await fs.writeFile(path.join(THUMBNAILS_DIR, thumbName), thumbBuffer);

  // Get final dimensions
  const finalMeta = await sharp(originalBuffer).metadata();
  const width = finalMeta.width ?? originalWidth;
  const height = finalMeta.height ?? originalHeight;

  // Generate blurhash from small version
  const smallBuffer = await sharp(buffer)
    .resize(32, 32, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const blurhashStr = encode(
    new Uint8ClampedArray(smallBuffer.data),
    smallBuffer.info.width,
    smallBuffer.info.height,
    4,
    3
  );

  return {
    originalUrl: `/uploads/originals/${safeName}`,
    thumbUrl: `/uploads/thumbnails/${thumbName}`,
    width,
    height,
    blurhash: blurhashStr,
  };
}
