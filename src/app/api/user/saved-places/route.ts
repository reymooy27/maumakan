import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const savedPlaces = await prisma.savedPlace.findMany({
      where: { userId: session.user.id },
      include: { place: true }
    });
    return NextResponse.json(savedPlaces);
  } catch (error) {
    console.error('[GET /api/user/saved-places]', error);
    return NextResponse.json({ error: "Failed to fetch saved places" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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
          userId: session.user.id,
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
          userId: session.user.id,
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
