import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeIdea } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    const idea = await prisma.idea.findUnique({
      where: { slug },
    });

    if (!idea) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const reactionCounts = await prisma.reaction.groupBy({
      by: ["type"],
      where: { ideaId: idea.id },
      _count: true,
    });

    const counts: Record<string, number> = {};
    for (const r of reactionCounts) {
      counts[r.type] = r._count;
    }

    let userReactions: string[] = [];
    if (sessionId) {
      const mine = await prisma.reaction.findMany({
        where: { ideaId: idea.id, sessionId },
        select: { type: true },
      });
      userReactions = mine.map((r) => r.type);
    }

    const commentCount = await prisma.comment.count({ where: { ideaId: idea.id } });
    const reactionTotal = await prisma.reaction.count({ where: { ideaId: idea.id } });
    const declarationCount = await prisma.declaration.count({ where: { ideaId: idea.id } });

    return NextResponse.json({
      ...serializeIdea(idea),
      reactionCount: reactionTotal,
      commentCount,
      declarationCount,
      reactionCounts: counts,
      userReactions,
    });
  } catch (error: any) {
    console.error("API /api/ideas/by-slug error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
