"use client";

import {
  Target,
  Zap,
  Puzzle,
  Coins,
  Search,
  Shield,
  Lightbulb,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BusinessIdea, IdeaScore } from "@/lib/types";
import { SCORE_LABELS, SCORE_VIEWPOINTS } from "@/lib/types";
import { ScoreBar } from "./score-bar";
import { IdeaRadarChart } from "./idea-radar-chart";
import { AddToCollection } from "@/components/engagement/add-to-collection";

interface IdeaDetailDialogProps {
  idea: BusinessIdea | null;
  open: boolean;
  onClose: () => void;
}

const avgScore = (scores: IdeaScore) => {
  const vals = Object.values(scores);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
};

const scoreColorClass = (n: number) =>
  n >= 4
    ? "text-emerald-600 dark:text-emerald-400"
    : n >= 3
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

function DetailBox({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-primary/40 bg-primary/[0.03] px-4 py-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-primary">
        {icon}
        {label}
      </p>
      <div className="text-[0.95rem] leading-relaxed text-foreground/80">
        {children}
      </div>
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  const lines = text
    .replace(/\*\*/g, "")
    .split("\n")
    .map((l) => l.replace(/^[・•\-*]\s*/, "").trim())
    .filter(Boolean);
  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2">
          <span className="shrink-0 text-primary/60">▸</span>
          {line}
        </li>
      ))}
    </ul>
  );
}

export function IdeaDetailDialog({ idea, open, onClose }: IdeaDetailDialogProps) {
  if (!idea) return null;

  const avg = avgScore(idea.scores);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90dvh] max-w-5xl sm:max-w-5xl flex-col gap-0 overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-xl font-bold">{idea.serviceName}</DialogTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">{idea.oneLiner}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">総合</span>
            <span className={cn("text-2xl font-black", scoreColorClass(avg))}>{avg}</span>
          </div>
          <AddToCollection ideaId={idea.id} />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 border-b px-6 py-2.5">
          <Badge variant="secondary" className="text-[11px]">{idea.category}</Badge>
          {idea.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[11px] text-muted-foreground">#{tag}</Badge>
          ))}
        </div>

        {/* Body */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-5 lg:divide-x">
            {/* Left: Chart + Scores */}
            <div className="flex flex-col gap-4 p-5 lg:col-span-2">
              <IdeaRadarChart scores={idea.scores} />
              <div className="space-y-2.5">
                {(Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key, idx) => (
                  <ScoreBar
                    key={key}
                    label={SCORE_LABELS[key]}
                    viewpoint={SCORE_VIEWPOINTS[key]}
                    score={idea.scores[key]}
                    comment={idea.scoreComments[key]}
                    index={idx}
                  />
                ))}
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-3 p-5 lg:col-span-3">
              <DetailBox icon={<Lightbulb className="size-4" />} label="コンセプト・提供価値">
                {idea.concept}
              </DetailBox>
              <DetailBox icon={<Target className="size-4" />} label="ターゲット">
                {idea.target}
              </DetailBox>
              <DetailBox icon={<Zap className="size-4" />} label="解決する課題">
                {idea.problem}
              </DetailBox>
              <DetailBox icon={<Puzzle className="size-4" />} label="プロダクト・サービス内容">
                <BulletList text={idea.product} />
              </DetailBox>
              <DetailBox icon={<Coins className="size-4" />} label="収益モデル">
                <BulletList text={idea.revenueModel} />
              </DetailBox>
              <DetailBox icon={<Search className="size-4" />} label="類似・競合サービス">
                {idea.competitors}
              </DetailBox>
              <DetailBox icon={<Shield className="size-4" />} label="競合優位性">
                {idea.competitiveEdge}
              </DetailBox>
              {idea.trendKeywords.length > 0 && (
                <DetailBox icon={<TrendingUp className="size-4" />} label="関連トレンド">
                  <div className="flex flex-wrap gap-1.5">
                    {idea.trendKeywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </DetailBox>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
