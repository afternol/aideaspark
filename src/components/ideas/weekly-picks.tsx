"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IdeaWithEngagement, IdeaScore } from "@/lib/types";

interface WeeklyPicksProps {
  ideas: IdeaWithEngagement[];
}

const avgScore = (s: IdeaScore) =>
  Math.round((Object.values(s).reduce((a, b) => a + b, 0) / 6) * 10) / 10;

const scoreColor = (n: number) =>
  n >= 4 ? "text-emerald-600" : n >= 3 ? "text-yellow-600" : "text-red-600";

// Pick top 3 by combined score: avg + growth + novelty
function pickWeekly(ideas: IdeaWithEngagement[]): IdeaWithEngagement[] {
  const scored = ideas.map((idea) => {
    const s = idea.scores;
    const composite = avgScore(s) * 2 + s.growth + s.novelty + s.marketSize;
    return { idea, composite };
  });
  scored.sort((a, b) => b.composite - a.composite);
  return scored.slice(0, 3).map((s) => s.idea);
}

const accentColors = [
  "from-emerald-500/20 to-transparent border-emerald-500/30",
  "from-blue-500/20 to-transparent border-blue-500/30",
  "from-purple-500/20 to-transparent border-purple-500/30",
];

export function WeeklyPicks({ ideas }: WeeklyPicksProps) {
  const picks = pickWeekly(ideas);

  if (picks.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-lg font-bold">今週のピックアップ</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {picks.map((idea, idx) => (
          <Link key={idea.id} href={`/ideas/${idea.slug}`}>
            <div
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 transition-all hover:shadow-md hover:-translate-y-0.5",
                accentColors[idx]
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">
                  {idea.category}
                </Badge>
                <span className={cn("text-lg font-black", scoreColor(avgScore(idea.scores)))}>
                  {avgScore(idea.scores)}
                </span>
              </div>
              <h3 className="font-bold leading-tight">{idea.serviceName}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {idea.oneLiner}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
