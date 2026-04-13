"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { IdeaWithEngagement, IdeaScore, ReactionType } from "@/lib/types";
import { REACTION_TYPES } from "@/lib/types";
import { MiniRadarChart } from "./mini-radar-chart";
import { AddToCollection } from "@/components/engagement/add-to-collection";
import { api } from "@/lib/api-client";

interface IdeaSummaryCardProps {
  idea: IdeaWithEngagement;
}

const avgScore = (scores: IdeaScore) => {
  const vals = Object.values(scores);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
};

const scoreColor = (n: number) =>
  n >= 4
    ? "text-emerald-600 dark:text-emerald-400"
    : n >= 3
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

export function IdeaSummaryCard({ idea }: IdeaSummaryCardProps) {
  const avg = avgScore(idea.scores);

  const [counts, setCounts] = useState<Record<string, number>>(idea.reactionCounts || {});
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(
    new Set((idea.userReactions || []) as ReactionType[])
  );
  const [reactionLoading, setReactionLoading] = useState<string | null>(null);

  const handleReaction = async (e: React.MouseEvent, type: ReactionType) => {
    e.preventDefault();
    e.stopPropagation();
    if (reactionLoading) return;
    setReactionLoading(type);

    const wasActive = userReactions.has(type);
    const next = new Set(userReactions);
    if (wasActive) next.delete(type);
    else next.add(type);
    setUserReactions(next);
    setCounts((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + (wasActive ? -1 : 1),
    }));

    try {
      await api.reactions.toggle(idea.id, type);
    } catch {
      setUserReactions(userReactions);
      setCounts(idea.reactionCounts || {});
    }
    setReactionLoading(null);
  };

  return (
    <Link href={`/ideas/${idea.slug}`} className="block h-full">
      <Card className="group h-full cursor-pointer gap-0 overflow-hidden py-0 transition-all hover:shadow-lg hover:-translate-y-0.5">
        <div className="h-1 bg-primary" />

        <CardContent className="flex h-full flex-col gap-3 p-4">
          {/* Top: Name + Bookmark */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-base font-bold leading-tight">{idea.serviceName}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">
                {idea.oneLiner}
              </p>
            </div>
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <AddToCollection ideaId={idea.id} compact />
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {idea.category}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {idea.targetIndustry}
            </Badge>
          </div>

          {/* Mini radar chart */}
          <MiniRadarChart scores={idea.scores} />

          {/* Reactions */}
          <div className="flex flex-wrap gap-1.5">
            {REACTION_TYPES.map(({ key, label, emoji }) => {
              const active = userReactions.has(key);
              const count = counts[key] || 0;
              return (
                <button
                  key={key}
                  onClick={(e) => handleReaction(e, key)}
                  disabled={reactionLoading === key}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-all",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                  {count > 0 && (
                    <span className={cn("rounded-full px-1 text-[10px] font-bold", active ? "bg-primary/20" : "bg-muted")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer: tags + score */}
          <div className="mt-auto flex items-center justify-between border-t pt-3">
            <div className="flex flex-wrap gap-1">
              {idea.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] text-muted-foreground">
                  #{tag}
                </span>
              ))}
              {idea.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{idea.tags.length - 2}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">総合</span>
              <span className={cn("text-lg font-black", scoreColor(avg))}>{avg}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
