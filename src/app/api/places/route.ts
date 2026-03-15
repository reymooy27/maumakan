import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/places - List all places, optionally filtered by bounds
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const north = searchParams.get('north');
  const south = searchParams.get('south');
  const east = searchParams.get('east');
  const west = searchParams.get('west');
  const search = searchParams.get('search') || '';
  const minRating = parseFloat(searchParams.get('minRating') || '0');
  const priceRange = searchParams.getAll('priceRange').map(Number).filter((n) => !isNaN(n));

  try {
    // Build the where clause explicitly to avoid spread short-circuit issues
    const where: Prisma.PlaceWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (minRating > 0) {
      where.rating = { gte: minRating };
    }

    if (priceRange.length > 0) {
      where.priceRange = { in: priceRange };
    }

    // Only apply bounds filter when ALL four values are present
    if (north && south && east && west) {
      where.lat = { gte: parseFloat(south), lte: parseFloat(north) };
      where.lng = { gte: parseFloat(west), lte: parseFloat(east) };
    }

    const places = await prisma.place.findMany({
      where,
      include: { menuItems: true },
      orderBy: { rating: 'desc' },
      take: 100,
    });

    return NextResponse.json(places);
  } catch (err) {
    console.error('[GET /api/places]', err);
    return NextResponse.json(
      { error: 'Failed to fetch places', detail: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/places - Create a new place
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, address, lat, lng, priceRange, imageUrl } = body;

    if (!name || !type || lat == null || lng == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const place = await prisma.place.create({
      data: { name, type, address, lat, lng, priceRange: priceRange ?? 1, imageUrl },
    });

    return NextResponse.json(place, { status: 201 });
  } catch (err) {
    console.error('[POST /api/places]', err);
    return NextResponse.json({ error: 'Failed to create place' }, { status: 500 });
  }
}
