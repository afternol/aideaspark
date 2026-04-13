import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeIdea } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const industry = searchParams.get("industry");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "新着順";

    const where: any = {};
    if (category && category !== "all") where.category = category;
    if (industry && industry !== "all") where.targetIndustry = industry;
    if (search) {
      where.OR = [
        { serviceName: { contains: search } },
        { concept: { contains: search } },
        { oneLiner: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const orderBy: any =
      sort === "総合スコア順" ? { number: "asc" as const } : { publishedAt: "desc" as const };

    const ideas = await prisma.idea.findMany({
      where,
      orderBy,
    });

    const sessionId = searchParams.get("sessionId") || "";

    const reactionCounts = await prisma.reaction.groupBy({
      by: ["ideaId"],
      _count: true,
    });
    const commentCounts = await prisma.comment.groupBy({
      by: ["ideaId"],
      _count: true,
    });
    const declCounts = await prisma.declaration.groupBy({
      by: ["ideaId"],
      _count: true,
    });

    // Per-type reaction counts
    const reactionsByType = await prisma.reaction.groupBy({
      by: ["ideaId", "type"],
      _count: true,
    });
    const rcByTypeMap: Record<string, Record<string, number>> = {};
    for (const r of reactionsByType) {
      if (!rcByTypeMap[r.ideaId]) rcByTypeMap[r.ideaId] = {};
      rcByTypeMap[r.ideaId][r.type] = r._count;
    }

    // User's own reactions
    let userReactionsMap: Record<string, string[]> = {};
    if (sessionId) {
      const userReactions = await prisma.reaction.findMany({
        where: { sessionId },
        select: { ideaId: true, type: true },
      });
      for (const r of userReactions) {
        if (!userReactionsMap[r.ideaId]) userReactionsMap[r.ideaId] = [];
        userReactionsMap[r.ideaId].push(r.type);
      }
    }

    const rcMap = Object.fromEntries(reactionCounts.map((r) => [r.ideaId, r._count]));
    const ccMap = Object.fromEntries(commentCounts.map((c) => [c.ideaId, c._count]));
    const dcMap = Object.fromEntries(declCounts.map((d) => [d.ideaId, d._count]));

    const serialized = ideas.map((idea) => ({
      ...serializeIdea(idea),
      reactionCount: rcMap[idea.id] || 0,
      commentCount: ccMap[idea.id] || 0,
      declarationCount: dcMap[idea.id] || 0,
      reactionCounts: rcByTypeMap[idea.id] || {},
      userReactions: userReactionsMap[idea.id] || [],
    }));

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error("API /api/ideas error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
