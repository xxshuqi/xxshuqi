import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photos = await prisma.photo.findMany({
    where: { likes: { some: {} } },
    orderBy: { likes: { _count: "desc" } },
    select: {
      id: true,
      thumbUrl: true,
      caption: true,
      originalUrl: true,
      _count: { select: { likes: true } },
    },
  });

  return NextResponse.json(
    photos.map((p) => ({ ...p, likeCount: p._count.likes }))
  );
}
