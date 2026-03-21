import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/places/[id]/checkin — Check in at a place
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
    const checkIn = await (prisma as any).checkIn.create({
      data: {
        userId: session.user.id,
        placeId,
      },
    });
    return NextResponse.json(checkIn, { status: 201 });
  } catch (err) {
    console.error('[POST /api/places/[id]/checkin]', err);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
}

// GET /api/places/[id]/checkin — Get recent check-ins for a place (last 2 hours)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: placeId } = await params;
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  try {
    const checkIns = await (prisma as any).checkIn.findMany({
      where: {
        placeId,
        createdAt: { gte: twoHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, image: true } } },
    });
    return NextResponse.json({ count: checkIns.length, checkIns });
  } catch (err) {
    console.error('[GET /api/places/[id]/checkin]', err);
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
  }
}
