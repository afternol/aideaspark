import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  const declarations = await prisma.declaration.findMany({
    where: { ideaId: id },
    orderBy: { createdAt: "desc" },
  });

  let userDeclared = false;
  if (sessionId) {
    userDeclared = declarations.some((d) => d.sessionId === sessionId);
  }

  return NextResponse.json({
    declarations,
    count: declarations.length,
    userDeclared,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { sessionId, message } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const existing = await prisma.declaration.findUnique({
    where: { ideaId_sessionId: { ideaId: id, sessionId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already declared" }, { status: 409 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const declaration = await prisma.declaration.create({
    data: { ideaId: id, sessionId, userId, message: message?.trim() || null },
  });

  return NextResponse.json(declaration, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { sessionId } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  await prisma.declaration.deleteMany({
    where: { ideaId: id, sessionId },
  });

  return NextResponse.json({ ok: true });
}
