"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";

const LABELS = [
  { key: "isNovel",    emoji: "✦", text: "新規性が高い" },
  { key: "isTimely",   emoji: "⚡", text: "タイミングが良い" },
  { key: "isFeasible", emoji: "✓",  text: "実現しやすそう" },
  { key: "isExisting", emoji: "?",  text: "既にある気がする" },
] as const;

type RatingKey = typeof LABELS[number]["key"];
type Rating = Partial<Record<RatingKey, boolean>>;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("_sid");
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("_sid", id); }
  return id;
}

export function IdeaRating({ ideaId }: { ideaId: string }) {
  const [rating, setRating] = useState<Rating>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) return;
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/ideas/${ideaId}/rating?sessionId=${sid}`)
      .then((r) => r.json())
      .then((data) => { if (data) setRating(data); })
      .catch(() => {});
  }, [ideaId]);

  const toggle = useCallback((key: RatingKey) => {
    setRating((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }, []);

  const save = useCallback(async () => {
    const sid = getSessionId();
    await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/ideas/${ideaId}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid, ...rating }),
    });
    setSaved(true);
  }, [ideaId, rating]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">このアイデアについて教えてください（任意）</p>
      <div className="flex flex-wrap gap-2">
        {LABELS.map(({ key, emoji, text }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              rating[key]
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {emoji} {text}
          </button>
        ))}
      </div>
      {Object.values(rating).some(Boolean) && !saved && (
        <button
          onClick={save}
          className="mt-1 text-xs text-primary underline underline-offset-2 hover:opacity-70"
        >
          送信する
        </button>
      )}
      {saved && <p className="text-xs text-muted-foreground">ありがとうございます</p>}
    </div>
  );
}
