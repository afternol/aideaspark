"use client";

import { useState, useEffect, useMemo } from "react";
import { Columns3, Plus, X, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import type { IdeaWithEngagement, IdeaScore } from "@/lib/types";
import { SCORE_LABELS } from "@/lib/types";
import { MiniRadarChart } from "@/components/ideas/mini-radar-chart";

const MAX_COMPARE = 3;

const avgScore = (s: IdeaScore) =>
  Math.round((Object.values(s).reduce((a, b) => a + b, 0) / 6) * 10) / 10;

const scoreColor = (n: number) =>
  n >= 4 ? "text-emerald-600" : n >= 3 ? "text-yellow-600" : "text-red-600";

export default function ComparePage() {
  const [ideas, setIdeas] = useState<IdeaWithEngagement[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    api.ideas.list().then((d) => { setIdeas(d); setLoading(false); });
  }, []);

  const addIdea = (id: string) => {
    if (!selected.includes(id) && selected.length < MAX_COMPARE) {
      setSelected([...selected, id]);
    }
  };

  const removeIdea = (id: string) => {
    setSelected(selected.filter((s) => s !== id));
  };

  const selectedIdeas = selected.map((id) => ideas.find((i) => i.id === id)).filter(Boolean) as IdeaWithEngagement[];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return ideas.filter((i) => !selected.includes(i.id)).slice(0, 12);
    const q = searchQuery.toLowerCase();
    return ideas
      .filter((i) => !selected.includes(i.id))
      .filter(
        (i) =>
          i.serviceName.toLowerCase().includes(q) ||
          i.oneLiner.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.targetIndustry.toLowerCase().includes(q) ||
          i.targetCustomer.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [ideas, selected, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Columns3 className="size-5 text-primary" />
          アイデア比較
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          最大{MAX_COMPARE}件のアイデアを横並びで比較できます
        </p>
      </div>

      {/* Selector */}
      {selected.length < MAX_COMPARE && (
        <div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setPickerOpen(!pickerOpen)}
          >
            <Plus className="size-4" />
            アイデアを追加 ({selected.length}/{MAX_COMPARE})
          </Button>

          {pickerOpen && (
            <div className="mt-3 rounded-lg border bg-card p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="サービス名、カテゴリ、業界、タグで検索..."
                  className="pl-9"
                />
              </div>
              {searchResults.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">該当するアイデアがありません</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => { addIdea(idea.id); if (selected.length + 1 >= MAX_COMPARE) setPickerOpen(false); }}
                      className="flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="text-sm font-bold">{idea.serviceName}</span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">{idea.oneLiner}</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[10px]">{idea.category}</Badge>
                        <Badge variant="outline" className="text-[10px]">{idea.targetIndustry}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!searchQuery && (
                <p className="mt-2 text-xs text-muted-foreground">
                  キーワードを入力して絞り込めます。初期表示は最新12件です。
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {selectedIdeas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Columns3 className="mx-auto mb-4 size-12 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">
              比較するアイデアを選んでください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <div className={cn("grid gap-4", selectedIdeas.length === 1 ? "grid-cols-1 max-w-md" : selectedIdeas.length === 2 ? "grid-cols-2" : "grid-cols-3")} style={{ minWidth: selectedIdeas.length > 1 ? "640px" : undefined }}>
            {selectedIdeas.map((idea) => (
              <Card key={idea.id} className="gap-0 overflow-hidden py-0">
                {/* Header */}
                <div className="flex items-start justify-between border-b px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{idea.serviceName}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{idea.oneLiner}</p>
                  </div>
                  <button onClick={() => removeIdea(idea.id)} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>

                <CardContent className="space-y-4 p-4">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[10px]">{idea.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{idea.targetIndustry}</Badge>
                    <Badge variant="outline" className="text-[10px]">{idea.targetCustomer}</Badge>
                  </div>

                  {/* Radar chart */}
                  <MiniRadarChart scores={idea.scores} />

                  {/* Score details */}
                  <div className="space-y-1.5">
                    {(Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{SCORE_LABELS[key]}</span>
                        <span className={cn("text-sm font-bold", scoreColor(idea.scores[key]))}>
                          {idea.scores[key]}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t pt-1.5">
                      <span className="text-xs font-medium">総合スコア</span>
                      <span className={cn("text-base font-black", scoreColor(avgScore(idea.scores)))}>
                        {avgScore(idea.scores)}
                      </span>
                    </div>
                  </div>

                  {/* Key info */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-muted-foreground">ターゲット</span>
                      <p className="mt-0.5">{idea.target}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">収益モデル</span>
                      <p className="mt-0.5">{idea.revenueModel.split("\n")[0]}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">競合優位性</span>
                      <p className="mt-0.5 line-clamp-2">{idea.competitiveEdge}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
