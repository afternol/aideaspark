import { NextResponse } from "next/server";
import { refreshTrendsCache } from "@/lib/trend-scorer";

export const maxDuration = 300; // Vercel max for Pro plan

export async function GET(request: Request) {
  // cronシークレット検証（Vercel Cron または手動実行）
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshTrendsCache();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("[cron/trends]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
