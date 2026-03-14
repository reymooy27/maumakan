import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET /api/places/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const place = await prisma.place.findUnique({
      where: { id },
      include: { menuItems: true, reviews: true },
    });
    if (!place) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(place);
  } catch (err) {
    console.error('[GET /api/places/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch place' }, { status: 500 });
  }
}

// PUT /api/places/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const place = await prisma.place.update({ where: { id }, data: body });
    return NextResponse.json(place);
  } catch (err) {
    console.error('[PUT /api/places/[id]]', err);
    return NextResponse.json({ error: 'Failed to update place' }, { status: 500 });
  }
}

// DELETE /api/places/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.place.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/places/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete place' }, { status: 500 });
  }
}
