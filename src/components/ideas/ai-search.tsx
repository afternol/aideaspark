"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Send, Loader2, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BusinessIdea, IdeaScore } from "@/lib/types";

const avgScore = (s: IdeaScore) =>
  Math.round((Object.values(s).reduce((a, b) => a + b, 0) / 6) * 10) / 10;

const scoreColor = (n: number) =>
  n >= 4 ? "text-emerald-600" : n >= 3 ? "text-yellow-600" : "text-red-600";

interface AISearchResult {
  results: BusinessIdea[];
  interpretation: string;
  reason: string;
}

export function AISearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AISearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ results: [], interpretation: "検索に失敗しました", reason: "" });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.02] px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        <Sparkles className="size-5 text-primary" />
        <span className="text-sm font-medium text-primary">AIでアイデアを探す</span>
        <span className="text-xs text-muted-foreground">— やりたいこと・解決したい課題を自由に入力</span>
      </button>
    );
  }

  return (
    <Card className="mb-6 gap-0 overflow-hidden border-primary/20 py-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-primary/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-bold text-primary">AI検索</span>
        </div>
        <button onClick={() => { setOpen(false); setResult(null); setQuery(""); }} className="rounded p-1 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>

      <CardContent className="p-4">
        {/* Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MessageSquare className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="例: 初期費用を抑えて始められるビジネス"
              className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <Button onClick={handleSearch} disabled={!query.trim() || loading} className="gap-1.5 px-5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            検索
          </Button>
        </div>

        {/* Suggestions */}
        {!result && !loading && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "一人で始められるスモールビジネス",
              "今伸びている市場で勝てるアイデア",
              "本業の空き時間でできる副業向けサービス",
              "社会課題の解決につながるビジネス",
              "テクノロジーに詳しくなくても始められる事業",
              "リピート収益が見込めるストック型ビジネス",
            ].map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            AIがアイデアを探しています...
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="mt-4 space-y-3">
            {/* AI interpretation */}
            {result.interpretation && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{result.interpretation}</p>
                    {result.reason && (
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{result.reason}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {result.results.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                条件に合うアイデアが見つかりませんでした。別の表現で試してみてください。
              </p>
            ) : (
              <div className="space-y-2">
                {result.results.map((idea, idx) => (
                  <Link key={idea.id} href={`/ideas/${idea.slug}`}>
                    <div className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{idea.serviceName}</span>
                          <Badge variant="secondary" className="text-[10px]">{idea.category}</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{idea.oneLiner}</p>
                      </div>
                      <span className={cn("text-base font-black", scoreColor(avgScore(idea.scores)))}>
                        {avgScore(idea.scores)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
