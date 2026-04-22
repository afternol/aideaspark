import { NextResponse } from "next/server";
import { refreshTrendsCache, computePlatformScores, scoreAllCategories } from "@/lib/trend-scorer";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // mode=platform のみ → Google Trends呼び出しなし、行動スコアだけ即時反映
  const { searchParams } = new URL(request.url);
  if (searchParams.get("mode") === "platform") {
    try {
      const platformScores = await computePlatformScores();
      let count = 0;
      for (const [keyword, score] of platformScores) {
        if (score > 0) {
          await prisma.trendCache.updateMany({
            where: { keyword },
            data:  { platformScore: score },
          });
          count++;
        }
      }
      return NextResponse.json({ ok: true, platformUpdated: count });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // フル更新: Google Trends + ユーザー行動
  try {
    const result = await refreshTrendsCache();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("[cron/trends]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
