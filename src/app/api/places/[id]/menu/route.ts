import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET /api/places/[id]/menu
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const items = await prisma.menuItem.findMany({ where: { placeId: id } });
    return NextResponse.json(items);
  } catch (err) {
    console.error('[GET /api/places/[id]/menu]', err);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

// POST /api/places/[id]/menu
export async function POST(req: NextRequest, { params }: Params) {
  const { id: placeId } = await params;
  try {
    const body = await req.json();
    const { name, price, description, imageUrl } = body;

    if (!name || price == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.menuItem.create({
      data: { placeId, name, price, description, imageUrl },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error('[POST /api/places/[id]/menu]', err);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
