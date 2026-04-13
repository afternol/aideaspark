"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORY_GROUPS } from "@/lib/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const emojis: Record<string, string> = {
    "ビジネスモデル": "💼", "AI・データ": "🤖", "金融・決済": "💳",
    "ヘルスケア・ウェルネス": "🏥", "教育・人材": "📚", "生活・消費": "🛍️",
    "産業・インフラ": "🏭", "サステナビリティ": "🌱", "エンタメ・クリエイター": "🎮",
    "先端テクノロジー": "🔬",
  };

  const toggle = (g: string) => {
    setSelected((prev) => prev.includes(g) ? prev.filter((v) => v !== g) : [...prev, g]);
  };

  const handleComplete = async () => {
    setLoading(true);
    await fetch("/api/mypage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests: selected, onboarded: true }),
    });
    router.push(selected.length > 0 ? "/diagnosis" : "/feed");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="text-center">
        <Sparkles className="mx-auto mb-3 size-10 text-primary" />
        <h1 className="text-2xl font-bold">ようこそ BizIdea へ</h1>
        <p className="mt-2 text-muted-foreground">
          興味のある領域を選んでください。あなたに合ったアイデアを優先表示します。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORY_GROUPS.map((g) => {
          const active = selected.includes(g);
          return (
            <button
              key={g}
              onClick={() => toggle(g)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                active
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              {active && <Check className="absolute -right-1 -top-1 size-5 rounded-full bg-primary p-0.5 text-primary-foreground" />}
              <span className="text-2xl">{emojis[g] || "📊"}</span>
              <span className="text-sm font-medium">{g}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="ghost" onClick={() => { handleComplete(); }}>
          スキップ
        </Button>
        <Button onClick={handleComplete} disabled={loading} className="gap-2 px-8">
          {selected.length > 0 ? "アイデア診断へ" : "はじめる"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
