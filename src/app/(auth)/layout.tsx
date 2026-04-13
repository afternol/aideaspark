import Link from "next/link";
import { Lightbulb } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <Lightbulb className="size-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">BizIdea</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
