import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { collectionId, ideaId } = await request.json();
    const item = await prisma.collectionItem.create({
      data: { collectionId, ideaId },
    });

    // ブックマーク数をインクリメント
    await prisma.idea.update({
      where: { id: ideaId },
      data: { bookmarks: { increment: 1 } },
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
    const deleted = await prisma.collectionItem.deleteMany({
      where: { collectionId, ideaId },
    });

    // 実際に削除された場合のみデクリメント
    if (deleted.count > 0) {
      await prisma.idea.update({
        where: { id: ideaId },
        data: { bookmarks: { decrement: 1 } },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
