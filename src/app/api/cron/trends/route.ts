import { NextResponse } from "next/server";
import { refreshTrendsCache, refreshExpertScoresWithClaude, computePlatformScores } from "@/lib/trend-scorer";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 未設定なら制限なし
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  // mode=ai → Claude web_search でスコア更新（週1回程度推奨）
  if (mode === "ai") {
    try {
      const result = await refreshExpertScoresWithClaude();
      return NextResponse.json({ ok: true, mode: "ai", ...result });
    } catch (error: any) {
      console.error("[cron/trends ai]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // mode=platform → ユーザー行動スコアのみ即時更新（負荷低）
  if (mode === "platform") {
    try {
      const platformScores = await computePlatformScores();
      let count = 0;
      for (const [keyword, score] of platformScores) {
        if (score > 0) {
          await prisma.trendCache.updateMany({ where: { keyword }, data: { platformScore: score } });
          count++;
        }
      }
      return NextResponse.json({ ok: true, mode: "platform", platformUpdated: count });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // デフォルト: Google Trends + ユーザー行動（毎日cron）
  try {
    const result = await refreshTrendsCache();
    return NextResponse.json({ ok: true, mode: "full", ...result });
  } catch (error: any) {
    console.error("[cron/trends full]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
