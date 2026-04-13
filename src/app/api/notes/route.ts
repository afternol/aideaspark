import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get("ideaId");
    const sessionId = searchParams.get("sessionId");
    if (!ideaId || !sessionId) return NextResponse.json(null);

    const note = await prisma.note.findUnique({
      where: { ideaId_sessionId: { ideaId, sessionId } },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ideaId, sessionId, body } = await request.json();
    if (!ideaId || !sessionId) {
      return NextResponse.json({ error: "ideaId and sessionId required" }, { status: 400 });
    }

    const note = await prisma.note.upsert({
      where: { ideaId_sessionId: { ideaId, sessionId } },
      update: { body: body || "" },
      create: { ideaId, sessionId, body: body || "" },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
