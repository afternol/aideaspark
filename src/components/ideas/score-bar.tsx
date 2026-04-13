import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  viewpoint: string;
  score: number;
  comment?: string;
  index: number;
}

const scoreColor = (n: number) =>
  n >= 4 ? "text-emerald-600 dark:text-emerald-400" : n >= 3 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";

const barColor = (n: number) =>
  n >= 4 ? "bg-emerald-500" : n >= 3 ? "bg-yellow-500" : "bg-red-500";

const circledNumbers = ["\u2460", "\u2461", "\u2462", "\u2463", "\u2464", "\u2465"];

export function ScoreBar({ label, viewpoint, score, comment, index }: ScoreBarProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {circledNumbers[index]} {label}
          <span className="ml-2 text-[11px] font-normal text-muted-foreground">
            {viewpoint}
          </span>
        </span>
        <span className={cn("text-sm font-bold", scoreColor(score))}>
          {score}/5
        </span>
      </div>
      <div className="score-bar">
        <div
          className={cn("score-bar-fill", barColor(score))}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      {comment && (
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {comment}
        </p>
      )}
    </div>
  );
}
