import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import sharp from "sharp";
import { encode } from "blurhash";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

interface TransformBody {
  rotate?: number; // degrees, any value (will be normalized)
  crop?: {
    // pixel coords in the CURRENT (pre-transform) original image
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const ORIGINALS_DIR = path.join(UPLOADS_DIR, "originals");
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, "thumbnails");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as TransformBody;

  const rotate = body.rotate ? ((body.rotate % 360) + 360) % 360 : 0;
  const crop = body.crop;

  if (!rotate && !crop) {
    return NextResponse.json(
      { error: "No transformation provided" },
      { status: 400 }
    );
  }

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const originalPath = path.join(process.cwd(), "public", photo.originalUrl);
  const oldThumbPath = path.join(process.cwd(), "public", photo.thumbUrl);

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(originalPath);
  } catch {
    return NextResponse.json(
      { error: "Original file missing" },
      { status: 410 }
    );
  }

  // Apply crop first (in original orientation), then rotate.
  let pipeline = sharp(buffer);

  if (crop) {
    const meta = await sharp(buffer).metadata();
    const imgW = meta.width ?? photo.width;
    const imgH = meta.height ?? photo.height;

    const x = Math.max(0, Math.round(crop.x));
    const y = Math.max(0, Math.round(crop.y));
    const width = Math.min(imgW - x, Math.round(crop.width));
    const height = Math.min(imgH - y, Math.round(crop.height));

    if (width < 2 || height < 2) {
      return NextResponse.json(
        { error: "Crop region too small" },
        { status: 400 }
      );
    }

    pipeline = pipeline.extract({ left: x, top: y, width, height });
  }

  if (rotate) {
    pipeline = pipeline.rotate(rotate);
  }

  const processed = await pipeline
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();

  const finalMeta = await sharp(processed).metadata();
  const width = finalMeta.width ?? photo.width;
  const height = finalMeta.height ?? photo.height;

  // Write to a new filename so browser caches bust naturally.
  const ext = path.extname(photo.filename).toLowerCase() || ".jpg";
  const base = path.basename(photo.filename, ext);
  const stamped = `${base}-${Date.now()}${ext}`;
  const newOriginalName = stamped;
  const newThumbName = `thumb-${stamped}`;

  await fs.mkdir(ORIGINALS_DIR, { recursive: true });
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
  await fs.writeFile(path.join(ORIGINALS_DIR, newOriginalName), processed);

  const thumbBuffer = await sharp(processed)
    .resize(600, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();
  await fs.writeFile(path.join(THUMBNAILS_DIR, newThumbName), thumbBuffer);

  // Regenerate blurhash.
  const small = await sharp(processed)
    .resize(32, 32, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const blurhash = encode(
    new Uint8ClampedArray(small.data),
    small.info.width,
    small.info.height,
    4,
    3
  );

  // Delete old files (best-effort).
  try {
    await fs.unlink(originalPath);
  } catch {}
  try {
    await fs.unlink(oldThumbPath);
  } catch {}

  const updated = await prisma.photo.update({
    where: { id },
    data: {
      originalUrl: `/uploads/originals/${newOriginalName}`,
      thumbUrl: `/uploads/thumbnails/${newThumbName}`,
      width,
      height,
      blurhash,
    },
  });

  return NextResponse.json(updated);
}
