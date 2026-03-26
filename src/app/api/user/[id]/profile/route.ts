import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, syncUserById } from "@/lib/user";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    console.log("[USER_PROFILE_GET] Requested ID:", id);

    // Get current user to check if following, ignore auth errors
    let currentUserId: string | null = null;
    try {
      currentUserId = await getUserId();
      console.log("[USER_PROFILE_GET] Current User ID:", currentUserId);
    } catch (authError) {
      console.warn("[USER_PROFILE_GET] Auth check failed:", authError);
    }

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
        },
        savedPlaces: {
          select: {
            id: true,
            place: true,
          }
        }
      }
    });

    // If not found, try to sync before giving up
    if (!user) {
      console.log("[USER_PROFILE_GET] User not found, attempting on-demand sync for ID:", id);
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
          },
          savedPlaces: {
            select: {
              id: true,
              place: true,
            }
          }
        }
      });
    }

    console.log("[USER_PROFILE_GET] Prisma result for ID " + id + ":", !!user);

    if (!user) {
      console.error("[USER_PROFILE_GET] User not found in database for ID:", id);
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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
