import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id ?? null;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json([]);

    const where = authUserId
      ? { OR: [{ authUserId }, { sessionId }] }
      : { sessionId };

    const collections = await prisma.collection.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(collections);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id ?? null;
    const { sessionId, name } = await request.json();
    if (!sessionId || !name?.trim()) {
      return NextResponse.json({ error: "sessionId and name required" }, { status: 400 });
    }

    const collection = await prisma.collection.create({
      data: { sessionId, authUserId, name: name.trim() },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "同名のコレクションが既にあります" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id ?? null;
    const { id, sessionId } = await request.json();
    const where = authUserId
      ? { id, OR: [{ authUserId }, { sessionId }] }
      : { id, sessionId };
    await prisma.collection.deleteMany({ where });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
