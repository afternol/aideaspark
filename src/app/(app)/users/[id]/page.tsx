"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { UserCircle, MessageSquare, ThumbsUp, Clock, Loader2, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface ProfileData {
  user: { id: string; name: string | null; bio?: string | null; interests?: string | null; profilePublic?: boolean; createdAt?: string };
  stats: { commentCount: number; reactionCount: number } | null;
  isMe: boolean;
  isPrivate: boolean;
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d?.user) setData(d); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) {
    return <div className="py-20 text-center text-muted-foreground">ユーザーが見つかりません</div>;
  }

  // Private profile
  if (data.isPrivate) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <Lock className="mx-auto mb-4 size-12 text-muted-foreground/30" />
        <h1 className="text-xl font-bold">{data.user.name || "ユーザー"}</h1>
        <p className="mt-2 text-muted-foreground">このユーザーのプロフィールは非公開です</p>
      </div>
    );
  }

  const interests = data.user.interests ? JSON.parse(data.user.interests) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <UserCircle className="size-10 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{data.user.name || "名前未設定"}</h1>
                {data.user.bio && <p className="mt-1 text-sm text-muted-foreground">{data.user.bio}</p>}
                {data.user.createdAt && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatDistanceToNow(new Date(data.user.createdAt), { addSuffix: true, locale: ja })}に参加
                  </p>
                )}
              </div>
            </div>
            {data.isMe && (
              <Link href="/mypage">
                <Button variant="outline" size="sm">マイページ</Button>
              </Link>
            )}
          </div>

          {interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {interests.map((i: string) => (
                <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data.stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: MessageSquare, label: "コメント", value: data.stats.commentCount },
            { icon: ThumbsUp, label: "リアクション", value: data.stats.reactionCount },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="gap-0 py-0">
                <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
                  <Icon className="size-5 text-primary" />
                  <span className="text-2xl font-black">{item.value}</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
