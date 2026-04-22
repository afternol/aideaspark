"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BusinessIdea, IdeaScore } from "@/lib/types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const avgScore = (s: IdeaScore) =>
  Math.round((Object.values(s).reduce((a, b) => a + b, 0) / 6) * 10) / 10;

const scoreColor = (n: number) =>
  n >= 4 ? "text-emerald-600" : n >= 3 ? "text-yellow-600" : "text-red-600";

export function PersonalPicks() {
  const { data: session } = useSession();
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);

  useEffect(() => {
    if (session?.user) {
      fetch(`${BASE_PATH}/api/recommend`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setIdeas(data); });
    }
  }, [session]);

  if (!session?.user || ideas.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-lg font-bold">あなたへのおすすめ</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {ideas.slice(0, 3).map((idea) => (
          <Link key={idea.id} href={`/ideas/${idea.slug}`}>
            <div className="group overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">{idea.category}</Badge>
                <span className={cn("text-lg font-black", scoreColor(avgScore(idea.scores)))}>
                  {avgScore(idea.scores)}
                </span>
              </div>
              <h3 className="font-bold leading-tight">{idea.serviceName}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{idea.oneLiner}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
