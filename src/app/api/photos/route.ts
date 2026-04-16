import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const limit = parseInt(searchParams.get("limit") ?? "100");

  const photos = await prisma.photo.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(featured === "true" ? { featured: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      _count: { select: { likes: true, comments: true } },
      comments: { orderBy: { createdAt: "desc" }, take: 1, select: { author: true, body: true } },
    },
  });

  return NextResponse.json(photos);
}
