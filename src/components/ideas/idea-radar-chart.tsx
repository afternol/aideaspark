"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { IdeaScore } from "@/lib/types";
import { SCORE_LABELS } from "@/lib/types";

interface IdeaRadarChartProps {
  scores: IdeaScore;
}

export function IdeaRadarChart({ scores }: IdeaRadarChartProps) {
  const data = (Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key) => ({
    axis: SCORE_LABELS[key],
    value: scores[key],
    fullMark: 5,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
          tickCount={6}
        />
        <Radar
          dataKey="value"
          stroke="var(--color-primary)"
          fill="var(--color-primary)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
