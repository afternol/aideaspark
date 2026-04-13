"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Eye, Loader2, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BusinessIdea } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface HistoryItem extends BusinessIdea {
  viewedAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/history")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setItems(data); })
        .finally(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="py-20 text-center">
        <Eye className="mx-auto mb-4 size-12 text-muted-foreground/30" />
        <h1 className="text-xl font-bold">閲覧履歴</h1>
        <p className="mt-2 text-muted-foreground">ログインすると閲覧履歴が記録されます</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button className="gap-2"><LogIn className="size-4" />ログイン</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Eye className="size-6 text-primary" />
          閲覧履歴
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">最近閲覧したアイデア（最大50件）</p>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">まだ閲覧履歴がありません</p>
            <Link href="/feed" className="mt-2 inline-block">
              <Button variant="outline" size="sm">アイデアを探す</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={item.id} href={`/ideas/${item.slug}`}>
              <Card className="gap-0 py-0 transition-colors hover:bg-muted/30">
                <CardContent className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{item.serviceName}</span>
                      <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{item.oneLiner}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.viewedAt), { addSuffix: true, locale: ja })}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
