import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/places/[id]/crowd — Report crowd level
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: placeId } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !['Busy', 'Normal', 'Quiet'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status. Must be Busy, Normal, or Quiet.' }, { status: 400 });
  }

  try {
    const report = await (prisma as any).crowdReport.create({
      data: {
        userId: session.user.id,
        placeId,
        status,
      },
    });
    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error('[POST /api/places/[id]/crowd]', err);
    return NextResponse.json({ error: 'Failed to submit crowd report' }, { status: 500 });
  }
}

// GET /api/places/[id]/crowd — Get aggregated crowd status (last 1 hour)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: placeId } = await params;
  const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);

  try {
    const reports = await (prisma as any).crowdReport.findMany({
      where: {
        placeId,
        createdAt: { gte: oneHourAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate: most common status wins
    const counts: Record<string, number> = { Busy: 0, Normal: 0, Quiet: 0 };
    for (const r of reports) {
      counts[r.status] = (counts[r.status] || 0) + 1;
    }

    let dominant = 'Unknown';
    let maxCount = 0;
    for (const [status, count] of Object.entries(counts)) {
      if (count > maxCount) {
        dominant = status;
        maxCount = count;
      }
    }

    return NextResponse.json({
      status: reports.length > 0 ? dominant : 'Unknown',
      totalReports: reports.length,
      breakdown: counts,
    });
  } catch (err) {
    console.error('[GET /api/places/[id]/crowd]', err);
    return NextResponse.json({ error: 'Failed to fetch crowd data' }, { status: 500 });
  }
}
