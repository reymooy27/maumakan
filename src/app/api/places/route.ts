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
  const zoom = parseInt(searchParams.get('zoom') || '15');
  const search = searchParams.get('search') || '';
  const minRating = parseFloat(searchParams.get('minRating') || '0');
  const minPrice = parseInt(searchParams.get('minPrice') || '0');
  const maxPrice = parseInt(searchParams.get('maxPrice') || '500000');
  const isOpenNow = searchParams.get('isOpenNow') === 'true';
  const currentTime = parseInt(searchParams.get('currentTime') || '-1'); // Minutes from midnight
  const amenitiesParam = searchParams.get('amenities');
  const dietaryParam = searchParams.get('dietary');
  const orderBy = searchParams.get('orderBy') || 'rating';
  const amenities = amenitiesParam ? amenitiesParam.split(',').filter(Boolean) : [];
  const dietary = dietaryParam ? dietaryParam.split(',').filter(Boolean) : [];

  try {
    // Build an array of AND conditions
    const andConditions: Prisma.PlaceWhereInput[] = [
      { avgPrice: { gte: minPrice, lte: maxPrice } }
    ];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { menuItems: { some: { name: { contains: search, mode: 'insensitive' } } } }
        ]
      });
    }

    if (minRating > 0) {
      andConditions.push({ rating: { gte: minRating } });
    }

    if (north && south && east && west) {
      andConditions.push({
        lat: { gte: parseFloat(south), lte: parseFloat(north) },
        lng: { gte: parseFloat(west), lte: parseFloat(east) }
      });
    }

    if (amenities.length > 0) {
      andConditions.push({
        amenities: { hasEvery: amenities } // Place must have ALL selected amenities
      });
    }

    if (dietary.length > 0) {
      andConditions.push({
        menuItems: { some: { dietaryTags: { hasSome: dietary } } } // Place must have AT LEAST ONE menu item matching ANY of the selected dietary tags
      });
    }

    const where: Prisma.PlaceWhereInput = { AND: andConditions };

    // Dynamic result limiting based on zoom:
    // When zoomed out, we only want the most "important" (highly rated) places.
    // This reduces the payload and keeps the map responsive.
    let take = 100;
    if (zoom < 10) take = 20;
    else if (zoom < 12) take = 40;
    else if (zoom < 14) take = 60;

    // If we're zoomed out and NOT searching, we enforce an even stricter importance filter
    // to mimic Google Maps showing only major landmarks.
    if (!search && zoom < 14) {
      andConditions.push({ rating: { gte: 4.2 } });
    }

    let prismaOrderBy: Prisma.PlaceOrderByWithRelationInput = { rating: 'desc' };
    if (orderBy === 'favorites') {
      prismaOrderBy = { savedBy: { _count: 'desc' } };
    }

    // Payload Reduction: We exclude menuItems and reviews from the list view.
    // The frontend will fetch them on demand when a place is selected.
    let places = await prisma.place.findMany({
      where,
      select: { 
        id: true,
        name: true,
        type: true,
        address: true,
        lat: true,
        lng: true,
        rating: true,
        avgPrice: true,
        openTime: true,
        closeTime: true,
        imageUrl: true,
        _count: {
          select: { savedBy: true }
        }
      },
      orderBy: prismaOrderBy,
      take,
    });

    if (isOpenNow && currentTime !== -1) {
      places = places.filter((p) => {
        // Handle overnight closing (e.g., 22:00 to 02:00)
        if (p.openTime <= p.closeTime) {
          return currentTime >= p.openTime && currentTime <= p.closeTime;
        } else {
          return currentTime >= p.openTime || currentTime <= p.closeTime;
        }
      });
    }

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
    const { name, type, address, lat, lng, avgPrice, openTime, closeTime, imageUrl } = body;

    if (!name || !type || lat == null || lng == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const place = await prisma.place.create({
      data: { 
        name, 
        type, 
        address, 
        lat, 
        lng, 
        avgPrice: avgPrice ?? 0, 
        openTime: openTime ?? 480, 
        closeTime: closeTime ?? 1320, 
        imageUrl 
      },
    });

    return NextResponse.json(place, { status: 201 });
  } catch (err) {
    console.error('[POST /api/places]', err);
    return NextResponse.json({ error: 'Failed to create place' }, { status: 500 });
  }
}
