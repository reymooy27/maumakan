import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/user";

export async function POST(req: NextRequest) {
  try {
    const currentUserId = await getUserId();

    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { followingId } = body;

    if (!followingId) {
      return new NextResponse("Missing followingId", { status: 400 });
    }

    if (currentUserId === followingId) {
      return new NextResponse("You cannot follow yourself", { status: 400 });
    }

    // Toggle follow
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: followingId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: followingId
          }
        }
      });
      return NextResponse.json({ isFollowing: false });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: followingId
        }
      });
      return NextResponse.json({ isFollowing: true });
    }
  } catch (error) {
    console.error("[FOLLOW_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
