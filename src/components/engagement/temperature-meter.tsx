"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemperatureMeterProps {
  reactionCount: number;
  compact?: boolean;
}

export function TemperatureMeter({ reactionCount, compact }: TemperatureMeterProps) {
  // 0 reactions = cold, 25+ = max heat
  const heat = Math.min(reactionCount / 25, 1);
  const level =
    heat >= 0.8 ? "HOT" : heat >= 0.5 ? "WARM" : heat >= 0.2 ? "COOL" : "NEW";
  const colorClass =
    heat >= 0.8
      ? "text-red-500"
      : heat >= 0.5
        ? "text-orange-500"
        : heat >= 0.2
          ? "text-yellow-500"
          : "text-blue-400";

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Flame className={cn("size-3.5", colorClass)} />
        <span className={cn("text-xs font-bold", colorClass)}>{reactionCount}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Flame className={cn("size-5", colorClass)} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className={cn("text-xs font-bold", colorClass)}>{level}</span>
          <span className="text-xs text-muted-foreground">{reactionCount} リアクション</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              heat >= 0.8 ? "bg-red-500" : heat >= 0.5 ? "bg-orange-500" : heat >= 0.2 ? "bg-yellow-500" : "bg-blue-400"
            )}
            style={{ width: `${Math.max(heat * 100, 5)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
