import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/recommend
 * 
 * Returns up to 5 recommended places based on the current user's saved places.
 * Uses a lightweight weighted scoring algorithm:
 *   - Type match:     +3
 *   - Price bracket:   +2
 *   - Shared amenity:  +1 each
 *   - Distance penalty: -1 per km from the centroid of saved places
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get saved places with their details
    const savedPlaces = await prisma.savedPlace.findMany({
      where: { userId: session.user.id },
      include: { place: true },
    });

    if (!savedPlaces || savedPlaces.length === 0) {
      // If no saved places, return random popular places
      const popular = await prisma.place.findMany({
        orderBy: { rating: 'desc' },
        take: 5,
        include: { menuItems: true },
      });
      return NextResponse.json(popular);
    }

    const savedIds = new Set(savedPlaces.map((sp) => sp.placeId));

    // 2. Extract preference traits from saved places
    const typeCounts: Record<string, number> = {};
    let totalLat = 0, totalLng = 0, totalPrice = 0;
    const amenitySet = new Set<string>();

    for (const sp of savedPlaces) {
      const p = sp.place;
      typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
      totalLat += p.lat;
      totalLng += p.lng;
      totalPrice += p.avgPrice;
      if (p.amenities) {
        for (const a of p.amenities) amenitySet.add(a);
      }
    }

    const n = savedPlaces.length;
    const centroidLat = totalLat / n;
    const centroidLng = totalLng / n;
    const avgPrice = totalPrice / n;

    // Preferred type = the most common type among saved places
    const preferredType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];

    // 3. Get all candidate places (excluding already saved)
    const allPlaces = await prisma.place.findMany({
      include: { menuItems: true },
    });

    // 4. Score each candidate
    const scored = allPlaces
      .filter((p) => !savedIds.has(p.id))
      .map((p) => {
        let score = 0;

        // Type match
        if (p.type === preferredType) score += 3;

        // Price bracket (within 30% of average)
        if (avgPrice > 0) {
          const priceDiff = Math.abs(p.avgPrice - avgPrice) / avgPrice;
          if (priceDiff < 0.3) score += 2;
          else if (priceDiff < 0.6) score += 1;
        }

        // Shared amenities
        if (p.amenities) {
          for (const a of p.amenities) {
            if (amenitySet.has(a)) score += 1;
          }
        }

        // Distance penalty (haversine from centroid)
        const R = 6371;
        const dLat = ((p.lat - centroidLat) * Math.PI) / 180;
        const dLon = ((p.lng - centroidLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((centroidLat * Math.PI) / 180) *
          Math.cos((p.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        score -= dist; // -1 per km

        // Rating bonus
        score += p.rating * 0.5;

        return { ...p, _score: score, distance: dist };
      });

    // 5. Sort by score descending and return top 5
    scored.sort((a, b) => b._score - a._score);
    const top5 = scored.slice(0, 5).map((p) => {
      const res = { ...p };
      delete (res as { _score?: number })._score;
      return res;
    });

    return NextResponse.json(top5);
  } catch (err) {
    console.error('[GET /api/recommend]', err);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
