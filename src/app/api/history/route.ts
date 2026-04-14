import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeIdea } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const history = await prisma.viewHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { viewedAt: "desc" },
      take: 50,
    });

    const ideaIds = history.map((h) => h.ideaId);
    const ideas = await prisma.idea.findMany({ where: { id: { in: ideaIds } } });

    const result = history.map((h) => {
      const idea = ideas.find((i) => i.id === h.ideaId);
      return idea ? { ...serializeIdea(idea), viewedAt: h.viewedAt } : null;
    }).filter(Boolean);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

    const { ideaId } = await request.json();
    if (!ideaId) return NextResponse.json({ error: "ideaId required" }, { status: 400 });

    // isNew: true = first view (not an update)
    const existing = await prisma.viewHistory.findUnique({
      where: { userId_ideaId: { userId: session.user.id, ideaId } },
    });

    await prisma.viewHistory.upsert({
      where: { userId_ideaId: { userId: session.user.id, ideaId } },
      update: { viewedAt: new Date() },
      create: { userId: session.user.id, ideaId },
    });

    // 初回閲覧のみ views をインクリメント
    if (!existing) {
      await prisma.idea.update({
        where: { id: ideaId },
        data: { views: { increment: 1 } },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
