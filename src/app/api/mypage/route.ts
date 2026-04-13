import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

    const userId = session.user.id;

    const [user, customIdeaCount, collectionCount, commentCount, reactionCount, historyCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, bio: true, interests: true, onboarded: true, profilePublic: true, createdAt: true } }),
      prisma.customIdea.count({ where: { userId } }),
      prisma.collection.count({ where: { sessionId: userId } }),
      prisma.comment.count({ where: { sessionId: userId } }),
      prisma.reaction.count({ where: { sessionId: userId } }),
      prisma.viewHistory.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      user,
      stats: { customIdeaCount, collectionCount, commentCount, reactionCount, historyCount },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

    const { name, bio, interests, onboarded, profilePublic } = await request.json();

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(interests !== undefined && { interests: JSON.stringify(interests) }),
        ...(onboarded !== undefined && { onboarded }),
        ...(profilePublic !== undefined && { profilePublic }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
