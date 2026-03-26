import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Get current user to check if following
    const session = await getServerSession(authOptions);
    let currentUserId = session?.user?.id;

    if (!currentUserId) {
      const supabase = await createClient();
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      currentUserId = supabaseUser?.id;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        _count: {
          select: {
            followers: true,
            following: true,
            savedPlaces: true,
          }
        },
        savedPlaces: {
          select: {
            id: true,
            place: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: id
          }
        }
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      ...user,
      isFollowing,
      isSelf: currentUserId === id
    });
  } catch (error) {
    console.error("[USER_PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
