import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeIdea } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const idea = await prisma.idea.findUnique({ where: { id } });
    if (!idea) return NextResponse.json([], { status: 200 });

    // Find similar ideas by: same category, same targetIndustry, or same targetCustomer
    const similar = await prisma.idea.findMany({
      where: {
        id: { not: id },
        OR: [
          { category: idea.category },
          { targetIndustry: idea.targetIndustry },
          { targetCustomer: idea.targetCustomer },
        ],
      },
    });

    // Score similarity
    const scored = similar.map((s) => {
      let score = 0;
      if (s.category === idea.category) score += 3;
      if (s.targetIndustry === idea.targetIndustry) score += 2;
      if (s.targetCustomer === idea.targetCustomer) score += 2;
      // Tag overlap
      const tags = JSON.parse(idea.tags) as string[];
      const sTags = JSON.parse(s.tags) as string[];
      const overlap = tags.filter((t) => sTags.includes(t)).length;
      score += overlap;
      return { idea: s, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 4).map((s) => serializeIdea(s.idea));

    return NextResponse.json(top);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
