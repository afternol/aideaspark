import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugToKeyword } from "@/lib/trend-slugs";
import { generateTrendReport } from "@/lib/trend-report";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const keyword = slugToKeyword(slug);
  if (!keyword) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entry = await prisma.trendCache.findUnique({ where: { keyword } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // レポートが未生成なら生成してから返す
  if (!entry.report) {
    try {
      const report = await generateTrendReport(keyword, entry.category, Math.round(entry.totalScore), entry.momentum);
      await prisma.trendCache.update({ where: { keyword }, data: { report: report as any } });
      return NextResponse.json({ ...entry, report });
    } catch (e) {
      console.error("[trend report gen]", e);
      return NextResponse.json({ ...entry, report: null });
    }
  }

  return NextResponse.json(entry);
}
