"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft, ArrowUpRight, ArrowRight, ArrowDownRight,
  Loader2, Newspaper, Building2, TrendingUp, Globe,
  Lightbulb, Clock, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TrendReportData } from "@/lib/trend-slugs";

interface TrendDetail {
  keyword: string;
  slug: string;
  category: string;
  totalScore: number;
  momentum: string;
  report: TrendReportData | null;
}

const momentumConfig = {
  rising:    { label: "上昇中", icon: ArrowUpRight,   cls: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/8" },
  stable:    { label: "横ばい", icon: ArrowRight,     cls: "text-yellow-600 dark:text-yellow-400",  border: "border-yellow-500/30",  bg: "bg-yellow-500/8"  },
  declining: { label: "下降中", icon: ArrowDownRight, cls: "text-red-500 dark:text-red-400",         border: "border-red-500/30",     bg: "bg-red-500/8"     },
};

function scoreColor(n: number) {
  if (n >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (n >= 65) return "text-blue-500 dark:text-blue-400";
  if (n >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-muted-foreground";
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 pb-1">
      <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="text-base font-bold">{children}</h2>
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
          <p className="text-sm text-muted-foreground">AIがウェブ検索でリサーチ中です。初回は30〜60秒かかります。</p>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">トレンドが見つかりません</p>
        <Link href="/trends" className="mt-4 inline-block rounded-md border px-4 py-2 text-sm hover:bg-muted">
          トレンドレーダーに戻る
        </Link>
      </div>
    );
  }

  const momentum = (data.momentum || "stable") as keyof typeof momentumConfig;
  const mcfg = momentumConfig[momentum] ?? momentumConfig.stable;
  const MIcon = mcfg.icon;
  const report = data.report;

  return (
    <div className="space-y-10">

      {/* ── ヘッダー ────────────────────────────────────────── */}
      <div>
        <Link href="/trends" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />トレンドレーダーに戻る
        </Link>

        <div className={cn("rounded-2xl border p-6", mcfg.border, mcfg.bg)}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">{data.category}</Badge>
                <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", mcfg.cls)}>
                  <MIcon className="size-3.5" />{mcfg.label}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight">{data.keyword}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">トレンドスコア</p>
              <span className={cn("text-6xl font-black tabular-nums leading-none", scoreColor(data.totalScore))}>
                {data.totalScore}
              </span>
              <span className="ml-1 text-sm text-muted-foreground">/ 100</span>
            </div>
          </div>

          {/* サマリー：ヘッダー内に自然に配置 */}
          {report?.summary && (
            <p className="mt-4 text-[0.95rem] leading-relaxed text-foreground/80 border-t border-current/10 pt-4">
              {report.summary}
            </p>
          )}
        </div>
      </div>

      {report ? (
        <div className="space-y-10">

          {/* ── 今何が起きているか ─────────────────────────── */}
          <div className="space-y-4">
            <SectionHeading icon={<Newspaper className="size-3.5" />}>今何が起きているか</SectionHeading>
            <div className="space-y-3">
              {report.whatIsHappening.map((item, i) => (
                <div key={i} className="flex gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30">
                  <span className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-black",
                    i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-[0.9rem] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── このトレンドの特徴 ─────────────────────────── */}
          {report.characteristics && (
            <div className="space-y-4">
              <SectionHeading icon={<Lightbulb className="size-3.5" />}>このトレンドの特徴</SectionHeading>
              <div className="rounded-xl border-l-4 border-primary/50 bg-primary/[0.03] px-5 py-4">
                <p className="text-[0.95rem] leading-relaxed">{report.characteristics}</p>
              </div>
            </div>
          )}

          {/* ── 注目プレイヤー ────────────────────────────── */}
          {report.keyPlayers.length > 0 && (
            <div className="space-y-4">
              <SectionHeading icon={<Building2 className="size-3.5" />}>注目プレイヤー</SectionHeading>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {report.keyPlayers.map((player, i) => {
                  const colonIdx = player.indexOf(":");
                  const name   = colonIdx > -1 ? player.slice(0, colonIdx).trim() : player;
                  const detail = colonIdx > -1 ? player.slice(colonIdx + 1).trim() : "";
                  return (
                    <div key={i} className="rounded-xl border bg-card p-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                          {name.slice(0, 1)}
                        </span>
                        <p className="font-bold text-sm leading-tight">{name}</p>
                      </div>
                      {detail && <p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 市場規模 ──────────────────────────────────── */}
          {report.marketSize && report.marketSize !== "公開データなし" && (
            <div className="space-y-4">
              <SectionHeading icon={<TrendingUp className="size-3.5" />}>市場規模</SectionHeading>
              <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:from-blue-950/30 dark:to-indigo-950/20 dark:border-blue-800/40">
                <p className="text-[0.95rem] leading-relaxed font-medium">{report.marketSize}</p>
              </div>
            </div>
          )}

          {/* ── 今後12ヶ月の見通し ────────────────────────── */}
          {report.outlook && (
            <div className="space-y-4">
              <SectionHeading icon={<Globe className="size-3.5" />}>今後12ヶ月の見通し</SectionHeading>
              <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-purple-50 p-5 dark:from-violet-950/30 dark:to-purple-950/20 dark:border-violet-800/40">
                <p className="text-[0.95rem] leading-relaxed">{report.outlook}</p>
              </div>
            </div>
          )}

          {/* ── フッター ──────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <div className="flex flex-wrap gap-2">
              {report.sources.slice(0, 5).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30">
                  <ExternalLink className="size-3" />参照{i + 1}
                </a>
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              AIリサーチ: {new Date(report.generatedAt).toLocaleDateString("ja-JP")}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 size-6 animate-spin" />
          <p className="text-sm">レポートを生成できませんでした。しばらくしてから再度アクセスしてください。</p>
        </div>
      )}
    </div>
  );
}
