"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Wand2,
  FileText,
  Loader2,
  Trash2,
  ArrowRight,
  Lightbulb,
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Target,
  Zap,
  Puzzle,
  Coins,
  Search,
  Shield,
  FolderHeart,
  Plus,
  FileDown,
  History,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { IdeaRadarChart } from "@/components/ideas/idea-radar-chart";
import { ScoreBar } from "@/components/ideas/score-bar";
import { SCORE_VIEWPOINTS } from "@/lib/types";
import { SourceList, FactCheckNotes } from "@/components/ai/source-list";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getSessionId } from "@/lib/session";
import { exportCustomIdeaPDF } from "@/lib/export-pdf";
import { exportCustomIdeaDocx } from "@/lib/export-docx";
import { exportPlanPDF } from "@/lib/export-plan-pdf";
import { exportPlanDocx } from "@/lib/export-plan-docx";
import type { IdeaScore } from "@/lib/types";
import { SCORE_LABELS } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const scoreColor = (n: number) =>
  n >= 4 ? "text-emerald-600" : n >= 3 ? "text-yellow-600" : "text-red-600";

const avgScore = (s: IdeaScore) =>
  Math.round((Object.values(s).reduce((a, b) => a + b, 0) / 6) * 10) / 10;

interface CustomIdea {
  id: string;
  baseIdeaId: string;
  baseIdea: { id: string; slug: string; serviceName: string } | null;
  conditions: { notes?: string };
  result: {
    serviceName: string;
    oneLiner: string;
    concept: string;
    target: string;
    problem?: string;
    product?: string;
    revenueModel: string;
    competitors?: string;
    competitiveEdge: string;
    scores: IdeaScore;
    changes: string[];
  };
  hasPlan: boolean;
  createdAt: string;
}

interface Plan {
  id: string;
  baseIdeaId: string;
  serviceName: string;
  sourceSlug: string;
  isCustom: boolean;
  content: {
    executiveSummary?: string;
    leanCanvas?: Record<string, string>;
    marketAnalysis?: { overview?: string; tam?: string; sam?: string; som?: string; trends?: string };
    competitorAnalysis?: { overview?: string; competitors?: { name: string; strength: string; weakness: string }[]; positioning?: string };
    businessModel?: { revenueModel?: string; pricing?: string; unitEconomics?: string };
    roadmap?: { phase: string; goals: string; actions: string; kpi: string }[];
    risks?: { risk: string; impact: string; mitigation: string }[];
  };
  createdAt: string;
}

interface CollectionData {
  id: string;
  name: string;
  items: { id: string; ideaId: string }[];
}

interface IdeaBasic {
  id: string;
  slug: string;
  serviceName: string;
  oneLiner: string;
  category: string;
}

// Group items by baseIdeaId into slots
function groupByBase<T extends { baseIdeaId: string; id: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.baseIdeaId || item.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

export default function MyIdeasPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [customIdeas, setCustomIdeas] = useState<CustomIdea[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [allIdeas, setAllIdeas] = useState<IdeaBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = async () => {
    setLoadError(false);
    try {
      const sid = getSessionId();
      const [myRes, colRes, ideasRes] = await Promise.all([
        fetch(`${BASE_PATH}/api/my-ideas?sessionId=${sid}`).then((r) => r.json()),
        fetch(`${BASE_PATH}/api/collections?sessionId=${sid}`).then((r) => r.json()),
        fetch(`${BASE_PATH}/api/ideas`).then((r) => r.json()),
      ]);
      if (myRes.customIdeas) setCustomIdeas(myRes.customIdeas);
      if (myRes.plans) setPlans(myRes.plans);
      if (Array.isArray(colRes)) setCollections(colRes);
      if (Array.isArray(ideasRes)) setAllIdeas(ideasRes);
    } catch (e) {
      console.error("[my-ideas] fetch error:", e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (type: "custom" | "plan", id: string) => {
    await fetch(`${BASE_PATH}/api/my-ideas`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, sessionId: getSessionId() }),
    });
    await load();
  };

  // Group into slots (already sorted desc by API)
  const customSlots = useMemo(() => groupByBase(customIdeas), [customIdeas]);
  const planSlots = useMemo(() => groupByBase(plans), [plans]);
  const uniqueCustomCount = customSlots.size;
  const uniquePlanCount = planSlots.size;

  if (loading || sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 size-10 text-destructive/50" />
          <p className="font-medium text-destructive">データの読み込みに失敗しました</p>
          <p className="mt-1 text-sm text-muted-foreground">ネットワーク接続を確認してください</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={load}>
            再読み込み
          </Button>
        </div>
      </div>
    );
  }

  const isGuest = sessionStatus === "unauthenticated";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Lightbulb className="size-6 text-primary" />
          マイアイデア
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          保存したアイデア・AIカスタマイズ・ビジネスプラン
        </p>
      </div>

      {/* ゲストバナー */}
      {isGuest && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">ゲストとして閲覧中</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ログインするとAIカスタマイズ・プランをアカウントに保存し、どこからでも確認できます
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/login">
              <Button size="sm" className="gap-1.5">
                <LogIn className="size-3.5" />ログイン
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" variant="outline" className="gap-1.5">
                <UserPlus className="size-3.5" />新規登録
              </Button>
            </Link>
          </div>
        </div>
      )}

      <Tabs defaultValue="custom">
        <TabsList className="w-full">
          <TabsTrigger value="custom" className="flex-1 gap-1.5">
            <Wand2 className="size-4" />
            カスタマイズ版
            {uniqueCustomCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px]">{uniqueCustomCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex-1 gap-1.5">
            <FileText className="size-4" />
            ビジネスプラン
            {uniquePlanCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px]">{uniquePlanCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex-1 gap-1.5">
            <FolderHeart className="size-4" />
            コレクション
            {collections.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px]">{collections.reduce((s, c) => s + c.items.length, 0)}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Custom Ideas Tab - Slot view */}
        <TabsContent value="custom" className="mt-4 space-y-4">
          {uniqueCustomCount === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Wand2 className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="font-medium">まだカスタマイズ版がありません</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  以下の手順でオリジナルアイデアを作成できます
                </p>
                <ol className="mx-auto mt-4 max-w-xs space-y-2 text-left text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                    アイデア一覧でアイデアを選ぶ
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                    詳細ページの「AIカスタマイズ」を押す
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                    条件を入力してAI生成 → ここに保存される
                  </li>
                </ol>
                <Link href="/feed" className="mt-5 inline-block">
                  <Button size="sm" className="gap-1.5">
                    アイデアを探す <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
                {isGuest && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <Link href="/login" className="font-medium text-primary hover:underline">ログイン</Link>
                    {" "}または{" "}
                    <Link href="/register" className="font-medium text-primary hover:underline">新規登録</Link>
                    {" "}でデータをアカウントに保存
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            [...customSlots.entries()].map(([baseId, versions]) => (
              <CustomSlotCard key={baseId} versions={versions} onDelete={(id) => handleDelete("custom", id)} onPlanGenerated={load} />
            ))
          )}
        </TabsContent>

        {/* Business Plans Tab - Slot view */}
        <TabsContent value="plans" className="mt-4 space-y-4">
          {uniquePlanCount === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <FileText className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="font-medium">まだビジネスプランがありません</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  以下の手順でビジネスプランを作成できます
                </p>
                <ol className="mx-auto mt-4 max-w-xs space-y-2 text-left text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                    アイデア一覧でアイデアを選ぶ
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                    詳細ページの「AIビジネスプラン生成」を押す
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                    生成されたプランが自動でここに保存される
                  </li>
                </ol>
                <Link href="/feed" className="mt-5 inline-block">
                  <Button size="sm" className="gap-1.5">
                    アイデアを探す <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
                {isGuest && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <Link href="/login" className="font-medium text-primary hover:underline">ログイン</Link>
                    {" "}または{" "}
                    <Link href="/register" className="font-medium text-primary hover:underline">新規登録</Link>
                    {" "}でデータをアカウントに保存
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            [...planSlots.entries()].map(([baseId, versions]) => (
              <PlanSlotCard key={baseId} versions={versions} onDelete={(id) => handleDelete("plan", id)} />
            ))
          )}
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="mt-4 space-y-4">
          <CollectionsTab collections={collections} allIdeas={allIdeas} onReload={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== Version Selector =====
function VersionSelector<T extends { id: string; createdAt: string }>({
  versions,
  selectedIndex,
  onSelect,
}: {
  versions: T[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  if (versions.length <= 1) return null;
  return (
    <div className="flex items-center gap-1.5">
      <History className="size-3.5 text-muted-foreground" />
      <select
        value={selectedIndex}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="rounded border bg-background px-2 py-1 text-xs text-foreground outline-none"
      >
        {versions.map((v, i) => (
          <option key={v.id} value={i}>
            v{versions.length - i}{i === 0 ? "（最新）" : ""} — {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true, locale: ja })}
          </option>
        ))}
      </select>
    </div>
  );
}

// ===== Custom Idea Slot Card =====
function CustomSlotCard({ versions, onDelete, onPlanGenerated }: { versions: CustomIdea[]; onDelete: (id: string) => void; onPlanGenerated: () => void }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [recustomizing, setRecustomizing] = useState(false);
  const [recustomizeText, setRecustomizeText] = useState("");
  const [recustomizeLoading, setRecustomizeLoading] = useState(false);
  const [recustomizeError, setRecustomizeError] = useState("");
  const item = versions[selectedIdx];
  const r = item.result;
  const scores = r.scores || { novelty: 0, marketSize: 0, profitability: 0, growth: 0, feasibility: 0, moat: 0 };
  const avg = avgScore(scores);

  const handleRecustomize = async () => {
    if (!recustomizeText.trim()) return;
    setRecustomizeLoading(true);
    setRecustomizeError("");
    try {
      const res = await fetch(`${BASE_PATH}/api/ai-customize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customIdeaId: item.id,
          conditions: { notes: recustomizeText },
          sessionId: getSessionId(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setRecustomizeError(d.error || `生成に失敗しました (${res.status})`);
        return;
      }
      setRecustomizeText("");
      setRecustomizing(false);
      onPlanGenerated(); // reload to show new version
    } catch (e: any) {
      setRecustomizeError(`通信エラー: ${e.message}`);
    } finally {
      setRecustomizeLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    setPlanError("");
    try {
      const res = await fetch(`${BASE_PATH}/api/ai-bizplan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customIdeaId: item.id,
          sessionId: getSessionId(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setPlanError(d.error || `生成に失敗しました (${res.status})`);
        return;
      }
      const data = await res.json();
      setGeneratedPlan(data);
      setExpanded(true);
      onPlanGenerated();
    } catch (e: any) {
      setPlanError(`通信エラー: ${e.message}`);
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold">{r.serviceName}</h3>
              <Badge variant="secondary" className="text-[10px]">カスタマイズ版</Badge>
              {versions.length > 1 && (
                <Badge variant="outline" className="text-[10px]">v{versions.length - selectedIdx} / {versions.length}版</Badge>
              )}
              {item.hasPlan && <Badge variant="outline" className="text-[10px]">プラン生成済み</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{r.oneLiner}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)} className="gap-1 text-xs">
              {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              {expanded ? "閉じる" : "詳細"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => exportCustomIdeaPDF(r, item.baseIdea?.serviceName, item.conditions.notes)}
            >
              <FileDown className="size-3.5" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => exportCustomIdeaDocx(r, item.baseIdea?.serviceName, item.conditions.notes)}
            >
              <FileDown className="size-3.5" />
              Word
            </Button>
            <button onClick={() => onDelete(item.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {/* Meta + Version selector */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {item.baseIdea && (
            <Link href={`/ideas/${item.baseIdea.slug}`} className="flex items-center gap-1 text-primary hover:underline">
              元: {item.baseIdea.serviceName} <ExternalLink className="size-3" />
            </Link>
          )}
          {item.conditions.notes && (
            <span className="rounded bg-muted/50 px-2 py-0.5">条件: {item.conditions.notes.substring(0, 40)}{item.conditions.notes.length > 40 ? "..." : ""}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ja })}
          </span>
        </div>

        {/* Version selector + Actions */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {versions.length > 1 && (
            <VersionSelector versions={versions} selectedIndex={selectedIdx} onSelect={setSelectedIdx} />
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => { setRecustomizing(!recustomizing); setRecustomizeError(""); }}
          >
            <Wand2 className="size-3.5" />
            再カスタマイズ
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 text-xs"
            disabled={planLoading}
            onClick={handleGeneratePlan}
          >
            {planLoading ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
            {planLoading ? "プラン生成中..." : "プラン生成"}
          </Button>
          {planLoading && (
            <span className="text-xs text-muted-foreground">AIが分析しています...</span>
          )}
          {planError && <span className="text-xs text-destructive">{planError}</span>}
        </div>

        {/* Inline re-customize form */}
        {recustomizing && (
          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/[0.02] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs">
              <Wand2 className="size-3.5 text-primary" />
              <span>
                <span className="font-medium text-primary">v{versions.length - selectedIdx} {r.serviceName}</span>
                をベースにカスタマイズ
              </span>
            </div>
            <textarea
              value={recustomizeText}
              onChange={(e) => setRecustomizeText(e.target.value)}
              placeholder={"変えたい点を入力してください。\n\n例:\n・ターゲットをもっと絞りたい\n・価格帯を下げたい\n・BtoBに変えたい"}
              className="w-full resize-none rounded-lg border bg-background px-4 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/30 focus:ring-2 focus:ring-ring/20"
              rows={4}
            />
            {recustomizeError && <p className="mt-1 text-xs text-destructive">{recustomizeError}</p>}
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" onClick={handleRecustomize} disabled={recustomizeLoading || !recustomizeText.trim()} className="gap-1.5">
                {recustomizeLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                {recustomizeLoading ? "カスタマイズ中..." : "AIでカスタマイズ"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRecustomizing(false)}>
                キャンセル
              </Button>
            </div>
          </div>
        )}

        {/* Changes */}
        {r.changes && r.changes.length > 0 && (
          <div className="mt-3 rounded-lg bg-primary/5 p-3">
            <p className="mb-1.5 text-xs font-bold text-primary">主な変更点</p>
            <ul className="space-y-1">
              {r.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <ArrowRight className="mt-0.5 size-3 shrink-0 text-primary" />{change}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t">
          <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-5">
            <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 lg:col-span-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">総合スコア</span>
                <span className={cn("text-3xl font-black", scoreColor(avg))}>{avg}</span>
                <span className="text-sm text-muted-foreground">/ 5.0</span>
              </div>
              <IdeaRadarChart scores={scores} />
              <div className="space-y-2.5">
                {(Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key, idx) => (
                  <ScoreBar key={key} label={SCORE_LABELS[key]} viewpoint={SCORE_VIEWPOINTS[key]} score={scores[key]} index={idx} />
                ))}
              </div>
            </div>
            <div className="space-y-3 lg:col-span-3">
              <DetailBox icon={<Lightbulb className="size-4" />} label="コンセプト・提供価値">{r.concept}</DetailBox>
              <DetailBox icon={<Target className="size-4" />} label="ターゲット">{r.target}</DetailBox>
              {r.problem && <DetailBox icon={<Zap className="size-4" />} label="解決する課題">{r.problem}</DetailBox>}
              {r.product && <DetailBox icon={<Puzzle className="size-4" />} label="プロダクト・サービス内容"><BulletList text={r.product} /></DetailBox>}
              {r.revenueModel && <DetailBox icon={<Coins className="size-4" />} label="収益モデル"><BulletList text={r.revenueModel} /></DetailBox>}
              {r.competitors && <DetailBox icon={<Search className="size-4" />} label="類似・競合サービス">{r.competitors}</DetailBox>}
              {r.competitiveEdge && <DetailBox icon={<Shield className="size-4" />} label="競合優位性">{r.competitiveEdge}</DetailBox>}
            </div>
          </div>

          {/* Generated Plan inline */}
          {generatedPlan && (
            <div className="border-t p-5">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <FileText className="size-5 text-primary" />
                生成されたビジネスプラン
              </h4>
              <InlinePlanView content={generatedPlan} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ===== Inline Plan View (reusable) =====
function InlinePlanView({ content: c }: { content: any }) {
  const lc = c.leanCanvas;
  return (
    <div className="space-y-0 divide-y">
      {/* Executive Summary */}
      {c.executiveSummary && (
        <div className="pb-3">
          <p className="mb-1 text-xs font-bold text-primary">エグゼクティブサマリー</p>
          <p className="text-sm leading-relaxed">{c.executiveSummary}</p>
        </div>
      )}

      {/* Lean Canvas */}
      {lc && (
        <Section title="リーンキャンバス" defaultOpen>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {Object.entries({
              "課題": lc.problem, "解決策": lc.solution, "独自の価値提案": lc.uniqueValue,
              "顧客セグメント": lc.customerSegments, "チャネル": lc.channels, "収益の流れ": lc.revenueStreams,
              "コスト構造": lc.costStructure, "主要指標": lc.keyMetrics, "圧倒的優位性": lc.unfairAdvantage,
            }).filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-1 text-xs font-bold text-primary">{label}</p>
                <p className="text-xs leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Market Analysis */}
      {c.marketAnalysis && (
        <Section title="市場分析">
          <div className="space-y-2 text-xs">
            {c.marketAnalysis.overview && <p className="leading-relaxed">{c.marketAnalysis.overview}</p>}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {c.marketAnalysis.tam && <div className="rounded-lg border p-2"><p className="font-bold text-primary">TAM</p><p className="mt-1">{c.marketAnalysis.tam}</p></div>}
              {c.marketAnalysis.sam && <div className="rounded-lg border p-2"><p className="font-bold text-primary">SAM</p><p className="mt-1">{c.marketAnalysis.sam}</p></div>}
              {c.marketAnalysis.som && <div className="rounded-lg border p-2"><p className="font-bold text-primary">SOM</p><p className="mt-1">{c.marketAnalysis.som}</p></div>}
            </div>
            <SourceList sources={c.marketAnalysis.sources} />
          </div>
        </Section>
      )}

      {/* Competitor Analysis */}
      {c.competitorAnalysis && (
        <Section title="競合分析">
          <div className="space-y-2 text-xs">
            {c.competitorAnalysis.overview && <p className="leading-relaxed">{c.competitorAnalysis.overview}</p>}
            {c.competitorAnalysis.competitors && c.competitorAnalysis.competitors.length > 0 && (
              <table className="w-full text-xs">
                <thead><tr className="border-b bg-muted/30"><th className="px-2 py-1.5 text-left font-bold">競合</th><th className="px-2 py-1.5 text-left font-bold">強み</th><th className="px-2 py-1.5 text-left font-bold">弱み</th></tr></thead>
                <tbody>{c.competitorAnalysis.competitors.map((comp: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="px-2 py-1.5 font-medium">
                      {comp.url ? <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{comp.name} ↗</a> : comp.name}
                    </td>
                    <td className="px-2 py-1.5">{comp.strength}</td>
                    <td className="px-2 py-1.5">{comp.weakness}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            <SourceList sources={c.competitorAnalysis.sources} />
          </div>
        </Section>
      )}

      {/* Business Model */}
      {c.businessModel && (
        <Section title="ビジネスモデル">
          <div className="space-y-2 text-xs">
            {c.businessModel.revenueModel && <div><p className="font-bold text-primary">収益モデル</p><p className="mt-1 leading-relaxed">{c.businessModel.revenueModel}</p></div>}
            {c.businessModel.pricing && <div><p className="font-bold text-primary">価格設定</p><p className="mt-1 leading-relaxed">{c.businessModel.pricing}</p></div>}
            {c.businessModel.unitEconomics && <div><p className="font-bold text-primary">ユニットエコノミクス</p><p className="mt-1 leading-relaxed">{c.businessModel.unitEconomics}</p></div>}
            <SourceList sources={c.businessModel.sources} />
          </div>
        </Section>
      )}

      {/* Roadmap */}
      {c.roadmap && c.roadmap.length > 0 && (
        <Section title="実行ロードマップ">
          <div className="space-y-2">
            {c.roadmap.map((phase: any, i: number) => (
              <div key={i} className="rounded-lg border p-3">
                <Badge variant="secondary" className="mb-1.5 text-xs">{phase.phase}</Badge>
                <div className="space-y-1 text-xs">
                  <div><span className="font-bold text-primary">目標:</span> {phase.goals}</div>
                  <div><span className="font-bold text-primary">アクション:</span> {phase.actions}</div>
                  <div><span className="font-bold text-primary">KPI:</span> {phase.kpi}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Risks */}
      {c.risks && c.risks.length > 0 && (
        <Section title="リスクと対策">
          <div className="space-y-2">
            {c.risks.map((r: any, i: number) => (
              <div key={i} className="flex gap-2 rounded-lg border p-3">
                <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", r.impact === "高" ? "text-red-500" : r.impact === "中" ? "text-yellow-500" : "text-blue-500")} />
                <div className="text-xs">
                  <span className="font-bold">{r.risk}</span>
                  <Badge variant="outline" className={cn("ml-2 text-[9px]", r.impact === "高" ? "text-red-500" : r.impact === "中" ? "text-yellow-500" : "text-blue-500")}>影響度: {r.impact}</Badge>
                  <p className="mt-1 text-muted-foreground">対策: {r.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Fact Check */}
      {c.factCheckNotes && <div className="pt-3"><FactCheckNotes notes={c.factCheckNotes} /></div>}
    </div>
  );
}

// ===== Plan Slot Card =====
function PlanSlotCard({ versions, onDelete }: { versions: Plan[]; onDelete: (id: string) => void }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const plan = versions[selectedIdx];
  const c = plan.content;
  const lc = c.leanCanvas;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="size-5 text-primary" />
              <h3 className="text-lg font-bold">{plan.serviceName}</h3>
              {plan.isCustom && <Badge variant="outline" className="text-[10px]">カスタマイズ版</Badge>}
              {versions.length > 1 && (
                <Badge variant="outline" className="text-[10px]">v{versions.length - selectedIdx} / {versions.length}版</Badge>
              )}
            </div>
            {c.executiveSummary && (
              <p className="mt-1 text-sm text-muted-foreground">{c.executiveSummary}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {plan.sourceSlug && (
                <Link href={`/ideas/${plan.sourceSlug}`} className="text-xs text-primary hover:underline">元のアイデアを見る →</Link>
              )}
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="size-3" />
                {formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true, locale: ja })}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)} className="gap-1 text-xs">
              {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              {expanded ? "閉じる" : "詳細を見る"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => exportPlanPDF(plan.serviceName, c, plan.isCustom)}
            >
              <FileDown className="size-3.5" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => exportPlanDocx(plan.serviceName, c, plan.isCustom)}
            >
              <FileDown className="size-3.5" />
              Word
            </Button>
            <button onClick={() => onDelete(plan.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {/* Version selector */}
        {versions.length > 1 && (
          <div className="mt-3">
            <VersionSelector versions={versions} selectedIndex={selectedIdx} onSelect={setSelectedIdx} />
          </div>
        )}
      </CardContent>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t">
          {lc && (
            <Section title="リーンキャンバス" defaultOpen>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {Object.entries({
                  "課題": lc.problem, "解決策": lc.solution, "独自の価値提案": lc.uniqueValue,
                  "顧客セグメント": lc.customerSegments, "チャネル": lc.channels, "収益の流れ": lc.revenueStreams,
                  "コスト構造": lc.costStructure, "主要指標": lc.keyMetrics, "圧倒的優位性": lc.unfairAdvantage,
                }).filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="rounded-lg border bg-muted/20 p-3">
                    <p className="mb-1 text-xs font-bold text-primary">{label}</p>
                    <p className="text-xs leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {c.marketAnalysis && (
            <Section title="市場分析">
              <div className="space-y-2 text-xs">
                {c.marketAnalysis.overview && <p className="leading-relaxed">{c.marketAnalysis.overview}</p>}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {c.marketAnalysis.tam && <div className="rounded-lg border p-2"><p className="font-bold text-primary">TAM</p><p className="mt-1">{c.marketAnalysis.tam}</p></div>}
                  {c.marketAnalysis.sam && <div className="rounded-lg border p-2"><p className="font-bold text-primary">SAM</p><p className="mt-1">{c.marketAnalysis.sam}</p></div>}
                  {c.marketAnalysis.som && <div className="rounded-lg border p-2"><p className="font-bold text-primary">SOM</p><p className="mt-1">{c.marketAnalysis.som}</p></div>}
                </div>
                {c.marketAnalysis.trends && <div><p className="font-bold text-primary">トレンド</p><p className="mt-1 leading-relaxed">{c.marketAnalysis.trends}</p></div>}
                <SourceList sources={(c.marketAnalysis as any).sources} />
              </div>
            </Section>
          )}
          {c.competitorAnalysis && (
            <Section title="競合分析">
              <div className="space-y-2 text-xs">
                {c.competitorAnalysis.overview && <p className="leading-relaxed">{c.competitorAnalysis.overview}</p>}
                {c.competitorAnalysis.competitors && c.competitorAnalysis.competitors.length > 0 && (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b bg-muted/30"><th className="px-2 py-1.5 text-left font-bold">競合</th><th className="px-2 py-1.5 text-left font-bold">強み</th><th className="px-2 py-1.5 text-left font-bold">弱み</th></tr></thead>
                    <tbody>{c.competitorAnalysis.competitors.map((comp, i) => (
                      <tr key={i} className="border-b"><td className="px-2 py-1.5 font-medium">{comp.name}</td><td className="px-2 py-1.5">{comp.strength}</td><td className="px-2 py-1.5">{comp.weakness}</td></tr>
                    ))}</tbody>
                  </table>
                )}
                {c.competitorAnalysis.positioning && <div><p className="font-bold text-primary">ポジショニング</p><p className="mt-1 leading-relaxed">{c.competitorAnalysis.positioning}</p></div>}
                <SourceList sources={(c.competitorAnalysis as any).sources} />
              </div>
            </Section>
          )}
          {c.businessModel && (
            <Section title="ビジネスモデル">
              <div className="space-y-2 text-xs">
                {c.businessModel.revenueModel && <div><p className="font-bold text-primary">収益モデル</p><p className="mt-1 leading-relaxed">{c.businessModel.revenueModel}</p></div>}
                {c.businessModel.pricing && <div><p className="font-bold text-primary">価格設定</p><p className="mt-1 leading-relaxed">{c.businessModel.pricing}</p></div>}
                {c.businessModel.unitEconomics && <div><p className="font-bold text-primary">ユニットエコノミクス</p><p className="mt-1 leading-relaxed">{c.businessModel.unitEconomics}</p></div>}
                <SourceList sources={(c.businessModel as any).sources} />
              </div>
            </Section>
          )}
          {c.roadmap && c.roadmap.length > 0 && (
            <Section title="実行ロードマップ">
              <div className="space-y-2">
                {c.roadmap.map((phase, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <Badge variant="secondary" className="mb-1.5 text-xs">{phase.phase}</Badge>
                    <div className="space-y-1 text-xs">
                      <div><span className="font-bold text-primary">目標:</span> {phase.goals}</div>
                      <div><span className="font-bold text-primary">アクション:</span> {phase.actions}</div>
                      <div><span className="font-bold text-primary">KPI:</span> {phase.kpi}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {c.risks && c.risks.length > 0 && (
            <Section title="リスクと対策">
              <div className="space-y-2">
                {c.risks.map((r, i) => (
                  <div key={i} className="flex gap-2 rounded-lg border p-3">
                    <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", r.impact === "高" ? "text-red-500" : r.impact === "中" ? "text-yellow-500" : "text-blue-500")} />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{r.risk}</span>
                        <Badge variant="outline" className={cn("text-[9px]", r.impact === "高" ? "text-red-500" : r.impact === "中" ? "text-yellow-500" : "text-blue-500")}>影響度: {r.impact}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">対策: {r.mitigation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {(c as any).factCheckNotes && (
            <div className="px-4 pb-4">
              <FactCheckNotes notes={(c as any).factCheckNotes} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ===== Shared components =====
function DetailBox({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-primary/40 bg-primary/[0.03] px-4 py-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-primary">{icon}{label}</p>
      <div className="text-sm leading-relaxed text-foreground/80">{children}</div>
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  const lines = (text || "").replace(/\*\*/g, "").split("\n").map((l) => l.replace(/^[・•\-*]\s*/, "").trim()).filter(Boolean);
  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2"><span className="shrink-0 text-primary/60">▸</span>{line}</li>
      ))}
    </ul>
  );
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b last:border-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-muted/30">
        {open ? <ChevronDown className="size-4 text-primary" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        {title}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

// ===== Collections Tab =====
function CollectionsTab({ collections, allIdeas, onReload }: { collections: CollectionData[]; allIdeas: IdeaBasic[]; onReload: () => Promise<void> }) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    await fetch(`${BASE_PATH}/api/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId(), name: newName }),
    });
    setNewName("");
    setCreating(false);
    await onReload();
  };

  const handleDeleteCollection = async (id: string) => {
    await fetch(`${BASE_PATH}/api/collections`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, sessionId: getSessionId() }),
    });
    await onReload();
  };

  const handleRemoveItem = async (collectionId: string, ideaId: string) => {
    await fetch(`${BASE_PATH}/api/collections/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId, ideaId }),
    });
    await onReload();
  };

  const exportCSV = () => {
    const rows = [["コレクション", "アイデア名", "概要", "カテゴリ"]];
    for (const col of collections) {
      for (const item of col.items) {
        const idea = allIdeas.find((i) => i.id === item.ideaId);
        if (idea) rows.push([col.name, idea.serviceName, idea.oneLiner, idea.category]);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aideaspark-collections-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          placeholder="新しいコレクション名..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="max-w-xs"
        />
        <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || creating}>
          <Plus className="mr-1 size-4" />作成
        </Button>
        {collections.some((c) => c.items.length > 0) && (
          <Button variant="outline" size="sm" onClick={exportCSV} className="ml-auto gap-1.5">
            <FileDown className="size-4" />CSV
          </Button>
        )}
      </div>
      {collections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <FolderHeart className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="font-medium">コレクションがありません</p>
            <ol className="mx-auto mt-4 max-w-xs space-y-2 text-left text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                上の入力欄にコレクション名を入力して「作成」
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                アイデア詳細ページの「コレクションに追加」で登録
              </li>
            </ol>
            <Link href="/feed" className="mt-5 inline-block">
              <Button size="sm" className="gap-1.5">
                アイデアを探す <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        collections.map((col) => {
          const colIdeas = col.items.map((item) => allIdeas.find((i) => i.id === item.ideaId)).filter(Boolean) as IdeaBasic[];
          return (
            <Card key={col.id} className="gap-0 py-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <FolderHeart className="size-4 text-primary" />
                  <span className="font-bold">{col.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{col.items.length}件</span>
                </div>
                <button onClick={() => handleDeleteCollection(col.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <CardContent className="p-2">
                {colIdeas.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">アイデア詳細ページからこのコレクションに追加できます</p>
                ) : (
                  <div className="space-y-1">
                    {colIdeas.map((idea) => (
                      <div key={idea.id} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
                        <Link href={`/ideas/${idea.slug}`} className="min-w-0 flex-1">
                          <span className="text-sm font-medium hover:text-primary">{idea.serviceName}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{idea.oneLiner}</span>
                        </Link>
                        <button onClick={() => handleRemoveItem(col.id, idea.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </>
  );
}
