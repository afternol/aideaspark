import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeIdea } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const userId = session.user.id;

    // Get user's interests
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true },
    });

    // Get categories from view history
    const history = await prisma.viewHistory.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: 20,
    });
    const viewedIds = new Set(history.map((h) => h.ideaId));

    const viewedIdeas = await prisma.idea.findMany({
      where: { id: { in: [...viewedIds] } },
      select: { category: true, targetIndustry: true, targetCustomer: true },
    });

    // Build preference profile
    const catCounts: Record<string, number> = {};
    const indCounts: Record<string, number> = {};
    for (const idea of viewedIdeas) {
      catCounts[idea.category] = (catCounts[idea.category] || 0) + 1;
      indCounts[idea.targetIndustry] = (indCounts[idea.targetIndustry] || 0) + 1;
    }

    // Add declared interests
    if (user?.interests) {
      const interests = JSON.parse(user.interests) as string[];
      for (const i of interests) {
        catCounts[i] = (catCounts[i] || 0) + 3; // Boost explicit interests
      }
    }

    // Score all ideas
    const allIdeas = await prisma.idea.findMany();
    const scored = allIdeas
      .filter((idea) => !viewedIds.has(idea.id)) // Exclude already viewed
      .map((idea) => {
        let score = 0;
        score += (catCounts[idea.category] || 0) * 10;
        score += (indCounts[idea.targetIndustry] || 0) * 5;
        // Small random factor to add variety
        score += Math.random() * 5;
        return { idea, score };
      });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 6).map((s) => serializeIdea(s.idea));

    return NextResponse.json(top);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
