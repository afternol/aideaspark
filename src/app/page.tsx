"use client";

import Link from "next/link";
import {
  Lightbulb,
  TrendingUp,
  Trophy,
  ArrowRight,
  Sparkles,
  BarChart3,
  Zap,
  Search,
  Wand2,
  FileText,
  Compass,
  Flame,
  CheckCircle2,
  Brain,
  Bookmark,
  ChevronRight,
  FolderHeart,
  History,
  Bell,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockIdeas } from "@/data/mock/ideas";
import { CATEGORIES } from "@/lib/constants";
import { SCORE_LABELS } from "@/lib/types";
import type { IdeaScore } from "@/lib/types";
import { cn } from "@/lib/utils";

const avg = (s: IdeaScore) =>
  Math.round((Object.values(s).reduce((a, b) => a + b, 0) / 6) * 10) / 10;

const scoreColor = (n: number) =>
  n >= 4 ? "text-emerald-500" : n >= 3 ? "text-yellow-500" : "text-red-500";

const scoreBg = (n: number) =>
  n >= 4 ? "bg-emerald-500" : n >= 3 ? "bg-yellow-500" : "bg-red-500";

const topIdeas = [...mockIdeas]
  .sort((a, b) => avg(b.scores) - avg(a.scores))
  .slice(0, 4);

const categoryLabels = CATEGORIES.map((c) => c.label);

// ─── Static trend data for LP mockup ───────────────────────────────────────
const TREND_TILES = [
  { label: "AIエージェント", score: 94, color: "#059669" },
  { label: "生成AI", score: 91, color: "#059669" },
  { label: "AI SaaS", score: 88, color: "#059669" },
  { label: "フィンテック", score: 76, color: "#3b82f6" },
  { label: "デジタルヘルス", score: 74, color: "#3b82f6" },
  { label: "EdTech", score: 68, color: "#3b82f6" },
  { label: "フェムテック", score: 63, color: "#ca8a04" },
  { label: "物流テック", score: 57, color: "#ca8a04" },
  { label: "クリーンテック", score: 52, color: "#ea580c" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      {/* ======================================================
          HEADER
      ====================================================== */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Lightbulb className="size-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">AideaSpark</span>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: "/trends", icon: TrendingUp, label: "トレンド" },
              { href: "/rankings", icon: Trophy, label: "ランキング" },
              { href: "/diagnosis", icon: Compass, label: "アイデア診断" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden text-base text-muted-foreground transition-colors hover:text-foreground md:block"
            >
              ログイン
            </Link>
            <Link href="/feed">
              <Button size="sm" className="gap-1.5">
                無料で始める
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ======================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-24 pt-20 text-white md:pb-32 md:pt-28">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[700px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 size-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-base backdrop-blur-sm">
            <Sparkles className="size-3.5 text-primary" />
            <span>AI × 独自リサーチで構造化した、起業・新規事業のアイデアメディア</span>
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight md:text-[72px]">
            「何をやるか」の
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              意思決定を加速する。
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/65 md:text-xl">
            88領域・6軸定量評価・トレンドスコア付きのビジネスアイデアを毎週配信。
            <br className="hidden sm:block" />
            AI が競合分析・カスタマイズ・ビジネスプラン生成まで一気通貫でサポート。
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/feed">
              <Button
                size="lg"
                className="gap-2 px-8 text-base shadow-xl shadow-primary/30"
              >
                <Zap className="size-4" />
                アイデアを探索する
              </Button>
            </Link>
            <Link href="/diagnosis">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/20 bg-white/10 px-8 text-base text-white hover:bg-white/20 hover:text-white"
              >
                <Compass className="size-4" />
                アイデア診断を受ける（無料）
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-16 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: `${mockIdeas.length}+`, label: "厳選アイデア" },
              { value: "88", label: "ビジネス領域" },
              { value: "6軸", label: "定量評価指標" },
              { value: "毎週", label: "新規配信" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 py-4 backdrop-blur-sm"
              >
                <div className="text-2xl font-extrabold md:text-3xl">{value}</div>
                <div className="mt-0.5 text-base text-white/45">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          CATEGORY MARQUEE
      ====================================================== */}
      <section className="border-b border-t bg-muted/30 py-3">
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes lp-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .lp-marquee { display: flex; width: max-content; gap: 0.5rem; animation: lp-marquee 60s linear infinite; }
            .lp-marquee:hover { animation-play-state: paused; }
          `,
        }} />
        <div className="overflow-hidden">
          <div className="lp-marquee">
            {[...categoryLabels, ...categoryLabels].map((cat, i) => (
              <span
                key={i}
                className="shrink-0 rounded-full border bg-background px-3 py-1 text-base font-medium text-muted-foreground"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          WHY BIZIDEA
      ====================================================== */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-base font-semibold uppercase tracking-widest text-primary">
              Why AideaSpark
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              「壁打ち」で終わらせない、
              <br />
              <span className="text-primary">データ駆動の意思決定</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              汎用 AI との違いは、AideaSpark が持つ独自データにある。トレンドスコア・6軸評価・
              構造化された事業情報が、アイデアを「感覚」から「根拠」へ変える。
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: BarChart3,
                colorCls: "text-emerald-500",
                bgCls: "bg-emerald-500/10",
                title: "6軸定量スコアリング",
                desc: "新規性・市場規模・収益性・成長性・実現可能性・参入障壁を 1〜5 でスコアリング。感覚的な「良さそう」を数字に変換し、根拠をもった比較判断を可能にする。",
                tags: ["新規性", "市場規模", "収益性", "成長性", "実現可能性", "参入障壁"],
              },
              {
                icon: TrendingUp,
                colorCls: "text-blue-500",
                bgCls: "bg-blue-500/10",
                title: "リアルトレンド連動",
                desc: "Google 検索トレンド・業界動向・専門家知見を統合した独自アルゴリズムで 88 領域のホットネスを毎週更新。旬のタイミングに乗れるアイデアを優先的に発見。",
                tags: ["週次更新", "88 領域スコア", "ヒートマップ", "モメンタム分析"],
              },
              {
                icon: Brain,
                colorCls: "text-purple-500",
                bgCls: "bg-purple-500/10",
                title: "アクションに繋がる AI",
                desc: "「考えて終わり」にしない。プラットフォーム独自データを活用した AI が、カスタマイズ・ビジネスプラン生成・PDF/Word 出力まで、次の行動に直結する。",
                tags: ["AI カスタマイズ", "ビジネスプラン生成", "PDF・Word 出力"],
              },
            ].map(({ icon: Icon, colorCls, bgCls, title, desc, tags }) => (
              <Card key={title} className="border-0 bg-muted/40">
                <CardContent className="p-6">
                  <div
                    className={cn(
                      "mb-4 inline-flex size-12 items-center justify-center rounded-xl",
                      bgCls
                    )}
                  >
                    <Icon className={cn("size-6", colorCls)} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{title}</h3>
                  <p className="mb-4 text-base leading-relaxed text-muted-foreground">{desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-base">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          FEATURES DEEP DIVE
      ====================================================== */}
      <section className="border-t bg-muted/10 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-base font-semibold uppercase tracking-widest text-primary">
              Features
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              起業・新規事業の全ステップを網羅
            </h2>
          </div>

          <div className="space-y-5">

            {/* ── Feature 1: Feed ── */}
            <div className="grid items-center gap-8 overflow-hidden rounded-2xl border bg-background p-7 md:grid-cols-2 md:p-10">
              <div>
                <Badge variant="secondary" className="mb-4">アイデアフィード</Badge>
                <h3 className="mb-3 text-2xl font-bold leading-snug">
                  88 領域・25+ 顧客セグメントで
                  <br />
                  ぴったりのアイデアを絞り込む
                </h3>
                <p className="mb-5 text-muted-foreground leading-relaxed">
                  カテゴリ・業界・顧客・最低スコアの 4 軸フィルターと、6 種類のソートで
                  膨大なアイデアを瞬時にナビゲート。AI 自然言語検索では
                  「SaaS×医療×B2B」のような複合条件も一言で入力できる。
                </p>
                <ul className="mb-6 space-y-2">
                  {[
                    "88 領域・10 グループのカテゴリ体系",
                    "35+ 業界・25+ 顧客セグメントのフィルター",
                    "6 種類のソート（新着・スコア・成長性・始めやすさ・新規性・市場規模）",
                    "AI 自然言語検索で複合条件を一言指定",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="/feed">
                  <Button className="gap-2">
                    フィードを見る <ChevronRight className="size-4" />
                  </Button>
                </Link>
              </div>

              {/* Mockup */}
              <div className="rounded-xl border bg-muted/30 p-5">
                <div className="mb-3 flex items-center gap-2 text-base font-medium text-muted-foreground">
                  <Search className="size-4 text-primary" />
                  検索・フィルター
                </div>
                <div className="mb-4 space-y-2">
                  {[
                    { label: "領域", val: "AI・データ ×3" },
                    { label: "対象業界", val: "IT・通信" },
                    { label: "対象顧客", val: "スタートアップ" },
                    { label: "最低スコア", val: "4.0 以上" },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-base text-muted-foreground">{label}</span>
                      <div className="flex-1 rounded-md border bg-background px-3 py-1.5 text-base text-foreground/70">
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {topIdeas.slice(0, 2).map((idea) => (
                    <div key={idea.id} className="rounded-lg border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold">{idea.serviceName}</span>
                        <span className={cn("text-base font-black", scoreColor(avg(idea.scores)))}>
                          {avg(idea.scores)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-base text-muted-foreground">
                        {idea.oneLiner}
                      </p>
                      <div className="mt-1.5 flex gap-1">
                        <Badge variant="secondary" className="text-base">
                          {idea.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Feature 2: Scoring ── */}
            <div className="grid items-center gap-8 overflow-hidden rounded-2xl border bg-background p-7 md:grid-cols-2 md:p-10">
              {/* Mockup */}
              <div className="order-2 rounded-xl border bg-muted/30 p-5 md:order-1">
                <div className="mb-3 text-base font-medium text-muted-foreground">
                  6 軸評価スコア
                </div>
                {topIdeas[0] && (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-base font-bold">{topIdeas[0].serviceName}</span>
                      <div className="ml-auto flex items-baseline gap-1">
                        <span
                          className={cn(
                            "text-2xl font-black",
                            scoreColor(avg(topIdeas[0].scores))
                          )}
                        >
                          {avg(topIdeas[0].scores)}
                        </span>
                        <span className="text-base text-muted-foreground">/ 5.0</span>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {(Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 text-base text-muted-foreground">
                            {SCORE_LABELS[key]}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full transition-all", scoreBg(topIdeas[0].scores[key]))}
                              style={{ width: `${(topIdeas[0].scores[key] / 5) * 100}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "w-5 text-right text-base font-bold",
                              scoreColor(topIdeas[0].scores[key])
                            )}
                          >
                            {topIdeas[0].scores[key]}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Simple hexagon mini-chart */}
                    <div className="mt-4 flex justify-center">
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key) => (
                          <div
                            key={key}
                            className="flex flex-col items-center rounded-lg bg-muted px-3 py-2"
                          >
                            <span className="text-base text-muted-foreground">
                              {SCORE_LABELS[key]}
                            </span>
                            <span
                              className={cn(
                                "text-lg font-black",
                                scoreColor(topIdeas[0].scores[key])
                              )}
                            >
                              {topIdeas[0].scores[key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="order-1 md:order-2">
                <Badge variant="secondary" className="mb-4">6 軸定量評価</Badge>
                <h3 className="mb-3 text-2xl font-bold leading-snug">
                  「なんとなく良さそう」を
                  <br />
                  数字で比較・判断する
                </h3>
                <p className="mb-5 text-muted-foreground leading-relaxed">
                  全アイデアに 6 軸スコア＋スコアの根拠コメントを付与。
                  レーダーチャートで強み・弱みを一目で把握し、ランキング機能で
                  「始めやすさ」「成長性」「独自性」など自分の軸で並べ替えられる。
                </p>
                <ul className="mb-6 space-y-2">
                  {[
                    "1〜5 の定量スコア＋各軸のコメント",
                    "レーダーチャートで全体バランスを可視化",
                    "総合・成長性・始めやすさ・独自性の 4 ランキング",
                    "最大 3 アイデアを横並び比較",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="/rankings">
                  <Button className="gap-2">
                    ランキングを見る <ChevronRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* ── Feature 3: Trends ── */}
            <div className="grid items-center gap-8 overflow-hidden rounded-2xl border bg-background p-7 md:grid-cols-2 md:p-10">
              <div>
                <Badge variant="secondary" className="mb-4">トレンドレーダー</Badge>
                <h3 className="mb-3 text-2xl font-bold leading-snug">
                  88 領域のホットネスを
                  <br />
                  ヒートマップでリアルに把握
                </h3>
                <p className="mb-5 text-muted-foreground leading-relaxed">
                  Google 検索トレンド・業界成長率・専門家知見を統合した独自スコアで、
                  今最もビジネスチャンスがある領域を可視化。上昇トレンドのアイデアに
                  自動でキーワードが紐付くので、旬のタイミングを見逃さない。
                </p>
                <ul className="mb-6 space-y-2">
                  {[
                    "88 領域のトレンドスコアを週次更新",
                    "上昇・安定・下降のモメンタム表示",
                    "グループ別カラーヒートマップ",
                    "アイデアとトレンドキーワードが自動紐付け",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="/trends">
                  <Button className="gap-2">
                    トレンドを見る <ChevronRight className="size-4" />
                  </Button>
                </Link>
              </div>

              {/* Trend heatmap mockup */}
              <div className="rounded-xl border bg-muted/30 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Flame className="size-4 text-emerald-500" />
                  <span className="text-base font-medium">注目の上昇トレンド</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {TREND_TILES.map(({ label, score, color }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center justify-center rounded-xl py-3 text-white"
                      style={{ backgroundColor: color }}
                    >
                      <span className="text-center text-base font-semibold leading-tight px-1">
                        {label}
                      </span>
                      <span className="mt-0.5 text-base font-black">{score}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-base text-muted-foreground">
                  <span className="font-medium">スコア:</span>
                  {[
                    { color: "#059669", label: "80+" },
                    { color: "#3b82f6", label: "65+" },
                    { color: "#ca8a04", label: "50+" },
                    { color: "#ea580c", label: "35+" },
                  ].map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1">
                      <span
                        className="inline-block size-2.5 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Feature 4: Diagnosis ── */}
            <div className="grid items-center gap-8 overflow-hidden rounded-2xl border bg-background p-7 md:grid-cols-2 md:p-10">
              {/* Mockup */}
              <div className="order-2 rounded-xl border bg-muted/30 p-5 md:order-1">
                <div className="mb-3 text-base font-medium text-muted-foreground">
                  アイデア診断 — 3 / 5
                </div>
                <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-3/5 rounded-full bg-primary" />
                </div>
                <div className="space-y-2">
                  {[
                    { q: "どの領域に興味がありますか？", a: "AI・データ、ヘルスケア", done: true },
                    { q: "誰に届けたいですか？", a: "スタートアップ", done: true },
                    {
                      q: "何を重視しますか？",
                      a: "成長ポテンシャル ← 選択中",
                      done: false,
                    },
                    { q: "技術的な難易度は？", a: "未回答", done: false, future: true },
                    { q: "ビジネスモデルは？", a: "未回答", done: false, future: true },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg border p-3 text-base",
                        item.done
                          ? "border-primary/20 bg-primary/5"
                          : !item.future
                          ? "border-border bg-background"
                          : "border-border/50 bg-muted/50 opacity-50"
                      )}
                    >
                      <div className="text-base text-muted-foreground">{item.q}</div>
                      <div
                        className={cn(
                          "mt-0.5 font-medium",
                          item.done ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {item.a}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg bg-primary px-4 py-2 text-center text-base font-bold text-primary-foreground">
                  5 問 → あなた向きトップ 5 を表示
                </div>
              </div>

              <div className="order-1 md:order-2">
                <Badge variant="secondary" className="mb-4">アイデア診断</Badge>
                <h3 className="mb-3 text-2xl font-bold leading-snug">
                  5 問答えるだけで
                  <br />
                  あなた向きのアイデアを発掘
                </h3>
                <p className="mb-5 text-muted-foreground leading-relaxed">
                  「興味領域」「ターゲット顧客」「重視ポイント」「難易度」「ビジネスモデル」
                  の 5 問に答えると、マッチ度スコアの高い順にアイデアトップ 5 を提示。
                  「何から見ればいいかわからない」という入口としても最適。
                </p>
                <ul className="mb-6 space-y-2">
                  {[
                    "5 ステップ・約 2 分で完了",
                    "マッチ度スコアで優先度付け",
                    "結果からそのままアイデア詳細へ",
                    "何度でもやり直し可能",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="/diagnosis">
                  <Button className="gap-2">
                    診断を受ける（無料）<ChevronRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          AI FEATURES SPOTLIGHT
      ====================================================== */}
      <section className="bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-base font-semibold uppercase tracking-widest text-primary">
              AI Features
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">
              「考えて終わり」にしない
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                アクションに繋がる AI
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/55">
              AideaSpark 独自のデータ（6 軸スコア・トレンド DB・構造化アイデア情報）を活用した
              AI は、汎用 ChatGPT にはできない精度と文脈でサポートする。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "AI 自然言語検索",
                desc: "「医療×SaaS×B2B で月100万円を目指せるもの」など複合条件を自由に入力。全アイデア DB から意図に合うものを即座に絞り込み、理由とともに提示。",
                tag: "実装済み",
                href: "/feed",
                cta: "試してみる",
              },
              {
                icon: Wand2,
                title: "AI アイデアカスタマイズ",
                desc: "「予算 500 万円・チーム 3 名・エンジニアスキル」を指定すると、アイデアを自分仕様に再構築。複数バージョンを並べて比較・コレクション保存ができる。",
                tag: "実装済み",
                href: "/feed",
                cta: "アイデアを開く",
              },
              {
                icon: FileText,
                title: "AI ビジネスプラン生成",
                desc: "アイデア（またはカスタマイズ済みバージョン）を選んでボタン 1 つで事業計画書の草案を生成。PDF・Word 形式でエクスポートして即使える状態に。",
                tag: "実装済み",
                href: "/feed",
                cta: "プランを作る",
              },
            ].map(({ icon: Icon, title, desc, tag, href, cta }) => (
              <div
                key={title}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/20">
                  <Icon className="size-6 text-primary" />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-lg font-bold">{title}</h3>
                  <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-400 text-base">
                    {tag}
                  </Badge>
                </div>
                <p className="mb-5 flex-1 text-base leading-relaxed text-white/55">{desc}</p>
                <Link href={href}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    {cta}
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          POPULAR IDEAS PREVIEW
      ====================================================== */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-base font-semibold uppercase tracking-widest text-primary">
                Top Ideas
              </p>
              <h2 className="text-3xl font-bold">スコア上位のアイデア</h2>
            </div>
            <Link href="/rankings">
              <Button variant="outline" className="gap-2">
                ランキングをすべて見る <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {topIdeas.map((idea, idx) => (
              <Link key={idea.id} href={`/ideas/${idea.slug}`}>
                <Card className="h-full gap-0 overflow-hidden py-0 transition-all hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="flex h-full flex-col p-5">
                    {/* Rank + Score */}
                    <div className="mb-3 flex items-center justify-between">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full text-base font-black text-white",
                          idx === 0
                            ? "bg-amber-500"
                            : idx === 1
                            ? "bg-slate-400"
                            : idx === 2
                            ? "bg-amber-700"
                            : "bg-primary"
                        )}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={cn("text-2xl font-black", scoreColor(avg(idea.scores)))}
                        >
                          {avg(idea.scores)}
                        </span>
                        <span className="text-base text-muted-foreground">/ 5.0</span>
                      </div>
                    </div>

                    {/* Name + oneLiner */}
                    <h3 className="mb-1 text-base font-bold leading-snug">{idea.serviceName}</h3>
                    <p className="mb-3 line-clamp-2 flex-1 text-base text-muted-foreground">
                      {idea.oneLiner}
                    </p>

                    {/* Badges */}
                    <div className="mb-3 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-base">
                        {idea.category}
                      </Badge>
                      <Badge variant="outline" className="text-base">
                        <Bookmark className="mr-0.5 size-2.5" />
                        {idea.bookmarks}
                      </Badge>
                    </div>

                    {/* Score bars */}
                    <div className="space-y-1.5">
                      {(Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="w-14 shrink-0 text-base text-muted-foreground">
                            {SCORE_LABELS[key]}
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", scoreBg(idea.scores[key]))}
                              style={{ width: `${(idea.scores[key] / 5) * 100}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "w-4 text-right text-base font-bold",
                              scoreColor(idea.scores[key])
                            )}
                          >
                            {idea.scores[key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          HOW IT WORKS
      ====================================================== */}
      <section className="border-t bg-muted/20 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-base font-semibold uppercase tracking-widest text-primary">
              How it works
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">
              アイデア発見からプラン作成まで
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: 1,
                icon: Search,
                title: "アイデアを探す",
                desc: "フィルター検索・AI 検索・アイデア診断で、88 領域から自分にフィットするアイデアを発見する",
              },
              {
                step: 2,
                icon: BarChart3,
                title: "スコアで評価する",
                desc: "6 軸レーダーチャート・ランキング・横並び比較で、アイデアを客観的に評価・絞り込む",
              },
              {
                step: 3,
                icon: Wand2,
                title: "AI で深掘りする",
                desc: "予算・チーム・スキルを入力して AI カスタマイズ。自分の状況に合ったバージョンを複数生成・比較",
              },
              {
                step: 4,
                icon: FileText,
                title: "プランに落とし込む",
                desc: "AI ビジネスプラン生成でアイデアを事業計画書に。PDF・Word でエクスポートして即使える",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <Icon className="size-8" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border-2 border-background bg-foreground text-base font-black text-background">
                    {step}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold">{title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          USE CASES
      ====================================================== */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-base font-semibold uppercase tracking-widest text-primary">
              Use Cases
            </p>
            <h2 className="text-3xl font-bold">こんな人に使われています</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                emoji: "🚀",
                role: "起業準備中の個人",
                pain: "「何をやるか」がずっと決まらない",
                solution:
                  "6 軸スコアとトレンドで候補を科学的に絞り込み、AI ビジネスプランで検証コストを激減。週末にアイデアを眺めて比較検討するだけで方向性が見えてくる。",
                features: ["アイデア診断", "6 軸スコア比較", "AI ビジネスプラン生成", "PDF エクスポート"],
              },
              {
                emoji: "🏢",
                role: "新規事業担当者",
                pain: "市場調査・アイデア収集に時間がかかりすぎる",
                solution:
                  "トレンドレーダーで旬の領域を把握し、構造化されたアイデア情報を社内提案の素材として即活用。比較機能で複数アイデアを整理して稟議資料に。",
                features: ["トレンドレーダー", "横並び比較", "コレクション管理", "Word エクスポート"],
              },
              {
                emoji: "💼",
                role: "副業を始めたい会社員",
                pain: "投資リスクを抑えたアイデアが見つからない",
                solution:
                  "「始めやすさ」「投資規模〜50万円」でフィルタリングして低コスト・高収益を狙えるアイデアを発見。AI カスタマイズで自分のスキルに最適化して検討を深める。",
                features: ["始めやすさフィルター", "投資規模絞り込み", "AI カスタマイズ", "メモ機能"],
              },
            ].map(({ emoji, role, pain, solution, features }) => (
              <Card key={role} className="border-0 bg-muted/40">
                <CardContent className="p-6">
                  <div className="mb-4 text-4xl">{emoji}</div>
                  <h3 className="mb-1 text-lg font-bold">{role}</h3>
                  <p className="mb-3 text-base italic text-muted-foreground">「{pain}」</p>
                  <p className="mb-4 text-base leading-relaxed text-muted-foreground">{solution}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {features.map((f) => (
                      <Badge key={f} variant="secondary" className="text-base">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          OTHER FEATURES
      ====================================================== */}
      <section className="border-t bg-muted/10 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-xl font-bold text-muted-foreground">
            その他の機能
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FolderHeart,
                title: "コレクション管理",
                desc: "気になるアイデアをフォルダに整理・保存。複数フォルダを使い分けて分野別に管理。",
              },
              {
                icon: Trophy,
                title: "リアクション & コメント",
                desc: "いいね・気になる・参考になったの 3 種リアクションとスレッド式コメントでアイデアを評価。",
              },
              {
                icon: History,
                title: "閲覧履歴",
                desc: "過去に見たアイデアを時系列で追跡。気になったアイデアへいつでも戻れる。",
              },
              {
                icon: Bell,
                title: "通知",
                desc: "コメント返信・コレクション更新など重要なアクティビティをリアルタイムで通知。",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 rounded-xl border bg-background p-4"
              >
                <div className="shrink-0">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-base font-bold">{title}</h3>
                  <p className="text-base leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          FINAL CTA
      ====================================================== */}
      <section className="bg-primary px-4 py-24 text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="mx-auto mb-4 size-12 opacity-75" />
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            次の一手を、今日見つけよう。
          </h2>
          <p className="mb-10 text-xl opacity-70">
            無料で始めて、{mockIdeas.length}+ のビジネスアイデアを今すぐ探索。
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/feed">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 px-10 text-base shadow-xl"
              >
                <Zap className="size-4" />
                アイデアを探索する
              </Button>
            </Link>
            <Link href="/diagnosis">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-primary-foreground/30 bg-transparent px-10 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Compass className="size-4" />
                アイデア診断を受ける
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}
      <footer className="border-t bg-background px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-start gap-8 sm:flex-row">
            {/* Brand */}
            <div className="shrink-0">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
                  <Lightbulb className="size-3.5 text-primary-foreground" />
                </div>
                <span className="text-base font-bold">AideaSpark</span>
              </div>
              <p className="max-w-xs text-base leading-relaxed text-muted-foreground">
                起業・新規事業の「何をやるか」の意思決定を科学的にサポートするビジネスアイデアメディア。
              </p>
            </div>

            {/* Links */}
            <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3">
              <div>
                <p className="mb-3 text-base font-semibold uppercase tracking-wide text-muted-foreground">
                  探索
                </p>
                <ul className="space-y-2 text-base">
                  {[
                    { href: "/feed", label: "アイデアフィード" },
                    { href: "/trends", label: "トレンドレーダー" },
                    { href: "/rankings", label: "ランキング" },
                    { href: "/diagnosis", label: "アイデア診断" },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-base font-semibold uppercase tracking-wide text-muted-foreground">
                  機能
                </p>
                <ul className="space-y-2 text-base">
                  {[
                    { href: "/compare", label: "アイデア比較" },
                    { href: "/collections", label: "コレクション" },
                    { href: "/my-ideas", label: "マイアイデア" },
                    { href: "/history", label: "閲覧履歴" },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-base font-semibold uppercase tracking-wide text-muted-foreground">
                  アカウント
                </p>
                <ul className="space-y-2 text-base">
                  {[
                    { href: "/login", label: "ログイン" },
                    { href: "/register", label: "新規登録" },
                    { href: "/mypage", label: "マイページ" },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 text-center text-base text-muted-foreground">
            &copy; 2026 AideaSpark. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
