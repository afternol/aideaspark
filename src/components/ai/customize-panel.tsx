"use client";

import { useState } from "react";
import { Wand2, Loader2, ArrowRight, X, ChevronDown, Lightbulb, Layers } from "lucide-react";
import Link from "next/link";
import { getSessionId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { IdeaScore } from "@/lib/types";
import { SCORE_LABELS } from "@/lib/types";

interface CustomizeResult {
  id: string;
  serviceName: string;
  oneLiner: string;
  concept: string;
  target: string;
  problem: string;
  product: string;
  revenueModel: string;
  competitors: string;
  competitiveEdge: string;
  scores: IdeaScore;
  changes: string[];
  baseIdea: { serviceName: string; slug: string };
}

interface CustomizePanelProps {
  ideaId: string;
  ideaName: string;
  onResult: (result: CustomizeResult) => void;
}

const scoreColor = (n: number) =>
  n >= 4 ? "text-emerald-600" : n >= 3 ? "text-yellow-600" : "text-red-600";

export function CustomizePanel({ ideaId, ideaName, onResult }: CustomizePanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customizeText, setCustomizeText] = useState("");
  const [results, setResults] = useState<CustomizeResult[]>([]);
  const [error, setError] = useState("");
  // When editing=true, show the input form (for initial or further customization)
  const [editing, setEditing] = useState(true);

  const latestResult = results.length > 0 ? results[results.length - 1] : null;

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const body: any = {
        conditions: { notes: customizeText },
        sessionId: getSessionId(),
      };
      // If we have a previous result, use it as the base
      if (latestResult) {
        body.customIdeaId = latestResult.id;
      } else {
        body.ideaId = ideaId;
      }

      const res = await fetch("/api/ai-customize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || `生成に失敗しました (${res.status})`);
        return;
      }
      const data = await res.json();
      setResults((prev) => [...prev, data]);
      setCustomizeText("");
      setEditing(false);
      onResult(data);
    } catch (e: any) {
      setError(`通信エラー: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFurtherCustomize = () => {
    setEditing(true);
  };

  const handleReset = () => {
    setResults([]);
    setCustomizeText("");
    setEditing(true);
  };

  if (!open && results.length === 0) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.02] px-5 py-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Wand2 className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-bold">このアイデアをAIでカスタマイズ</span>
          <p className="mt-0.5 text-xs text-muted-foreground">あなたの条件に合わせてアイデアを最適化します</p>
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <Card className="gap-0 border-primary/20 py-0">
      <div className="flex items-center justify-between border-b bg-primary/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Wand2 className="size-5 text-primary" />
          <h3 className="font-bold">AIカスタマイズ</h3>
          <span className="text-sm text-muted-foreground">— {latestResult?.serviceName || ideaName}</span>
          {results.length > 1 && (
            <Badge variant="secondary" className="text-[10px]">{results.length}回目</Badge>
          )}
        </div>
        <button onClick={() => { setOpen(false); setEditing(true); }} className="rounded p-1 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>

      <CardContent className="p-5">
        {/* Latest result display */}
        {latestResult && !editing && (
          <div className="space-y-4">
            {/* Changes summary */}
            <div className="rounded-lg bg-primary/5 p-4">
              <p className="mb-2 text-sm font-bold text-primary">主な変更点</p>
              <ul className="space-y-1">
                {latestResult.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Customized idea */}
            <div>
              <h4 className="text-lg font-bold">{latestResult.serviceName}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{latestResult.oneLiner}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div><span className="font-medium text-primary">コンセプト:</span> {latestResult.concept}</div>
              <div><span className="font-medium text-primary">ターゲット:</span> {latestResult.target}</div>
              <div><span className="font-medium text-primary">収益モデル:</span> {latestResult.revenueModel}</div>
              <div><span className="font-medium text-primary">競合優位性:</span> {latestResult.competitiveEdge}</div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key) => (
                <div key={key} className="flex flex-col items-center rounded-md bg-muted/50 px-2 py-1.5 text-center">
                  <span className="text-[10px] text-muted-foreground">{SCORE_LABELS[key]}</span>
                  <span className={cn("text-base font-black", scoreColor(latestResult.scores[key]))}>{latestResult.scores[key]}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={handleFurtherCustomize} className="gap-1.5">
                <Layers className="size-3.5" />
                さらにカスタマイズ
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                最初からやり直す
              </Button>
              <Link href="/my-ideas">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Lightbulb className="size-3.5" />
                  マイアイデアで確認
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Input form (initial or further customization) */}
        {editing && (
          <div className="space-y-4">
            {latestResult && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <Layers className="size-3.5 shrink-0 text-primary" />
                <span>
                  <span className="font-medium text-primary">{latestResult.serviceName}</span>
                  をベースにさらにカスタマイズします
                </span>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {latestResult ? "追加のカスタマイズ内容" : "カスタマイズ内容"}
              </label>
              <textarea
                value={customizeText}
                onChange={(e) => setCustomizeText(e.target.value)}
                placeholder={latestResult
                  ? "前回の結果に対して、さらに変えたい点を入力してください。\n\n例:\n・ターゲットをもっと絞りたい\n・価格帯を下げたい\n・BtoBに変えたい"
                  : "どんな条件に合わせたいか自由に入力してください。\n\n例:\n・予算50万円以内、1人で副業として始めたい\n・BtoC向けのサブスクモデルに変えたい\n・ヘルスケア領域×シニア層にターゲットを変更\n・エンジニアリングは得意だがマーケは未経験\n・飲食業界の中小企業向けに特化したい\n・半年以内にMVPリリースしたい"
                }
                className="w-full resize-none rounded-lg border bg-background px-4 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/30 focus:ring-2 focus:ring-ring/20"
                rows={latestResult ? 4 : 6}
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              <Lightbulb className="size-3.5 shrink-0 text-primary" />
              <span>カスタマイズ結果は<Link href="/my-ideas" className="font-medium text-primary hover:underline">マイアイデア</Link>に自動保存され、いつでも確認できます</span>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-2">
              <Button onClick={handleGenerate} disabled={loading || !customizeText.trim()} className="gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                {loading
                  ? "カスタマイズ中..."
                  : latestResult
                    ? "さらにカスタマイズ"
                    : "AIでカスタマイズ"
                }
              </Button>
              {latestResult && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  キャンセル
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
