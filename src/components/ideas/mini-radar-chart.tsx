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

interface MiniRadarChartProps {
  scores: IdeaScore;
}

export function MiniRadarChart({ scores }: MiniRadarChartProps) {
  const data = (Object.keys(SCORE_LABELS) as (keyof IdeaScore)[]).map((key) => ({
    axis: SCORE_LABELS[key],
    value: scores[key],
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="50%">
        <PolarGrid stroke="var(--color-border)" strokeWidth={0.5} />
        <PolarRadiusAxis
          domain={[0, 5]}
          tickCount={6}
          tick={false}
          axisLine={false}
        />
        <PolarAngleAxis
          dataKey="axis"
          tick={(props) => {
            const { x, y, payload, index } = props as {
              x: number;
              y: number;
              payload: { value: string };
              index: number;
            };
            const score = data[index]?.value ?? 0;
            return (
              <g transform={`translate(${x},${y})`}>
                <text
                  textAnchor="middle"
                  dy={-2}
                  fontSize={14}
                  fill="var(--color-muted-foreground)"
                >
                  {payload.value}
                </text>
                <text
                  textAnchor="middle"
                  dy={14}
                  fontSize={14}
                  fontWeight={800}
                  fill="var(--color-primary)"
                >
                  {score}
                </text>
              </g>
            );
          }}
        />
        <Radar
          dataKey="value"
          stroke="var(--color-primary)"
          fill="var(--color-primary)"
          fillOpacity={0.15}
          strokeWidth={1.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
