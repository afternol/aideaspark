"use client";

import { ExternalLink, BookOpen } from "lucide-react";

interface Source {
  label: string;
  url?: string;
}

export function SourceList({ sources }: { sources?: Source[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-primary/10 bg-primary/[0.02] px-4 py-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-primary">
        <BookOpen className="size-3.5" />
        出典・参考資料（{sources.length}件）
      </p>
      <ol className="space-y-1.5">
        {sources.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
              {i + 1}
            </span>
            <div>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {s.label}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              ) : (
                <span className="text-muted-foreground">{s.label}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FactCheckNotes({ notes }: { notes?: string[] }) {
  if (!notes || notes.length === 0) return null;

  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
      <p className="mb-2 text-xs font-bold text-yellow-700 dark:text-yellow-400">
        ファクトチェック注記
      </p>
      <ul className="space-y-1.5">
        {notes.map((note, i) => (
          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-yellow-800 dark:text-yellow-300">
            <span className="mt-0.5 shrink-0">⚠️</span>
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}
