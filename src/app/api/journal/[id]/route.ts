import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const allowed = ["title", "subtitle", "slug", "body", "category", "published", "coverPhotoId"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) update[key] = data[key];
  }

  // Update attached photos using set (replaces entire collection)
  if (Array.isArray(data.photoIds)) {
    update.photos = { set: (data.photoIds as string[]).map((pid) => ({ id: pid })) };
  }

  const entry = await prisma.journalEntry.update({
    where: { id },
    data: update,
  });

  return NextResponse.json(entry);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.journalEntry.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
