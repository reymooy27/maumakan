import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/places/[id]/claim — Claim ownership of a place
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: placeId } = await params;

  try {
    // Check if place exists and is unclaimed
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    if (place.ownerId) {
      return NextResponse.json(
        { error: 'This place has already been claimed by another user.' },
        { status: 409 }
      );
    }

    // Claim the place
    const updated = await prisma.place.update({
      where: { id: placeId },
      data: { ownerId: session.user.id },
    });

    return NextResponse.json({
      message: `Successfully claimed "${place.name}"!`,
      place: updated,
    });
  } catch (err) {
    console.error('[POST /api/places/[id]/claim]', err);
    return NextResponse.json({ error: 'Failed to claim place' }, { status: 500 });
  }
}
