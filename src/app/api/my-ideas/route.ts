import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeIdea } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id ?? null;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ customIdeas: [], plans: [] });

    const idWhere = authUserId
      ? { OR: [{ authUserId }, { userId: sessionId }] }
      : { userId: sessionId };

    const customIdeas = await prisma.customIdea.findMany({
      where: idWhere,
      orderBy: { createdAt: "desc" },
    });

    const plans = await prisma.businessPlan.findMany({
      where: idWhere,
      orderBy: { createdAt: "desc" },
    });

    const allIdeaIds = new Set<string>();
    customIdeas.forEach((c) => allIdeaIds.add(c.baseIdeaId));
    plans.forEach((p) => { if (p.ideaId) allIdeaIds.add(p.ideaId); });

    const ideas = await prisma.idea.findMany({
      where: { id: { in: [...allIdeaIds] } },
    });
    const ideaMap = new Map(ideas.map((i) => [i.id, serializeIdea(i)]));

    const customBaseMap = new Map(customIdeas.map((c) => [c.id, c.baseIdeaId]));

    const enrichedCustom = customIdeas.map((c) => {
      const base = ideaMap.get(c.baseIdeaId);
      // conditions/result は Json 型 → すでにオブジェクト
      const conditions = c.conditions as any;
      const result = c.result as any;
      return {
        id: c.id,
        baseIdeaId: c.baseIdeaId,
        baseIdea: base ? { id: base.id, slug: base.slug, serviceName: base.serviceName } : null,
        conditions,
        result,
        hasPlan: plans.some((p) => p.customIdeaId === c.id),
        createdAt: c.createdAt,
      };
    });

    const enrichedPlans = plans.map((p) => {
      // content は Json 型 → すでにオブジェクト
      const content = p.content as any;
      let baseIdeaId = p.ideaId || "";
      if (!baseIdeaId && p.customIdeaId) {
        baseIdeaId = customBaseMap.get(p.customIdeaId) || "";
      }
      const baseIdea = ideaMap.get(baseIdeaId);
      return {
        id: p.id,
        baseIdeaId,
        serviceName: content.serviceName || baseIdea?.serviceName || "",
        sourceSlug: baseIdea?.slug || "",
        isCustom: !!p.customIdeaId,
        content,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({ customIdeas: enrichedCustom, plans: enrichedPlans });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id ?? null;
    const { type, id, sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({}, { status: 401 });

    const ownerCheck = authUserId
      ? { id, OR: [{ authUserId }, { userId: sessionId }] }
      : { id, userId: sessionId };

    if (type === "custom") {
      await prisma.customIdea.deleteMany({ where: ownerCheck });
    } else if (type === "plan") {
      await prisma.businessPlan.deleteMany({ where: ownerCheck });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
