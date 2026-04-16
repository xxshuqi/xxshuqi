import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const published = searchParams.get("published");

  const entries = await prisma.journalEntry.findMany({
    where: {
      ...(published === "true" ? { published: true } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  if (!data.title || !data.slug) {
    return NextResponse.json(
      { error: "Title and slug are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.journalEntry.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const photoIds: string[] = Array.isArray(data.photoIds) ? data.photoIds : [];

  const entry = await prisma.journalEntry.create({
    data: {
      title: data.title,
      subtitle: data.subtitle ?? null,
      slug: data.slug,
      body: data.body ?? "",
      category: data.category ?? null,
      published: data.published ?? false,
      coverPhotoId: data.coverPhotoId ?? null,
      ...(photoIds.length > 0 && {
        photos: { connect: photoIds.map((id) => ({ id })) },
      }),
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
