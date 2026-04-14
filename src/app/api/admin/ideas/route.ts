import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 管理者チェック
async function isAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.email) return false;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return session.user.email === adminEmail;
}

// GET: アイデア一覧（管理用）
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ideas = await prisma.idea.findMany({
    select: { id: true, number: true, slug: true, serviceName: true, category: true, publishedAt: true, views: true, bookmarks: true },
    orderBy: { number: "asc" },
  });

  return NextResponse.json(ideas);
}

// POST: アイデア新規追加
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      id, slug, number, serviceName, concept, target, problem, product,
      revenueModel, competitors, competitiveEdge, tags, category,
      targetIndustry, targetCustomer, investmentScale, difficulty,
      scores, scoreComments, trendKeywords, oneLiner, publishedAt, inspirationSource,
    } = body;

    if (!id || !slug || !number || !serviceName) {
      return NextResponse.json({ error: "id, slug, number, serviceName は必須です" }, { status: 400 });
    }

    const idea = await prisma.idea.create({
      data: {
        id, slug, number: Number(number), serviceName, concept, target, problem, product,
        revenueModel, competitors, competitiveEdge,
        tags: tags || [],
        category, targetIndustry, targetCustomer: targetCustomer || "",
        investmentScale, difficulty,
        scores: scores || {},
        scoreComments: scoreComments || {},
        trendKeywords: trendKeywords || [],
        oneLiner, publishedAt: publishedAt || new Date().toISOString().split("T")[0],
        inspirationSource: inspirationSource || null,
        views: 0,
        bookmarks: 0,
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "IDまたはslugが重複しています" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: アイデア削除
export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.idea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
