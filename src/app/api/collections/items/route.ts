import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { collectionId, ideaId } = await request.json();
    const item = await prisma.collectionItem.create({
      data: { collectionId, ideaId },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Already in collection" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { collectionId, ideaId } = await request.json();
    await prisma.collectionItem.deleteMany({
      where: { collectionId, ideaId },
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
