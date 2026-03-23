import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getUserId() {
  // Try NextAuth session first
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;

  // Try Supabase session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Find or create user in Prisma to sync with Supabase
    let prismaUser = await prisma.user.findUnique({
      where: { email: user.email || "" }
    });

    if (!prismaUser && user.email) {
      prismaUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          image: user.user_metadata?.avatar_url,
        }
      });
    }
    return prismaUser?.id;
  }

  return null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const savedPlaces = await prisma.savedPlace.findMany({
      where: { userId },
      include: { place: true }
    });
    return NextResponse.json(savedPlaces);
  } catch (error) {
    console.error('[GET /api/user/saved-places]', error);
    return NextResponse.json({ error: "Failed to fetch saved places" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { placeId } = await req.json();
    if (!placeId) {
      return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    }

    // Check if it exists
    const existing = await prisma.savedPlace.findUnique({
      where: {
        userId_placeId: {
          userId,
          placeId,
        }
      }
    });

    if (existing) {
      // Toggle off
      await prisma.savedPlace.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ saved: false });
    } else {
      // Toggle on
      await prisma.savedPlace.create({
        data: {
          userId,
          placeId,
        }
      });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('[POST /api/user/saved-places]', error);
    return NextResponse.json({ error: "Failed to update saved place" }, { status: 500 });
  }
}
