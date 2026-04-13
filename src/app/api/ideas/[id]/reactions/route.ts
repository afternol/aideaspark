import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { sessionId, type } = await request.json();

  if (!sessionId || !type) {
    return NextResponse.json({ error: "sessionId and type required" }, { status: 400 });
  }

  // Toggle: if exists delete, otherwise create
  const existing = await prisma.reaction.findUnique({
    where: { ideaId_sessionId_type: { ideaId: id, sessionId, type } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ toggled: false });
  } else {
    await prisma.reaction.create({
      data: { ideaId: id, sessionId, type },
    });
    return NextResponse.json({ toggled: true });
  }
}
