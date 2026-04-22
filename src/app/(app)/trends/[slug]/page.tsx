"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, ArrowRight, ArrowDownRight,
  Loader2, Newspaper, Users, BarChart2, TrendingUp,
  Building2, Globe, Lightbulb, Clock, ExternalLink,
  BrainCircuit,
} from "lucide-react";
import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TrendReportData } from "@/lib/trend-slugs";

interface TrendDetail {
  keyword: string;
  slug: string;
  category: string;
  totalScore: number;
  aiScore: number;
  platformScore: number;
  gtInterest: number;
  gtMomentum: number;
  momentum: string;
  aiMomentum: string;
  aiUpdatedAt: string | null;
  report: TrendReportData | null;
}

const momentumConfig = {
  rising:   { label: "上昇中", icon: ArrowUpRight,   cls: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  stable:   { label: "横ばい", icon: ArrowRight,     cls: "text-yellow-600 dark:text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20"  },
  declining:{ label: "下降中", icon: ArrowDownRight, cls: "text-red-600 dark:text-red-400",         bg: "bg-red-500/10 border-red-500/20"         },
};

function scoreColor(n: number) {
  if (n >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (n >= 65) return "text-blue-600 dark:text-blue-400";
  if (n >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-muted-foreground";
}
function scoreBg(n: number) {
  if (n >= 80) return "bg-emerald-500";
  if (n >= 65) return "bg-blue-500";
  if (n >= 50) return "bg-yellow-500";
  if (n >= 35) return "bg-orange-500";
  return "bg-gray-400";
}

function ScoreBar({ label, value, weight, note }: { label: string; value: number; weight: string; note: string }) {
  const hasData = value > 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground/80">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{weight}</span>
          <span className={cn("w-6 text-right font-bold", hasData ? scoreColor(value) : "text-muted-foreground")}>
            {hasData ? value : "—"}
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        {hasData
          ? <div className={cn("h-full rounded-full transition-all", scoreBg(value))} style={{ width: `${value}%` }} />
          : <div className="h-full w-1/3 rounded-full bg-muted-foreground/20 animate-pulse" />
        }
      </div>
      {!hasData && <p className="text-[10px] text-muted-foreground">{note}</p>}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function TrendDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<TrendDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    fetch(`${BASE_PATH}/api/trends/${slug}`)
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, BASE_PATH]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/trends" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />トレンドレーダーに戻る
        </Link>
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            AIがウェブ検索でリサーチ中です。初回は30〜60秒かかります。
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">トレンドが見つかりません</p>
        <Link href="/trends" className="mt-4 inline-block">
          <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">トレンドレーダーに戻る</button>
        </Link>
      </div>
    );
  }

  const momentum = (data.momentum || "stable") as keyof typeof momentumConfig;
  const mcfg = momentumConfig[momentum] ?? momentumConfig.stable;
  const MIcon = mcfg.icon;
  const report = data.report;

  const aiBase = data.aiScore > 0 ? data.aiScore : null;
  const platform = data.platformScore > 0 ? data.platformScore : null;
  const gt = data.gtInterest > 0 ? data.gtInterest : null;

  return (
    <div className="space-y-8">
      {/* ── ヘッダー ─────────────────────────────────────── */}
      <div>
        <Link href="/trends" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />トレンドレーダーに戻る
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">{data.category}</Badge>
              <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", mcfg.bg, mcfg.cls)}>
                <MIcon className="size-3.5" />{mcfg.label}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{data.keyword}</h1>
          </div>
          <div className="flex items-end gap-1">
            <span className={cn("text-5xl font-black tabular-nums", scoreColor(data.totalScore))}>{data.totalScore}</span>
            <span className="mb-1 text-sm text-muted-foreground">/ 100</span>
          </div>
        </div>
      </div>

      {/* ── スコア内訳 ────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
            <BarChart2 className="size-4" />スコア内訳
          </h2>
          <div className="space-y-4">
            <ScoreBar
              label="AI市場調査"
              value={aiBase ?? 0}
              weight="40%"
              note="週次クロンで更新予定"
            />
            <ScoreBar
              label="ユーザー行動"
              value={platform ?? 0}
              weight="30%"
              note="閲覧・保存・宣言数が蓄積されると反映"
            />
            <ScoreBar
              label="Google Trends"
              value={gt ? Math.min(100, Math.round(gt * 1.5)) : 0}
              weight="30%"
              note="日次クロンで更新予定"
            />
          </div>
          {!aiBase && !gt && (
            <p className="mt-3 text-[11px] text-muted-foreground border-t pt-3">
              現在のスコアはAIの初期評価値です。クロン実行後にリアルデータが反映されます。
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── レポート本文 ──────────────────────────────────── */}
      {report ? (
        <div className="space-y-7">

          {/* サマリー */}
          <div className="rounded-xl border-l-4 border-primary bg-primary/[0.03] px-5 py-4">
            <p className="text-[0.95rem] leading-relaxed">{report.summary}</p>
          </div>

          {/* 今何が起きているか */}
          <Section icon={<Newspaper className="size-3.5" />} title="今何が起きているか">
            <ul className="space-y-2.5">
              {report.whatIsHappening.map((item, i) => (
                <li key={i} className="flex gap-3 rounded-lg border bg-card px-4 py-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>
                  <span className="text-[0.9rem] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* このトレンドの特徴 */}
          <Section icon={<Lightbulb className="size-3.5" />} title="このトレンドの特徴">
            <p className="rounded-lg bg-muted/50 px-4 py-3 text-[0.9rem] leading-relaxed">{report.characteristics}</p>
          </Section>

          {/* スコアの根拠 */}
          <Section icon={<BrainCircuit className="size-3.5" />} title={`スコア ${data.totalScore}点の根拠`}>
            <p className="rounded-lg bg-muted/50 px-4 py-3 text-[0.9rem] leading-relaxed">{report.scoreRationale}</p>
          </Section>

          {/* 注目プレイヤー */}
          {report.keyPlayers.length > 0 && (
            <Section icon={<Building2 className="size-3.5" />} title="注目プレイヤー">
              <div className="grid gap-2 sm:grid-cols-2">
                {report.keyPlayers.map((player, i) => {
                  const [name, ...rest] = player.split(":");
                  return (
                    <div key={i} className="rounded-lg border bg-card px-4 py-3">
                      <p className="text-sm font-bold">{name.trim()}</p>
                      {rest.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{rest.join(":").trim()}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* 市場規模 */}
          <Section icon={<TrendingUp className="size-3.5" />} title="市場規模">
            <p className="rounded-lg bg-muted/50 px-4 py-3 text-[0.9rem] leading-relaxed">{report.marketSize}</p>
          </Section>

          {/* 今後の見通し */}
          <Section icon={<Globe className="size-3.5" />} title="今後12ヶ月の見通し">
            <p className="rounded-lg bg-muted/50 px-4 py-3 text-[0.9rem] leading-relaxed">{report.outlook}</p>
          </Section>

          {/* フッター: 情報源・更新日時 */}
          <div className="border-t pt-4 space-y-2">
            {report.sources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {report.sources.slice(0, 5).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="size-3" />参照{i + 1}
                  </a>
                ))}
              </div>
            )}
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              AIリサーチ更新: {new Date(report.generatedAt).toLocaleDateString("ja-JP")}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
          <p className="text-sm">レポートを生成できませんでした。しばらくしてから再度アクセスしてください。</p>
        </div>
      )}
    </div>
  );
}
