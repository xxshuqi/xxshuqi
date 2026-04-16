import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";
import { processImage } from "@/lib/image";
import { extractExif } from "@/lib/exif";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Extract EXIF first
  const exif = await extractExif(buffer);

  // Process image (resize, thumbnail, blurhash)
  const { originalUrl, thumbUrl, width, height, blurhash } = await processImage(
    buffer,
    file.name
  );

  // Save to database
  const photo = await prisma.photo.create({
    data: {
      filename: file.name,
      originalUrl,
      thumbUrl,
      width,
      height,
      blurhash,
      camera: exif.camera,
      lens: exif.lens,
      aperture: exif.aperture,
      shutter: exif.shutter,
      iso: exif.iso,
      filmSim: exif.filmSim,
    },
  });

  return NextResponse.json(photo);
}
