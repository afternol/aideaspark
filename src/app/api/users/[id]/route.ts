import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, bio: true, interests: true, profilePublic: true, createdAt: true },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isMe = session?.user?.id === id;

    // If profile is private and not own profile, return limited info
    if (!user.profilePublic && !isMe) {
      return NextResponse.json({
        user: { id: user.id, name: user.name, profilePublic: false },
        stats: null,
        isMe: false,
        isPrivate: true,
      });
    }

    const [commentCount, reactionCount] = await Promise.all([
      prisma.comment.count({ where: { sessionId: id } }),
      prisma.reaction.count({ where: { sessionId: id } }),
    ]);

    return NextResponse.json({
      user,
      stats: { commentCount, reactionCount },
      isMe,
      isPrivate: false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
