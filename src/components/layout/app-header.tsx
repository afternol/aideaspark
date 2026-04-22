"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Lightbulb,
  TrendingUp,
  Trophy,
  Compass,
  Columns3,
  UserCircle,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, NAV_EXPLORE_ITEMS, NAV_ALL_ITEMS } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  Lightbulb,
  TrendingUp,
  Trophy,
  Compass,
  Columns3,
  UserCircle,
};

function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => { if (d?.unreadCount) setCount(d.unreadCount); })
      .catch(() => {});
  }, []);

  return (
    <Link href="/mypage" className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <Bell className="size-4" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function ExploreDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const exploreActive = NAV_EXPLORE_ITEMS.some((item) => pathname === item.href);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          exploreActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Search className="size-4 shrink-0" />
        <span>アイデアを探す</span>
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border bg-background py-1 shadow-lg">
          {NAV_EXPLORE_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden items-center gap-0.5 md:flex">
      <ExploreDropdown pathname={pathname} />
      {NAV_ITEMS.map((item) => {
        const Icon = iconMap[item.icon];
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="hidden xl:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 md:px-6">
        <Link href="/" className="mr-8 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Lightbulb className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">AideaSpark</span>
        </Link>

        <DesktopNav pathname={pathname} />

        <div className="ml-auto flex items-center gap-2">
          {session?.user ? (
            <div className="hidden items-center gap-2 md:flex">
              <NotificationBell />
              <Link href="/mypage" className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 transition-colors hover:bg-muted/80">
                <User className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{session.user.name || session.user.email?.split("@")[0]}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="gap-1.5 text-muted-foreground"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <LogIn className="size-3.5" />
                  ログイン
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">新規登録</Button>
              </Link>
            </div>
          )}

          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t bg-background px-4 pb-4 pt-2 md:hidden">
          {NAV_ALL_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          {session?.user ? (
            <button
              onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
              ログアウト
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                <LogIn className="size-4" />
                ログイン
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-primary">
                <User className="size-4" />
                新規登録
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
