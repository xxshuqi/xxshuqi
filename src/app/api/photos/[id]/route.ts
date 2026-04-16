import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const allowed = [
    "caption",
    "category",
    "featured",
    "sortOrder",
    "camera",
    "lens",
    "aperture",
    "shutter",
    "iso",
    "filmSim",
    "journalEntryId",
  ];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) update[key] = data[key];
  }

  const photo = await prisma.photo.update({
    where: { id },
    data: update,
  });

  return NextResponse.json(photo);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete files
  try {
    await fs.unlink(path.join(process.cwd(), "public", photo.originalUrl));
    await fs.unlink(path.join(process.cwd(), "public", photo.thumbUrl));
  } catch {
    // Files may not exist
  }

  await prisma.photo.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
