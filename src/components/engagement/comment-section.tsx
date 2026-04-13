"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import type { IdeaComment } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface CommentSectionProps {
  ideaId: string;
  initialCount: number;
}

export function CommentSection({ ideaId, initialCount }: CommentSectionProps) {
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const load = async () => {
    const data = await api.comments.list(ideaId);
    setComments(data);
    setLoaded(true);
  };

  useEffect(() => {
    load();
  }, [ideaId]);

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.comments.create(ideaId, body, undefined, replyTo || undefined);
      setBody("");
      setReplyTo(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesMap = new Map<string, IdeaComment[]>();
  for (const c of comments) {
    if (c.parentId) {
      const arr = repliesMap.get(c.parentId) || [];
      arr.push(c);
      repliesMap.set(c.parentId, arr);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-base font-bold">
        <MessageSquare className="size-5 text-primary" />
        コメント
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {comments.length}
        </span>
      </h3>

      {/* Comment form */}
      <div className="space-y-2 rounded-lg border bg-card p-4">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>返信中:</span>
            <button onClick={() => setReplyTo(null)} className="text-primary hover:underline">
              キャンセル
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="コメントを入力..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleSubmit} disabled={!body.trim() || submitting}>
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      {/* Comment list */}
      {topLevel.length === 0 && loaded && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          まだコメントはありません。最初のコメントを投稿しましょう！
        </p>
      )}
      <div className="space-y-3">
        {topLevel.map((comment) => (
          <div key={comment.id} className="space-y-2">
            <CommentItem comment={comment} onReply={() => setReplyTo(comment.id)} />
            {repliesMap.get(comment.id)?.map((reply) => (
              <div key={reply.id} className="ml-8">
                <CommentItem comment={reply} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentItem({ comment, onReply }: { comment: IdeaComment; onReply?: () => void }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-semibold">{comment.nickname}</span>
        <span className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ja })}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{comment.body}</p>
      {onReply && (
        <button
          onClick={onReply}
          className="mt-1 text-xs text-muted-foreground hover:text-primary"
        >
          返信
        </button>
      )}
    </div>
  );
}
