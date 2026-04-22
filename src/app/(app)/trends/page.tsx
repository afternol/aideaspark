"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  Loader2,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

interface TrendResult {
  id: string;
  keyword: string;
  label: string;
  group: string;
  score: number;
  momentum: "rising" | "stable" | "declining";
  gtInterest: number;
  gtMomentum: number;
  rank: number;
  slug?: string;
}

const momentumConfig = {
  rising: { label: "上昇", icon: ArrowUpRight, class: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  stable: { label: "安定", icon: ArrowRight, class: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10" },
  declining: { label: "下降", icon: ArrowDownRight, class: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
};

function scoreToColor(score: number, opacity = 1): string {
  if (score >= 80) return `rgba(16, 185, 129, ${opacity})`;
  if (score >= 65) return `rgba(59, 130, 246, ${opacity})`;
  if (score >= 50) return `rgba(234, 179, 8, ${opacity})`;
  if (score >= 35) return `rgba(249, 115, 22, ${opacity})`;
  return `rgba(156, 163, 175, ${opacity})`;
}

function scoreToBgClass(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 65) return "bg-blue-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 35) return "bg-orange-500";
  return "bg-gray-400";
}

function scoreToTextClass(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 65) return "text-blue-600 dark:text-blue-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 35) return "text-orange-600 dark:text-orange-400";
  return "text-muted-foreground";
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    fetch(`${BASE_PATH}/api/trends`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTrends(data);
        else console.error("[trends] unexpected response:", data);
      })
      .catch((e) => console.error("[trends] fetch error:", e))
      .finally(() => setLoading(false));
  }, []);

  const groups = Array.from(new Set(trends.map((t) => t.group)));
  const rising = trends.filter((t) => t.momentum === "rising").slice(0, 8);
  const filtered = groupFilter === "all" ? trends : trends.filter((t) => t.group === groupFilter);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="トレンドレーダー" description="全領域のトレンドスコアを分析中..." />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="トレンドレーダー"
        description={`${trends.length}領域のビジネストレンドをスコアリング ― AI調査・ユーザー行動・Google Trendsの3軸を独自アルゴリズムでブレンド。AIスコアは週次、行動データは日次で自動更新。`}
      />

      {/* ===== Section 1: Rising Trends Spotlight ===== */}
      {rising.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Flame className="size-6 text-emerald-500" />
            <h2 className="text-lg font-bold">注目の上昇トレンド</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {rising.map((t) => {
              const card = (
                <div
                  className="flex shrink-0 items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 transition-colors hover:bg-emerald-500/10"
                  style={{ minWidth: 220 }}
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-base font-black text-emerald-600">
                    {t.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-base font-bold">{t.label}</div>
                    <div className="flex items-center gap-1 text-sm text-emerald-600">
                      <ArrowUpRight className="size-4" />
                      スコア {t.score}
                    </div>
                  </div>
                </div>
              );
              return t.slug
                ? <Link key={t.id} href={`/trends/${t.slug}`}>{card}</Link>
                : <div key={t.id}>{card}</div>;
            })}
          </div>
        </div>
      )}

      {/* ===== Section 2: Heatmap ===== */}
      <div>
        <h2 className="mb-4 text-lg font-bold">ヒートマップ</h2>
        <Card className="!overflow-visible">
          <CardContent className="p-5">
            {groups.map((group) => {
              const groupTrends = trends.filter((t) => t.group === group);
              const avgScore = Math.round(groupTrends.reduce((s, t) => s + t.score, 0) / groupTrends.length);
              return (
                <div key={group} className="mb-4 last:mb-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{group}</span>
                    <span className={cn("text-xs font-bold", scoreToTextClass(avgScore))}>
                      平均 {avgScore}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupTrends
                      .sort((a, b) => b.score - a.score)
                      .map((t) => {
                        const mcfg = momentumConfig[t.momentum];
                        const MIcon = mcfg.icon;
                        const tile = (
                          <div
                            className="group/tile relative z-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-white transition-transform hover:z-50 hover:scale-105 hover:shadow-md"
                            style={{ backgroundColor: scoreToColor(t.score, 0.85) }}
                          >
                            <span className="text-sm font-semibold">{t.label}</span>
                            <span className="text-xs font-bold opacity-90">{t.score}</span>
                            <MIcon className="size-3.5 opacity-75" />
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 rounded-lg border bg-popover px-4 py-3 text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover/tile:opacity-100" style={{ minWidth: 160 }}>
                              <div className="text-sm font-bold">{t.label}</div>
                              <div className="mt-1.5 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">スコア</span>
                                <span className={cn("font-bold", scoreToTextClass(t.score))}>{t.score}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">ランキング</span>
                                <span className="font-bold">#{t.rank}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">トレンド</span>
                                <span className={cn("font-medium", mcfg.class)}>{mcfg.label}</span>
                              </div>
                            </div>
                          </div>
                        );
                        return t.slug
                          ? <Link key={t.id} href={`/trends/${t.slug}`}>{tile}</Link>
                          : <div key={t.id}>{tile}</div>;
                      })}
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="mt-5 flex items-center gap-5 border-t pt-4 text-xs text-muted-foreground">
              <span className="font-medium">スコア:</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-emerald-500" /> 80+</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-blue-500" /> 65-79</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-yellow-500" /> 50-64</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-orange-500" /> 35-49</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-gray-400" /> &lt;35</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Section 3: Full Card Grid ===== */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">全領域スコア</h2>
          <span className="text-sm text-muted-foreground">{filtered.length}件</span>
        </div>

        {/* Group filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setGroupFilter("all")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              groupFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            すべて
          </button>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                groupFilter === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((trend) => {
            const cfg = momentumConfig[trend.momentum];
            const MomentumIcon = cfg.icon;
            const inner = (
              <div
                key={trend.id}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer"
              >
                {/* Rank */}
                <span className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-black",
                  trend.rank <= 3 ? "bg-primary text-primary-foreground" :
                  trend.rank <= 10 ? "bg-primary/15 text-primary" :
                  "bg-muted text-muted-foreground"
                )}>
                  {trend.rank}
                </span>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{trend.label}</div>
                  <div className="text-xs text-muted-foreground">{trend.group}</div>
                </div>

                {/* Score + Momentum */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className={cn("flex items-center", cfg.class)}>
                    <MomentumIcon className="size-4" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-12 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", scoreToBgClass(trend.score))}
                        style={{ width: `${trend.score}%` }}
                      />
                    </div>
                    <span className={cn("w-7 text-right text-sm font-bold", scoreToTextClass(trend.score))}>
                      {trend.score}
                    </span>
                  </div>
                </div>
              </div>
            );
            return trend.slug
              ? <Link key={trend.id} href={`/trends/${trend.slug}`}>{inner}</Link>
              : <div key={trend.id}>{inner}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
