import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// パターンごとのエンゲージメント・評価集計
// 生成プロンプトへの注入や管理画面での分析に使用
export async function GET() {
  const ideas = await prisma.idea.findMany({
    select: {
      id: true,
      patterns: true,
      views: true,
      bookmarks: true,
      scores: true,
      declarations: { select: { id: true } },
      ratings: {
        select: { isNovel: true, isTimely: true, isExisting: true },
      },
    },
  });

  type PatternStats = {
    ideaCount: number;
    totalViews: number;
    totalBookmarks: number;
    totalDeclarations: number;
    novelRatings: number;
    timelyRatings: number;
    existingRatings: number;
    scoreSum: number;
  };

  const patternMap: Record<string, PatternStats> = {};

  for (const idea of ideas) {
    const pids: string[] = Array.isArray(idea.patterns) ? (idea.patterns as string[]) : [];
    if (pids.length === 0) continue;

    const scores = idea.scores as Record<string, number>;
    const scoreSum = Object.values(scores).reduce((a, b) => a + b, 0);

    for (const pid of pids) {
      if (!patternMap[pid]) {
        patternMap[pid] = {
          ideaCount: 0, totalViews: 0, totalBookmarks: 0,
          totalDeclarations: 0, novelRatings: 0, timelyRatings: 0,
          existingRatings: 0, scoreSum: 0,
        };
      }
      const p = patternMap[pid]!;
      p.ideaCount++;
      p.totalViews += idea.views;
      p.totalBookmarks += idea.bookmarks;
      p.totalDeclarations += idea.declarations.length;
      p.scoreSum += scoreSum / Object.values(scores).length;
      for (const r of idea.ratings) {
        if (r.isNovel)    p.novelRatings++;
        if (r.isTimely)   p.timelyRatings++;
        if (r.isExisting) p.existingRatings++;
      }
    }
  }

  const result = Object.entries(patternMap)
    .map(([patternId, s]) => ({
      patternId,
      ideaCount: s.ideaCount,
      avgViews: Math.round(s.totalViews / s.ideaCount),
      avgBookmarks: Math.round(s.totalBookmarks / s.ideaCount),
      totalDeclarations: s.totalDeclarations,
      avgScore: Math.round((s.scoreSum / s.ideaCount) * 10) / 10,
      novelRatings: s.novelRatings,
      timelyRatings: s.timelyRatings,
      existingRatings: s.existingRatings,
      // bookmarks×10 + declarations×50 で価値スコアを計算
      engagementScore: Math.round(
        (s.totalViews + s.totalBookmarks * 10 + s.totalDeclarations * 50) / s.ideaCount
      ),
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore);

  return NextResponse.json(result);
}
