import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: { ideaId: id, deletedAt: null },
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

  // 認証済みユーザーなら userId も保存
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const comment = await prisma.comment.create({
    data: {
      ideaId: id,
      sessionId,
      userId,
      body: body.trim(),
      parentId: parentId || null,
      nickname: nickname?.trim() || "匿名",
    },
  });

  // 返信の場合、親コメントの投稿者（userId あり）に通知
  if (parentId && userId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { userId: true, nickname: true },
    });
    // 親コメントの投稿者が認証済みかつ自分自身への返信でない場合
    if (parentComment?.userId && parentComment.userId !== userId) {
      const idea = await prisma.idea.findUnique({
        where: { id },
        select: { serviceName: true, slug: true },
      });
      await prisma.notification.create({
        data: {
          userId: parentComment.userId,
          type: "comment_reply",
          message: `${nickname || "匿名"} さんがあなたのコメントに返信しました`,
          linkUrl: idea ? `/ideas/${idea.slug}` : null,
        },
      });
    }
  }

  return NextResponse.json(comment, { status: 201 });
}
