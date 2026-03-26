import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, syncUserById } from "@/lib/user";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Try to find the user
    let user = await prisma.user.findUnique({
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
        }
      }
    });

    // If not found, try to sync (this handles cases where user exists in Supabase but not yet in Prisma)
    if (!user) {
      await syncUserById(id);
      user = await prisma.user.findUnique({
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
          }
        }
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current user to check if following
    let currentUserId: string | null = null;
    try {
      currentUserId = await getUserId();
    } catch {
      // Ignore auth errors for public profile view
    }

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
    console.error("[USER_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
