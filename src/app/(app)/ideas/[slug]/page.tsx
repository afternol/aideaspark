"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  Zap,
  Puzzle,
  Coins,
  Search,
  Shield,
  Lightbulb,
  TrendingUp,
  FileText,
  Wand2,
  Loader2,
  Sparkles,
  Clock,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { IdeaScore, IdeaWithEngagement, ReactionType } from "@/lib/types";
import { getPatternById } from "@/lib/patterns";
import { SCORE_LABELS, SCORE_VIEWPOINTS } from "@/lib/types";
import { ScoreBar } from "@/components/ideas/score-bar";
import { IdeaRadarChart } from "@/components/ideas/idea-radar-chart";
import { ReactionBar } from "@/components/engagement/reaction-bar";
import { CommentSection } from "@/components/engagement/comment-section";
import { IdeaNote } from "@/components/engagement/idea-note";
import { AddToCollection } from "@/components/engagement/add-to-collection";
import { GlossaryText } from "@/components/shared/glossary-text";
import { CustomizePanel } from "@/components/ai/customize-panel";
import { BizPlanPanel } from "@/components/ai/bizplan-panel";
import { IdeaRating } from "@/components/engagement/idea-rating";
import { api } from "@/lib/api-client";

const avgScore = (scores: IdeaScore) => {
  const vals = Object.values(scores);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
};

const scoreColorClass = (n: number) =>
  n >= 4 ? "text-emerald-600 dark:text-emerald-400" : n >= 3 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";

function DetailBox({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-primary/40 bg-primary/[0.03] px-4 py-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-primary">{icon}{label}</p>
      <div className="text-[0.95rem] leading-relaxed text-foreground/80">
        {typeof children === "string" ? <GlossaryText text={children} /> : children}
      </div>
    </div>
  );
}

const INSIGHT_STYLES = {
  amber: {
    wrap:  "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800/60 dark:from-amber-950/40 dark:to-orange-950/30",
    label: "text-amber-700 dark:text-amber-400",
    icon:  "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
  },
  violet: {
    wrap:  "border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 dark:border-violet-800/60 dark:from-violet-950/40 dark:to-purple-950/30",
    label: "text-violet-700 dark:text-violet-400",
    icon:  "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400",
  },
  emerald: {
    wrap:  "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800/60 dark:from-emerald-950/40 dark:to-teal-950/30",
    label: "text-emerald-700 dark:text-emerald-400",
    icon:  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
  },
} as const;

function InsightBox({
  icon, label, children, color,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  color: keyof typeof INSIGHT_STYLES;
}) {
  const s = INSIGHT_STYLES[color];
  return (
    <div className={`rounded-xl border p-3.5 ${s.wrap}`}>
      <p className={`mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${s.label}`}>
        <span className={`inline-flex size-4 items-center justify-center rounded-full ${s.icon}`}>
          {icon}
        </span>
        {label}
      </p>
      <p className="text-[0.8rem] leading-relaxed text-foreground/80">
        {children}
      </p>
    </div>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        {icon}{children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  const lines = text.replace(/\*\*/g, "").split("\n").map((l) => l.replace(/^[・•\-*]\s*/, "").trim()).filter(Boolean);
  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2">
          <span className="shrink-0 text-primary/60">▸</span>
          <GlossaryText text={line} />
        </li>
      ))}
    </ul>
  );
}

export default function IdeaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [idea, setIdea] = useState<IdeaWithEngagement | null>(null);
  const [customIdeaId, setCustomIdeaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    api.ideas.getBySlug(slug)
      .then((data) => {
        setIdea(data);
        // Record view history
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ideaId: data.id }),
        }).catch(() => {});
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !idea) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">アイデアが見つかりません</p>
        <Link href="/feed" className="mt-4 inline-block">
          <Button variant="outline" className="gap-2"><ArrowLeft className="size-4" />フィードに戻る</Button>
        </Link>
      </div>
    );
  }

  const avg = avgScore(idea.scores);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/feed" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />フィードに戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{idea.serviceName}</h1>
            <p className="mt-1 text-base text-muted-foreground">{idea.oneLiner}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AddToCollection ideaId={idea.id} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => document.getElementById("ai-customize")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Wand2 className="size-3.5" />
              <span className="hidden sm:inline">AIカスタマイズ</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => document.getElementById("ai-bizplan")?.scrollIntoView({ behavior: "smooth" })}
            >
              <FileText className="size-3.5" />
              <span className="hidden sm:inline">AIビジネスプラン生成</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="text-[11px]">{idea.category}</Badge>
        <Badge variant="outline" className="text-[11px]">{idea.targetIndustry}</Badge>
        {idea.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-[11px] text-muted-foreground">#{tag}</Badge>
        ))}
        {idea.patterns && idea.patterns.length > 0 && idea.patterns.map((pid) => {
          const p = getPatternById(pid);
          return (
            <Badge
              key={pid}
              variant="outline"
              className="text-[11px] border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
              title={p?.name}
            >
              🧩 {pid}{p ? ` ${p.name}` : ""}
            </Badge>
          );
        })}
      </div>

      {/* Reactions */}
      <ReactionBar
        ideaId={idea.id}
        counts={idea.reactionCounts || {}}
        userReactions={idea.userReactions || []}
      />

      {/* Quality Rating */}
      <IdeaRating ideaId={idea.id} />

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">総合スコア</span>
            <span className={cn("text-3xl font-black", scoreColorClass(avg))}>{avg}</span>
            <span className="text-sm text-muted-foreground">/ 5.0</span>
          </div>
          <IdeaRadarChart scores={idea.scores} />
          <div className="space-y-2.5">
            {(Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key, idx) => (
              <ScoreBar key={key} label={SCORE_LABELS[key]} viewpoint={SCORE_VIEWPOINTS[key]} score={idea.scores[key]} comment={idea.scoreComments[key]} index={idx} />
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-3">
          {(idea.whyNow || idea.noveltyNote || idea.strengthNote) && (
            <div className="space-y-2.5">
              <SectionHeading icon={<Sparkles className="size-3" />}>インサイトパネル</SectionHeading>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {idea.whyNow && (
                  <InsightBox icon={<Clock className="size-2.5" />} label="なぜ今か" color="amber">{idea.whyNow}</InsightBox>
                )}
                {idea.noveltyNote && (
                  <InsightBox icon={<Sparkles className="size-2.5" />} label="何が新しいのか" color="violet">{idea.noveltyNote}</InsightBox>
                )}
                {idea.strengthNote && (
                  <InsightBox icon={<Star className="size-2.5" />} label="何が良いのか" color="emerald">{idea.strengthNote}</InsightBox>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <SectionHeading icon={<FileText className="size-3" />}>アイデア詳細</SectionHeading>
            <DetailBox icon={<Lightbulb className="size-4" />} label="コンセプト・提供価値">{idea.concept}</DetailBox>
            <DetailBox icon={<Target className="size-4" />} label="ターゲット">{idea.target}</DetailBox>
            <DetailBox icon={<Zap className="size-4" />} label="解決する課題">{idea.problem}</DetailBox>
            <DetailBox icon={<Puzzle className="size-4" />} label="プロダクト・サービス内容"><BulletList text={idea.product} /></DetailBox>
            <DetailBox icon={<Coins className="size-4" />} label="収益モデル"><BulletList text={idea.revenueModel} /></DetailBox>
            <DetailBox icon={<Search className="size-4" />} label="類似・競合サービス">{idea.competitors}</DetailBox>
            <DetailBox icon={<Shield className="size-4" />} label="競合優位性">{idea.competitiveEdge}</DetailBox>
          {idea.trendKeywords.length > 0 && (
            <DetailBox icon={<TrendingUp className="size-4" />} label="関連トレンド">
              <div className="flex flex-wrap gap-1.5">
                {idea.trendKeywords.map((kw) => (<Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>))}
              </div>
            </DetailBox>
          )}
        </div>
        </div>
      </div>

      <Separator />

      {/* AI Customize */}
      <div id="ai-customize" className="scroll-mt-20" />
      <CustomizePanel
        ideaId={idea.id}
        ideaName={idea.serviceName}
        onResult={(result) => setCustomIdeaId(result.id)}
      />

      <Separator />

      {/* Business Plan Generation */}
      <div id="ai-bizplan" className="scroll-mt-20">
        <BizPlanPanel
          ideaId={idea.id}
          customIdeaId={customIdeaId || undefined}
          ideaName={idea.serviceName}
        />
      </div>

      <Separator />

      {/* Note */}
      <IdeaNote ideaId={idea.id} />

      <Separator />

      {/* Similar ideas */}
      <SimilarIdeas ideaId={idea.id} />

      <Separator />

      {/* Comments */}
      <CommentSection ideaId={idea.id} initialCount={idea.commentCount} />
    </div>
  );
}

function SimilarIdeas({ ideaId }: { ideaId: string }) {
  const [similar, setSimilar] = useState<IdeaWithEngagement[]>([]);

  useEffect(() => {
    fetch(`/api/ideas/${ideaId}/similar`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSimilar(data); });
  }, [ideaId]);

  if (similar.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-bold">
        <Lightbulb className="size-5 text-primary" />
        似ているアイデア
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {similar.map((idea) => (
          <Link key={idea.id} href={`/ideas/${idea.slug}`}>
            <Card className="gap-0 py-0 transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="p-4">
                <h4 className="font-bold">{idea.serviceName}</h4>
                <p className="mt-0.5 text-sm text-muted-foreground">{idea.oneLiner}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">{idea.category}</Badge>
                  <Badge variant="outline" className="text-[10px]">{idea.targetCustomer}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
