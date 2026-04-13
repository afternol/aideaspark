"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { REACTION_TYPES } from "@/lib/types";
import type { ReactionType } from "@/lib/types";
import { api } from "@/lib/api-client";

interface ReactionBarProps {
  ideaId: string;
  counts: Record<string, number>;
  userReactions: ReactionType[];
}

export function ReactionBar({ ideaId, counts: initialCounts, userReactions: initialUser }: ReactionBarProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(new Set(initialUser));
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (type: ReactionType) => {
    if (loading) return;
    setLoading(type);

    const wasActive = userReactions.has(type);

    // Optimistic update
    const next = new Set(userReactions);
    if (wasActive) next.delete(type);
    else next.add(type);
    setUserReactions(next);
    setCounts((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + (wasActive ? -1 : 1),
    }));

    try {
      await api.reactions.toggle(ideaId, type);
    } catch {
      // Revert on error
      setUserReactions(userReactions);
      setCounts(initialCounts);
    }
    setLoading(null);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REACTION_TYPES.map(({ key, label, emoji }) => {
        const active = userReactions.has(key);
        const count = counts[key] || 0;
        return (
          <button
            key={key}
            onClick={() => handleToggle(key)}
            disabled={loading === key}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
            )}
          >
            <span>{emoji}</span>
            <span>{label}</span>
            {count > 0 && (
              <span className={cn("rounded-full px-1.5 text-[10px] font-bold", active ? "bg-primary/20" : "bg-muted")}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
