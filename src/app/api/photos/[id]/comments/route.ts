import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/photos/[id]/comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: { photoId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

// POST /api/photos/[id]/comments  body: { author, body }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { author, body } = await request.json();

  if (!author?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "author and body required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      photoId: id,
      author: author.trim().slice(0, 60),
      body: body.trim().slice(0, 500),
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
