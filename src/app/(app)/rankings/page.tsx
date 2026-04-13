"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  Trophy,
  TrendingUp,
  Rocket,
  Sparkles,
  Loader2,
  Crown,
  Medal,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import type { IdeaWithEngagement, IdeaScore } from "@/lib/types";
import { SCORE_LABELS } from "@/lib/types";
import { CATEGORIES, TARGET_INDUSTRIES, TARGET_CUSTOMERS } from "@/lib/constants";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const avg = (s: IdeaScore) =>
  Math.round((Object.values(s).reduce((a, b) => a + b, 0) / 6) * 10) / 10;

const growthScore = (s: IdeaScore) =>
  Math.round(((s.marketSize + s.growth) / 2) * 10) / 10;

const feasibilityScore = (s: IdeaScore) =>
  Math.round(((s.feasibility + s.profitability) / 2) * 10) / 10;

const noveltyScore = (s: IdeaScore) =>
  Math.round(((s.novelty + s.moat) / 2) * 10) / 10;

type RankingType = "score" | "growth" | "feasibility" | "novelty";

const tabs: { value: RankingType; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "score", label: "総合", icon: BarChart3, desc: "6軸の平均" },
  { value: "growth", label: "成長性", icon: TrendingUp, desc: "市場規模 × 成長性" },
  { value: "feasibility", label: "始めやすさ", icon: Rocket, desc: "実現可能性 × 収益性" },
  { value: "novelty", label: "独自性", icon: Sparkles, desc: "新規性 × 参入障壁" },
];

function getScore(idea: IdeaWithEngagement, type: RankingType): number {
  switch (type) {
    case "growth": return growthScore(idea.scores);
    case "feasibility": return feasibilityScore(idea.scores);
    case "novelty": return noveltyScore(idea.scores);
    default: return avg(idea.scores);
  }
}

const scoreColor = (n: number) =>
  n >= 4 ? "text-emerald-600 dark:text-emerald-400" : n >= 3 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";

const scoreBg = (n: number) =>
  n >= 4 ? "bg-emerald-500" : n >= 3 ? "bg-yellow-500" : "bg-red-500";

const podiumColors = [
  "from-amber-400/20 via-amber-400/5 to-transparent border-amber-400/30",
  "from-gray-300/20 via-gray-300/5 to-transparent border-gray-300/30",
  "from-amber-700/20 via-amber-700/5 to-transparent border-amber-700/30",
];

const crownColors = ["text-amber-500", "text-gray-400", "text-amber-700"];

function expandSelections(selected: string[], allOptions: { value: string; group?: string }[]): Set<string> | null {
  if (selected.length === 0) return null;
  const expanded = new Set<string>();
  for (const v of selected) {
    if (v.startsWith("group:")) {
      const groupName = v.slice(6);
      allOptions.filter((o) => o.group === groupName).forEach((o) => expanded.add(o.value));
    } else {
      expanded.add(v);
    }
  }
  return expanded;
}

export default function RankingsPage() {
  const [ideas, setIdeas] = useState<IdeaWithEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RankingType>("score");
  const [categories, setCategories] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);

  useEffect(() => {
    api.ideas.list().then((d) => { setIdeas(d); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let result = [...ideas];
    const catSet = expandSelections(categories, CATEGORIES);
    if (catSet) result = result.filter((i) => catSet.has(i.category));
    const indSet = expandSelections(industries, TARGET_INDUSTRIES);
    if (indSet) result = result.filter((i) => indSet.has(i.targetIndustry));
    const custSet = expandSelections(customers, TARGET_CUSTOMERS);
    if (custSet) result = result.filter((i) => custSet.has(i.targetCustomer));
    return result;
  }, [ideas, categories, industries, customers]);

  const hasFilters = categories.length > 0 || industries.length > 0 || customers.length > 0;

  const sorted = [...filtered].sort((a, b) => getScore(b, activeTab) - getScore(a, activeTab));
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="ランキング" description="" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ランキング"
        description="スコア別にビジネスアイデアをランキング"
      />

      {/* Tab selector */}
      <div className="flex gap-1 rounded-xl border bg-muted/50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2.5 transition-all",
                activeTab === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", activeTab === tab.value && "text-primary")} />
              <span className="text-sm font-medium">{tab.label}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">{tab.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="size-4" />
          絞り込み
          {hasFilters && (
            <Badge variant="secondary" className="text-[10px]">
              {filtered.length} / {ideas.length}件
            </Badge>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">領域</label>
            <SearchableSelect
              options={CATEGORIES}
              value={categories}
              onChange={setCategories}
              placeholder="領域で絞り込み"
              allLabel="すべての領域"
              grouped
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">対象業界</label>
            <SearchableSelect
              options={TARGET_INDUSTRIES}
              value={industries}
              onChange={setIndustries}
              placeholder="業界で絞り込み"
              allLabel="すべての業界"
              grouped
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">対象顧客</label>
            <SearchableSelect
              options={TARGET_CUSTOMERS}
              value={customers}
              onChange={setCustomers}
              placeholder="顧客で絞り込み"
              allLabel="すべての顧客"
              grouped
            />
          </div>
        </div>
      </div>

      {/* ===== Podium: Top 3 ===== */}
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed p-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">条件に合うアイデアがありません</p>
        </div>
      ) : top3.length >= 3 ? (
        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3">
          <PodiumCard idea={top3[1]} rank={2} type={activeTab} />
          <PodiumCard idea={top3[0]} rank={1} type={activeTab} featured />
          <PodiumCard idea={top3[2]} rank={3} type={activeTab} />
        </div>
      ) : null}

      {/* ===== Rest of ranking: 3-column cards ===== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((idea, idx) => {
          const rank = idx + 4;
          const val = getScore(idea, activeTab);

          return (
            <Link key={idea.id} href={`/ideas/${idea.slug}`}>
              <Card className="gap-0 overflow-hidden py-0 transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={cn(
                      "flex size-9 items-center justify-center rounded-full text-sm font-black",
                      rank <= 5 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {rank}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-2xl font-black", scoreColor(val))}>{val}</span>
                      <span className="text-xs text-muted-foreground">/ 5.0</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold">{idea.serviceName}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{idea.oneLiner}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">{idea.category}</Badge>
                    <Badge variant="outline" className="text-xs">{idea.targetCustomer}</Badge>
                  </div>
                  {/* Score bars */}
                  <div className="mt-3 space-y-1.5">
                    {(Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-14 shrink-0 text-xs text-muted-foreground">{SCORE_LABELS[key]}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className={cn("h-full rounded-full", scoreBg(idea.scores[key]))} style={{ width: `${(idea.scores[key] / 5) * 100}%` }} />
                        </div>
                        <span className={cn("w-4 text-right text-xs font-bold", scoreColor(idea.scores[key]))}>{idea.scores[key]}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ===== Large Radar Chart for Podium =====

function LargeRadarChart({ scores, height }: { scores: IdeaScore; height: number }) {
  const data = (Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key) => ({
    axis: SCORE_LABELS[key],
    value: scores[key],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="55%">
        <PolarGrid stroke="var(--color-border)" strokeWidth={0.5} />
        <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
        <PolarAngleAxis
          dataKey="axis"
          tick={(props) => {
            const { x, y, payload, index } = props as { x: number; y: number; payload: { value: string }; index: number };
            const score = data[index]?.value ?? 0;
            return (
              <g transform={`translate(${x},${y})`}>
                <text textAnchor="middle" dy={-4} fontSize={12} fontWeight={500} fill="var(--color-muted-foreground)">
                  {payload.value}
                </text>
                <text textAnchor="middle" dy={12} fontSize={15} fontWeight={800} fill="var(--color-primary)">
                  {score}
                </text>
              </g>
            );
          }}
        />
        <Radar dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.15} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ===== Podium Card Component =====

function PodiumCard({
  idea,
  rank,
  type,
  featured,
}: {
  idea: IdeaWithEngagement;
  rank: 1 | 2 | 3;
  type: RankingType;
  featured?: boolean;
}) {
  const val = getScore(idea, type);
  const idx = rank - 1;

  return (
    <Link href={`/ideas/${idea.slug}`}>
      <Card className={cn(
        "h-full gap-0 overflow-hidden border-2 py-0 transition-all hover:shadow-lg hover:-translate-y-1",
        "bg-gradient-to-b " + podiumColors[idx],
      )}>
        <CardContent className="flex h-full flex-col items-center p-5 text-center">
          {/* Crown / Medal */}
          <div className={crownColors[idx]}>
            {rank === 1 ? (
              <Crown className="size-10" fill="currentColor" strokeWidth={1} />
            ) : (
              <Medal className="size-10" fill="currentColor" strokeWidth={1} />
            )}
          </div>

          {/* Rank number */}
          <span className={cn(
            "mt-1 mb-3 flex size-9 items-center justify-center rounded-full text-sm font-black text-white",
            rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-gray-400" : "bg-amber-700"
          )}>
            {rank}
          </span>

          {/* Name */}
          <h3 className="text-lg font-bold leading-tight">{idea.serviceName}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{idea.oneLiner}</p>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">{idea.category}</Badge>
            <Badge variant="outline" className="text-[10px]">{idea.targetCustomer}</Badge>
          </div>

          {/* Radar chart — large */}
          <div className="mx-auto mt-3 w-full max-w-[240px]">
            <LargeRadarChart scores={idea.scores} height={240} />
          </div>

          {/* Score */}
          <div className="mt-2 flex items-baseline gap-1">
            <span className={cn("text-3xl font-black", scoreColor(val))}>{val}</span>
            <span className="text-xs text-muted-foreground">/ 5.0</span>
          </div>

          {/* Score breakdown */}
          <div className="mt-3 grid w-full grid-cols-3 gap-2">
            {(Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key) => (
              <div key={key} className="flex flex-col items-center rounded-md bg-muted/50 px-2 py-1.5">
                <span className="text-xs text-muted-foreground">{SCORE_LABELS[key]}</span>
                <span className={cn("text-base font-black", scoreColor(idea.scores[key]))}>{idea.scores[key]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
