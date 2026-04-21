import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 自分の評価を取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ideaId } = await params;
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json(null);

  const rating = await prisma.ideaRating.findUnique({
    where: { ideaId_sessionId: { ideaId, sessionId } },
  });
  return NextResponse.json(rating);
}

// POST: 評価を保存（upsert）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ideaId } = await params;
  const { sessionId, isNovel, isTimely, isFeasible, isExisting } = await request.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const rating = await prisma.ideaRating.upsert({
    where: { ideaId_sessionId: { ideaId, sessionId } },
    create: { ideaId, sessionId, isNovel, isTimely, isFeasible, isExisting },
    update: { isNovel, isTimely, isFeasible, isExisting },
  });
  return NextResponse.json(rating);
}
