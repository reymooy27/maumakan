import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId, syncUserById } from '@/lib/user';

// GET /api/reviews?placeId=... - Get reviews for a place
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json({ error: 'Missing placeId' }, { status: 400 });
    }

    // Check if current user has reviewed (for UI state)
    const currentUserId = await getUserId();

    const reviews = await prisma.review.findMany({
      where: { placeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Background sync: ensure reviewers exist in Prisma if they somehow aren't (optional but safe)
    // We don't await this to keep GET fast, or we could have synced during POST.
    // Actually, syncUserById is best used during POST.

    const hasReviewed = currentUserId 
      ? reviews.some(r => r.userId === currentUserId)
      : false;

    return NextResponse.json({ reviews, hasReviewed });
  } catch (err) {
    console.error('[GET /api/reviews]', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews - Submit a review (auth required)
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { placeId, rating, comment } = body;

    if (!placeId || rating == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already reviewed this place
    const existingReview = await prisma.review.findFirst({
      where: { placeId, userId }
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Anda sudah memberikan review untuk tempat ini' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: { 
        placeId, 
        userId, 
        rating: Math.round(Number(rating)), 
        comment 
      },
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
