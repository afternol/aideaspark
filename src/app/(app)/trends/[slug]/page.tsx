"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft, ArrowUpRight, ArrowRight, ArrowDownRight,
  Loader2, Newspaper, Building2, TrendingUp, Globe,
  Clock, BookOpen, CalendarDays, DollarSign, Rocket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TrendReportData, TrendSource } from "@/lib/trend-slugs";

function CitedText({ text, sources }: { text: string; sources: TrendSource[] }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m) {
          const n = Number(m[1]);
          const src = sources.find((s) => s.num === n);
          return (
            <sup key={i}>
              <a
                href={`#ref-${n}`}
                className="mx-0.5 font-bold text-primary hover:underline"
                title={src ? `${src.publisher} — ${src.title}` : undefined}
              >
                {n}
              </a>
            </sup>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

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
      <h2 className="text-lg font-bold">{children}</h2>
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
        <div className="py-24" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="py-20 text-center">
        <p className="text-base text-muted-foreground">トレンドが見つかりません</p>
        <Link href="/trends" className="mt-4 inline-block rounded-md border px-4 py-2 text-base hover:bg-muted">
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
                <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", mcfg.cls)}>
                  <MIcon className="size-3.5" />{mcfg.label}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight">{data.keyword}</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">トレンドスコア</p>
              <span className={cn("text-6xl font-black tabular-nums leading-none", scoreColor(data.totalScore))}>
                {data.totalScore}
              </span>
              <span className="ml-1 text-base text-muted-foreground">/ 100</span>
            </div>
          </div>

          {report?.summary && (
            <p className="mt-4 text-base leading-relaxed text-foreground/80 border-t border-current/10 pt-4">
              <CitedText text={report.summary} sources={report.sources} />
            </p>
          )}
        </div>
      </div>

      {report ? (
        <div className="space-y-10">

          {/* ── 直近の注目ニュース ─────────────────────────── */}
          {report.recentNews && report.recentNews.length > 0 && (
            <div className="space-y-4">
              <SectionHeading icon={<CalendarDays className="size-4" />}>直近の注目ニュース</SectionHeading>
              <div className="relative border-l-2 border-muted pl-6 space-y-6">
                {report.recentNews.map((news, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[1.75rem] top-1.5 flex size-3.5 items-center justify-center rounded-full border-2 border-primary bg-background" />
                    <p className="text-xs font-bold text-primary mb-1">{news.date}</p>
                    <p className="text-base font-bold leading-snug mb-1.5">{news.headline}</p>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      <CitedText text={news.detail} sources={report.sources} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 今何が起きているか ─────────────────────────── */}
          <div className="space-y-4">
            <SectionHeading icon={<Newspaper className="size-4" />}>今何が起きているか</SectionHeading>
            <div className="space-y-3">
              {report.whatIsHappening.map((item, i) => (
                <div key={i} className="flex gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30">
                  <span className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-black",
                    i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-base leading-relaxed">
                    <CitedText text={item} sources={report.sources} />
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── 投資・資金調達動向 ────────────────────────── */}
          {report.investmentTrends && (
            <div className="space-y-4">
              <SectionHeading icon={<DollarSign className="size-4" />}>投資・資金調達動向</SectionHeading>
              <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/40">
                <p className="text-base leading-relaxed">
                  <CitedText text={report.investmentTrends} sources={report.sources} />
                </p>
              </div>
            </div>
          )}

          {/* ── グローバル動向 ────────────────────────────── */}
          {report.globalContext && (
            <div className="space-y-4">
              <SectionHeading icon={<Globe className="size-4" />}>グローバル動向・海外との比較</SectionHeading>
              <div className="rounded-xl border bg-gradient-to-br from-sky-50 to-cyan-50 p-5 dark:from-sky-950/30 dark:to-cyan-950/20 dark:border-sky-800/40">
                <p className="text-base leading-relaxed">
                  <CitedText text={report.globalContext} sources={report.sources} />
                </p>
              </div>
            </div>
          )}

          {/* ── 注目プレイヤー ────────────────────────────── */}
          {report.keyPlayers.length > 0 && (
            <div className="space-y-4">
              <SectionHeading icon={<Building2 className="size-4" />}>注目プレイヤー</SectionHeading>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {report.keyPlayers.map((player, i) => {
                  const colonIdx = player.indexOf(":");
                  const name   = colonIdx > -1 ? player.slice(0, colonIdx).trim() : player;
                  const detail = colonIdx > -1 ? player.slice(colonIdx + 1).trim() : "";
                  return (
                    <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                          {name.slice(0, 1)}
                        </span>
                        <p className="font-bold text-base leading-tight">{name}</p>
                      </div>
                      {detail && (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          <CitedText text={detail} sources={report.sources} />
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 市場規模 ──────────────────────────────────── */}
          {report.marketSize && report.marketSize !== "公開データなし" && (
            <div className="space-y-4">
              <SectionHeading icon={<TrendingUp className="size-4" />}>市場規模</SectionHeading>
              <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:from-blue-950/30 dark:to-indigo-950/20 dark:border-blue-800/40">
                <p className="text-base leading-relaxed font-medium">
                  <CitedText text={report.marketSize} sources={report.sources} />
                </p>
              </div>
            </div>
          )}

          {/* ── 今後の見通し ──────────────────────────────── */}
          {report.outlook && (
            <div className="space-y-4">
              <SectionHeading icon={<Rocket className="size-4" />}>今後12〜18ヶ月の見通し</SectionHeading>
              <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-purple-50 p-5 dark:from-violet-950/30 dark:to-purple-950/20 dark:border-violet-800/40">
                <p className="text-base leading-relaxed">
                  <CitedText text={report.outlook} sources={report.sources} />
                </p>
              </div>
            </div>
          )}

          {/* ── 出典 ──────────────────────────────────────── */}
          {report.sources.length > 0 && (
            <div className="border-t pt-8">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="size-4 text-muted-foreground" />
                <h2 className="text-base font-bold text-muted-foreground">出典</h2>
              </div>
              <ol className="space-y-3">
                {report.sources.map((src) => (
                  <li key={src.num} id={`ref-${src.num}`} className="flex gap-3 text-sm leading-relaxed">
                    <span className="mt-0.5 shrink-0 text-sm font-bold text-muted-foreground tabular-nums">
                      {src.num}.
                    </span>
                    <span className="text-muted-foreground">
                      {src.publisher}
                      {src.title && (
                        <>
                          {" — "}
                          {src.url ? (
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground/70 underline underline-offset-2 hover:text-primary"
                            >
                              {src.title}
                            </a>
                          ) : (
                            src.title
                          )}
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="flex items-center gap-1.5 mt-5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                AIリサーチ: {new Date(report.generatedAt).toLocaleDateString("ja-JP")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 size-6 animate-spin" />
          <p className="text-base">レポートを生成できませんでした。しばらくしてから再度アクセスしてください。</p>
        </div>
      )}
    </div>
  );
}
