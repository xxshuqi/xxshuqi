import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/photos/liked?session=<sessionId>
// Returns the set of photo IDs liked by this session
export async function GET(request: NextRequest) {
  const sessionId = new URL(request.url).searchParams.get("session") ?? "";
  if (!sessionId) return NextResponse.json({ liked: [] });

  const likes = await prisma.like.findMany({
    where: { sessionId },
    select: { photoId: true },
  });

  return NextResponse.json({ liked: likes.map((l) => l.photoId) });
}
