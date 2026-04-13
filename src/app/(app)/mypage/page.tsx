"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  UserCircle,
  FolderHeart,
  Lightbulb,
  MessageSquare,
  ThumbsUp,
  Eye,
  Clock,
  Settings,
  Loader2,
  LogIn,
  Globe,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface MyPageData {
  user: {
    id: string;
    name: string | null;
    email: string;
    bio: string | null;
    interests: string | null;
    onboarded: boolean;
    profilePublic: boolean;
    createdAt: string;
  };
  stats: {
    customIdeaCount: number;
    collectionCount: number;
    commentCount: number;
    reactionCount: number;
    historyCount: number;
  };
}

export default function MyPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<MyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const load = async () => {
    const d = await fetch("/api/mypage").then((r) => r.json());
    if (d?.user) {
      setData(d);
      setName(d.user.name || "");
      setBio(d.user.bio || "");
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      load().finally(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const handleSave = async () => {
    await fetch("/api/mypage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });
    setEditing(false);
    await load();
  };

  const toggleProfileVisibility = async () => {
    if (!data) return;
    await fetch("/api/mypage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilePublic: !data.user.profilePublic }),
    });
    await load();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!session?.user) {
    return (
      <div className="py-20 text-center">
        <UserCircle className="mx-auto mb-4 size-16 text-muted-foreground/30" />
        <h1 className="text-xl font-bold">マイページ</h1>
        <p className="mt-2 text-muted-foreground">ログインするとマイページが利用できます</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button className="gap-2"><LogIn className="size-4" />ログイン</Button>
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const interests = data.user.interests ? JSON.parse(data.user.interests) : [];

  const statItems = [
    { icon: Lightbulb, label: "マイアイデア", value: data.stats.customIdeaCount || 0, href: "/my-ideas" },
    { icon: FolderHeart, label: "コレクション", value: data.stats.collectionCount, href: "/my-ideas" },
    { icon: MessageSquare, label: "コメント", value: data.stats.commentCount },
    { icon: Eye, label: "閲覧済み", value: data.stats.historyCount, href: "/history" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <UserCircle className="size-6 text-primary" />
        マイページ
      </h1>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">ニックネーム</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ニックネーム" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">自己紹介</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="自己紹介を入力..."
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>保存</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>キャンセル</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{data.user.name || "名前未設定"}</h2>
                <p className="text-sm text-muted-foreground">{data.user.email}</p>
                {data.user.bio && <p className="mt-2 text-sm">{data.user.bio}</p>}
                {interests.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {interests.map((i: string) => (
                      <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                    ))}
                  </div>
                )}
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatDistanceToNow(new Date(data.user.createdAt), { addSuffix: true, locale: ja })}に登録
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                <Settings className="size-3.5" />
                編集
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile visibility toggle */}
      <Card>
        <CardContent className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {data.user.profilePublic ? (
              <Globe className="size-5 text-primary" />
            ) : (
              <Lock className="size-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                プロフィール公開設定
              </p>
              <p className="text-xs text-muted-foreground">
                {data.user.profilePublic
                  ? "他のユーザーがあなたのプロフィールを閲覧できます"
                  : "プロフィールは非公開です。名前のみ表示されます"}
              </p>
            </div>
          </div>
          <Button
            variant={data.user.profilePublic ? "outline" : "default"}
            size="sm"
            onClick={toggleProfileVisibility}
          >
            {data.user.profilePublic ? "非公開にする" : "公開する"}
          </Button>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <Card className="gap-0 py-0 transition-colors hover:bg-muted/30">
              <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
                <Icon className="size-5 text-primary" />
                <span className="text-2xl font-black">{item.value}</span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </CardContent>
            </Card>
          );
          return item.href ? (
            <Link key={item.label} href={item.href}>{content}</Link>
          ) : (
            <div key={item.label}>{content}</div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Link href="/history">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Eye className="size-3.5" />閲覧履歴
          </Button>
        </Link>
        <Link href="/my-ideas">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FolderHeart className="size-3.5" />マイアイデア
          </Button>
        </Link>
        <Link href="/diagnosis">
          <Button variant="outline" size="sm" className="gap-1.5">
            アイデア診断をやり直す
          </Button>
        </Link>
      </div>
    </div>
  );
}
