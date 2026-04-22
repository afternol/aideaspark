"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Loader2, X, Download, ChevronDown, ChevronRight, AlertTriangle, Lightbulb, ExternalLink } from "lucide-react";
import { getSessionId } from "@/lib/session";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SourceList, FactCheckNotes } from "./source-list";

interface BizPlanData {
  id: string;
  serviceName: string;
  leanCanvas: {
    problem: string;
    solution: string;
    uniqueValue: string;
    customerSegments: string;
    channels: string;
    revenueStreams: string;
    costStructure: string;
    keyMetrics: string;
    unfairAdvantage: string;
  };
  executiveSummary: string;
  marketAnalysis: {
    overview: string;
    tam: string;
    sam: string;
    som: string;
    trends: string;
  };
  competitorAnalysis: {
    overview: string;
    competitors: { name: string; strength: string; weakness: string }[];
    positioning: string;
  };
  businessModel: {
    revenueModel: string;
    pricing: string;
    unitEconomics: string;
  };
  roadmap: { phase: string; goals: string; actions: string; kpi: string }[];
  risks: { risk: string; impact: string; mitigation: string }[];
}

interface BizPlanPanelProps {
  ideaId?: string;
  customIdeaId?: string;
  ideaName: string;
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b last:border-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-5 py-3 text-left font-bold transition-colors hover:bg-muted/30">
        {open ? <ChevronDown className="size-4 text-primary" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        {title}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

export function BizPlanPanel({ ideaId, customIdeaId, ideaName }: BizPlanPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<BizPlanData | null>(null);
  const [error, setError] = useState("");
  const [customNote, setCustomNote] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_PATH}/api/ai-bizplan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, customIdeaId, customNote: customNote.trim() || undefined, sessionId: getSessionId() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `生成に失敗しました (${res.status})`);
        return;
      }
      const data = await res.json();
      setPlan(data);
    } catch (e: any) {
      setError(`通信エラー: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!open && !plan) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.02] px-5 py-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-bold">AIビジネスプランを生成</span>
          <p className="mt-0.5 text-xs text-muted-foreground">リーンキャンバス・市場分析・ロードマップを自動作成</p>
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
    );
  }

  if (!plan) {
    return (
      <Card className="gap-0 border-primary/20 py-0">
        <div className="flex items-center justify-between border-b bg-primary/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <h3 className="font-bold">AIビジネスプラン生成</h3>
            <span className="text-sm text-muted-foreground">— {ideaName}</span>
          </div>
          <button onClick={() => setOpen(false)} className="rounded p-1 text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        <CardContent className="p-5">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              このアイデアの情報をもとに、AIがビジネスプランを自動生成します
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              <Lightbulb className="size-3.5 shrink-0 text-primary" />
              <span>生成したプランは<Link href="/my-ideas" className="font-medium text-primary hover:underline">マイアイデア</Link>に自動保存され、いつでも確認できます</span>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">カスタマイズ（任意）</label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder={"プラン生成時に考慮してほしい条件を自由に入力してください。\n\n例:\n・初期投資100万円以内で計画してほしい\n・BtoC向けの価格設定にしたい\n・3ヶ月でMVPを出す前提で\n・入力なしでもそのまま生成できます"}
                className="w-full resize-none rounded-lg border bg-background px-4 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/30 focus:ring-2 focus:ring-ring/20"
                rows={4}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              {loading ? "生成中..." : "AIビジネスプランを生成"}
            </Button>
            {loading && (
              <div className="mt-3 space-y-2 rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">AIがリサーチ・分析中...</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Loader2 className="size-3 animate-spin text-primary" />Step 1: Web検索で市場・競合・事例データを収集</div>
                  <div className="flex items-center gap-2"><span className="size-3" />Step 2: 収集データをもとにプラン生成</div>
                </div>
                <p className="text-[10px] text-muted-foreground">※ Web検索を実施するため、20〜40秒程度かかります</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden border-primary/20 py-0 print:border-0 print:shadow-none" id="bizplan">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-primary/5 px-5 py-3 print:bg-white">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <h3 className="font-bold">ビジネスプラン</h3>
          <span className="text-sm text-muted-foreground">— {ideaName}</span>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link href="/my-ideas">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Lightbulb className="size-3.5" />
              マイアイデア
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Download className="size-3.5" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPlan(null)} className="gap-1.5">
            再生成
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="border-b px-5 py-4">
        <h4 className="mb-2 text-sm font-bold text-primary">エグゼクティブサマリー</h4>
        <p className="text-sm leading-relaxed">{plan.executiveSummary}</p>
      </div>

      {/* Lean Canvas */}
      <Section title="リーンキャンバス" defaultOpen>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { label: "課題", value: plan.leanCanvas.problem },
            { label: "解決策", value: plan.leanCanvas.solution },
            { label: "独自の価値提案", value: plan.leanCanvas.uniqueValue },
            { label: "顧客セグメント", value: plan.leanCanvas.customerSegments },
            { label: "チャネル", value: plan.leanCanvas.channels },
            { label: "収益の流れ", value: plan.leanCanvas.revenueStreams },
            { label: "コスト構造", value: plan.leanCanvas.costStructure },
            { label: "主要指標", value: plan.leanCanvas.keyMetrics },
            { label: "圧倒的優位性", value: plan.leanCanvas.unfairAdvantage },
          ].map((cell) => (
            <div key={cell.label} className="rounded-lg border bg-muted/20 p-3">
              <p className="mb-1 text-xs font-bold text-primary">{cell.label}</p>
              <p className="text-xs leading-relaxed">{cell.value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Market Analysis */}
      <Section title="市場分析">
        <div className="space-y-3 text-sm">
          <p className="leading-relaxed">{plan.marketAnalysis.overview}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs font-bold text-primary">TAM（最大市場）</p>
              <p className="mt-1 text-xs">{plan.marketAnalysis.tam}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-bold text-primary">SAM（対象市場）</p>
              <p className="mt-1 text-xs">{plan.marketAnalysis.sam}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-bold text-primary">SOM（短期獲得見込）</p>
              <p className="mt-1 text-xs">{plan.marketAnalysis.som}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-primary">市場トレンド</p>
            <p className="mt-1 text-xs leading-relaxed">{plan.marketAnalysis.trends}</p>
          </div>
          <SourceList sources={(plan.marketAnalysis as any).sources} />
        </div>
      </Section>

      {/* Competitor Analysis */}
      <Section title="競合分析">
        <div className="space-y-3 text-sm">
          <p className="leading-relaxed">{plan.competitorAnalysis.overview}</p>
          {plan.competitorAnalysis.competitors?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left font-bold">競合</th>
                    <th className="px-3 py-2 text-left font-bold">強み</th>
                    <th className="px-3 py-2 text-left font-bold">弱み</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.competitorAnalysis.competitors.map((c: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-2 font-medium">
                        {c.url ? (
                          <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            {c.name}<ExternalLink className="size-2.5" />
                          </a>
                        ) : c.name}
                      </td>
                      <td className="px-3 py-2">{c.strength}</td>
                      <td className="px-3 py-2">{c.weakness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-primary">ポジショニング</p>
            <p className="mt-1 text-xs leading-relaxed">{plan.competitorAnalysis.positioning}</p>
          </div>
          <SourceList sources={(plan.competitorAnalysis as any).sources} />
        </div>
      </Section>

      {/* Business Model */}
      <Section title="ビジネスモデル">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-bold text-primary">収益モデル</p>
            <p className="mt-1 text-xs leading-relaxed">{plan.businessModel.revenueModel}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-primary">価格設定</p>
            <p className="mt-1 text-xs leading-relaxed">{plan.businessModel.pricing}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-primary">ユニットエコノミクス</p>
            <p className="mt-1 text-xs leading-relaxed">{plan.businessModel.unitEconomics}</p>
          </div>
          <SourceList sources={(plan.businessModel as any).sources} />
        </div>
      </Section>

      {/* Roadmap */}
      <Section title="実行ロードマップ">
        <div className="space-y-3">
          {plan.roadmap?.map((phase, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{phase.phase}</Badge>
              </div>
              <div className="space-y-1.5 text-xs">
                <div><span className="font-bold text-primary">目標:</span> {phase.goals}</div>
                <div><span className="font-bold text-primary">アクション:</span> {phase.actions}</div>
                <div><span className="font-bold text-primary">KPI:</span> {phase.kpi}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Risks */}
      <Section title="リスクと対策">
        <div className="space-y-2">
          {plan.risks?.map((r, i) => (
            <div key={i} className="flex gap-3 rounded-lg border p-3">
              <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", r.impact === "高" ? "text-red-500" : r.impact === "中" ? "text-yellow-500" : "text-blue-500")} />
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{r.risk}</span>
                  <Badge variant="outline" className={cn("text-[9px]", r.impact === "高" ? "text-red-500" : r.impact === "中" ? "text-yellow-500" : "text-blue-500")}>
                    影響度: {r.impact}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">対策: {r.mitigation}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Fact Check Notes */}
      {(plan as any).factCheckNotes && (
        <div className="px-5 pb-4">
          <FactCheckNotes notes={(plan as any).factCheckNotes} />
        </div>
      )}
    </Card>
  );
}
