import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/photos/[id]/like?session=<sessionId>
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = new URL(request.url).searchParams.get("session") ?? "";

  const [count, existing] = await Promise.all([
    prisma.like.count({ where: { photoId: id } }),
    sessionId ? prisma.like.findUnique({ where: { photoId_sessionId: { photoId: id, sessionId } } }) : null,
  ]);

  return NextResponse.json({ count, liked: !!existing });
}

// POST /api/photos/[id]/like  body: { sessionId }  — toggles like
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { sessionId } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const existing = await prisma.like.findUnique({
    where: { photoId_sessionId: { photoId: id, sessionId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { photoId: id, sessionId } });
  }

  const count = await prisma.like.count({ where: { photoId: id } });
  return NextResponse.json({ count, liked: !existing });
}
