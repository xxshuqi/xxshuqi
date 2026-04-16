import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      photo: { select: { id: true, thumbUrl: true, caption: true } },
    },
  });

  return NextResponse.json(comments);
}
