"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, ArrowRight, ArrowLeft, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { CATEGORIES, TARGET_CUSTOMERS } from "@/lib/constants";
import type { IdeaWithEngagement, IdeaScore } from "@/lib/types";
import { MiniRadarChart } from "@/components/ideas/mini-radar-chart";

interface Question {
  id: string;
  title: string;
  description: string;
  options: { value: string; label: string; icon: string }[];
  multiple?: boolean;
}

const questions: Question[] = [
  {
    id: "interest",
    title: "どの領域に興味がありますか？",
    description: "最も関心のある分野を選んでください（複数可）",
    multiple: true,
    options: [
      { value: "AI・データ", label: "AI・データ", icon: "🤖" },
      { value: "金融・決済", label: "金融・決済", icon: "💳" },
      { value: "ヘルスケア・ウェルネス", label: "ヘルスケア", icon: "🏥" },
      { value: "教育・人材", label: "教育・人材", icon: "📚" },
      { value: "生活・消費", label: "生活・消費", icon: "🛍️" },
      { value: "産業・インフラ", label: "産業・インフラ", icon: "🏭" },
      { value: "サステナビリティ", label: "サステナビリティ", icon: "🌱" },
      { value: "エンタメ・クリエイター", label: "エンタメ", icon: "🎮" },
    ],
  },
  {
    id: "customer",
    title: "誰に届けたいですか？",
    description: "メインのターゲット顧客を選んでください",
    options: [
      { value: "中小企業", label: "中小企業", icon: "🏢" },
      { value: "大企業", label: "大企業", icon: "🏛️" },
      { value: "スタートアップ", label: "スタートアップ", icon: "🚀" },
      { value: "フリーランス・副業", label: "フリーランス", icon: "💻" },
      { value: "一般消費者", label: "一般消費者", icon: "👤" },
      { value: "ファミリー層", label: "ファミリー", icon: "👨‍👩‍👧" },
      { value: "Z世代・若年層", label: "Z世代", icon: "🧑‍🎓" },
    ],
  },
  {
    id: "priority",
    title: "何を重視しますか？",
    description: "最も大事にしたいポイントを選んでください",
    options: [
      { value: "novelty", label: "新しさ・独自性", icon: "✨" },
      { value: "marketSize", label: "市場の大きさ", icon: "📈" },
      { value: "feasibility", label: "始めやすさ", icon: "🎯" },
      { value: "growth", label: "成長ポテンシャル", icon: "🌱" },
      { value: "profitability", label: "収益性", icon: "💰" },
      { value: "moat", label: "参入障壁の高さ", icon: "🛡️" },
    ],
  },
  {
    id: "difficulty",
    title: "技術的な難易度は？",
    description: "どのレベルのチャレンジを希望しますか",
    options: [
      { value: "低", label: "手軽に始めたい", icon: "🟢" },
      { value: "中", label: "ある程度の挑戦OK", icon: "🟡" },
      { value: "高", label: "高難度も歓迎", icon: "🔴" },
      { value: "any", label: "こだわらない", icon: "⚪" },
    ],
  },
  {
    id: "style",
    title: "どんなビジネスをやりたい？",
    description: "ビジネスのスタイルを選んでください",
    options: [
      { value: "SaaS", label: "SaaS・サブスク型", icon: "☁️" },
      { value: "プラットフォーム", label: "プラットフォーム", icon: "🌐" },
      { value: "D2C", label: "D2C・モノを売る", icon: "📦" },
      { value: "AI/ML", label: "AI活用サービス", icon: "🤖" },
      { value: "any", label: "こだわらない", icon: "⚪" },
    ],
  },
];

const avgScore = (scores: IdeaScore) =>
  Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / 6) * 10) / 10;

export default function DiagnosisPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [ideas, setIdeas] = useState<IdeaWithEngagement[]>([]);
  const [results, setResults] = useState<IdeaWithEngagement[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.ideas.list().then(setIdeas);
  }, []);

  const currentQ = questions[step];
  const isLastStep = step === questions.length - 1;
  const selectedValues = answers[currentQ?.id] || [];

  const toggleOption = (value: string) => {
    const q = questions[step];
    if (q.multiple) {
      const current = answers[q.id] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [q.id]: next });
    } else {
      setAnswers({ ...answers, [q.id]: [value] });
    }
  };

  const calculateResults = () => {
    setLoading(true);

    const interest = answers.interest || [];
    const customer = answers.customer || [];
    const priority = (answers.priority || [])[0] as keyof IdeaScore | undefined;
    const difficulty = (answers.difficulty || [])[0];
    const style = (answers.style || [])[0];

    // Build category set from selected groups
    const targetCategories = new Set<string>();
    for (const group of interest) {
      CATEGORIES.filter((c) => c.group === group).forEach((c) => targetCategories.add(c.value));
    }

    const scored = ideas.map((idea) => {
      let score = 0;

      // Category match (0-40)
      if (interest.length === 0 || targetCategories.has(idea.category)) score += 40;
      else score += 5;

      // Customer match (0-20)
      if (customer.length === 0 || customer.includes(idea.targetCustomer)) score += 20;
      else score += 3;

      // Priority score boost (0-20)
      if (priority && priority in idea.scores) {
        score += (idea.scores[priority] / 5) * 20;
      } else {
        score += avgScore(idea.scores) / 5 * 15;
      }

      // Difficulty match (0-10)
      if (!difficulty || difficulty === "any" || idea.difficulty === difficulty) score += 10;
      else score += 2;

      // Style match (0-10)
      if (!style || style === "any" || idea.category === style) score += 10;
      else score += 2;

      return { idea, score };
    });

    scored.sort((a, b) => b.score - a.score);
    setResults(scored.slice(0, 5).map((s) => s.idea));
    setLoading(false);
  };

  const handleNext = () => {
    if (isLastStep) {
      calculateResults();
      setStep(step + 1); // Go to results
    } else {
      setStep(step + 1);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
  };

  // Results view
  if (step >= questions.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <Sparkles className="mx-auto mb-3 size-10 text-primary" />
          <h1 className="text-2xl font-bold">あなたにおすすめのアイデア</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            回答に基づいてマッチ度の高い順に表示しています
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {results?.map((idea, idx) => (
              <Link key={idea.id} href={`/ideas/${idea.slug}`}>
                <Card className="gap-0 overflow-hidden py-0 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="flex gap-4 p-0">
                    <div className="flex w-12 shrink-0 items-center justify-center bg-primary/10 text-xl font-black text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex flex-1 items-center gap-4 py-4 pr-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold">{idea.serviceName}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">{idea.oneLiner}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">{idea.category}</Badge>
                          <Badge variant="outline" className="text-[10px]">{idea.targetCustomer}</Badge>
                          <Badge variant="outline" className="text-[10px]">難易度: {idea.difficulty}</Badge>
                        </div>
                      </div>
                      <div className="hidden w-32 shrink-0 sm:block">
                        <MiniRadarChart scores={idea.scores} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="size-4" />
            もう一度診断する
          </Button>
          <Link href="/feed">
            <Button className="gap-2">
              全アイデアを見る
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Question view
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <Compass className="size-5 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          {step + 1} / {questions.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div>
        <h1 className="text-xl font-bold">{currentQ.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{currentQ.description}</p>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {currentQ.options.map((opt) => {
          const selected = selectedValues.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleOption(opt.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="gap-1"
        >
          <ArrowLeft className="size-4" />
          戻る
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedValues.length === 0}
          className="gap-1"
        >
          {isLastStep ? "診断結果を見る" : "次へ"}
          {isLastStep ? <Sparkles className="size-4" /> : <ArrowRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
