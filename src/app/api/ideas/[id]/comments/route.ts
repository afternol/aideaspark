import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: { ideaId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { sessionId, body, parentId, nickname } = await request.json();

  if (!sessionId || !body?.trim()) {
    return NextResponse.json({ error: "sessionId and body required" }, { status: 400 });
  }

  if (body.length > 1000) {
    return NextResponse.json({ error: "Comment too long" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      ideaId: id,
      sessionId,
      body: body.trim(),
      parentId: parentId || null,
      nickname: nickname?.trim() || "匿名",
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
