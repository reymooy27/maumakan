import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// POST /api/reviews - Submit a review (auth required)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { placeId, rating, comment } = body;

    if (!placeId || rating == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: { placeId, userId: user.id, rating, comment },
    });

    // Update place average rating
    const avg = await prisma.review.aggregate({
      where: { placeId },
      _avg: { rating: true },
    });
    await prisma.place.update({
      where: { id: placeId },
      data: { rating: avg._avg.rating ?? 0 },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error('[POST /api/reviews]', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
