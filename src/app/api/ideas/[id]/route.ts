import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeIdea } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      _count: { select: { reactions: true, comments: true, declarations: true } },
    },
  });

  if (!idea) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get reaction counts by type
  const reactionCounts = await prisma.reaction.groupBy({
    by: ["type"],
    where: { ideaId: id },
    _count: true,
  });

  const counts: Record<string, number> = {};
  for (const r of reactionCounts) {
    counts[r.type] = r._count;
  }

  // Get user's reactions
  let userReactions: string[] = [];
  if (sessionId) {
    const mine = await prisma.reaction.findMany({
      where: { ideaId: id, sessionId },
      select: { type: true },
    });
    userReactions = mine.map((r) => r.type);
  }

  // Check if user declared
  let userDeclared = false;
  if (sessionId) {
    const decl = await prisma.declaration.findUnique({
      where: { ideaId_sessionId: { ideaId: id, sessionId } },
    });
    userDeclared = !!decl;
  }

  return NextResponse.json({
    ...serializeIdea(idea),
    reactionCount: idea._count.reactions,
    commentCount: idea._count.comments,
    declarationCount: idea._count.declarations,
    reactionCounts: counts,
    userReactions,
    userDeclared,
  });
}
