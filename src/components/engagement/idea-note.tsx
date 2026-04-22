"use client";

import { useState, useEffect, useRef } from "react";
import { StickyNote, Check } from "lucide-react";
import { getSessionId } from "@/lib/session";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface IdeaNoteProps {
  ideaId: string;
}

export function IdeaNote({ ideaId }: IdeaNoteProps) {
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const sid = getSessionId();
    fetch(`${BASE_PATH}/api/notes?ideaId=${ideaId}&sessionId=${sid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.body) setBody(data.body);
        setLoaded(true);
      });
  }, [ideaId]);

  const save = (text: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      await fetch(`${BASE_PATH}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, sessionId: getSessionId(), body: text }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 800);
  };

  const handleChange = (text: string) => {
    setBody(text);
    setSaved(false);
    save(text);
  };

  if (!loaded) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <StickyNote className="size-4 text-primary" />
        <span className="text-sm font-bold">メモ</span>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <Check className="size-3" />
            保存済み
          </span>
        )}
      </div>
      <textarea
        value={body}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="このアイデアについてメモを残す..."
        className="w-full resize-none rounded-lg border bg-muted/30 px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:bg-background"
        rows={3}
      />
    </div>
  );
}
