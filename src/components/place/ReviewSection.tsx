'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/authStore';
import { Star, MessageSquare, Send, Loader2, User, Check } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: User;
}

interface ReviewResponse {
  reviews: Review[];
  hasReviewed: boolean;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ReviewSection({ placeId }: { placeId: string }) {
  const { data: session } = useSession();
  const { user: supabaseUser } = useAuthStore();
  const isAuthenticated = !!session || !!supabaseUser;

  const { data, mutate, isLoading } = useSWR<ReviewResponse>(
    placeId ? `/api/reviews?placeId=${placeId}` : null,
    fetcher
  );

  const reviews = data?.reviews || [];
  const hasReviewed = data?.hasReviewed || false;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return alert('Silakan berikan rating!');
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, rating, comment }),
      });

      if (res.ok) {
        setRating(0);
        setComment('');
        mutate();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal mengirim review');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          Review & Komentar
        </h3>
        <span className="text-sm text-gray-500 font-bold">
          {reviews.length} Review
        </span>
      </div>

      {/* Write Review */}
      {hasReviewed ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-500/20 rounded-full mb-2">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <h4 className="text-lg font-black text-white italic">Terima Kasih!</h4>
          <p className="text-sm text-emerald-400/80 font-medium leading-relaxed">
            Review Anda telah kami simpan. Feedback Anda sangat membantu pengguna lain dalam memilih tempat makan!
          </p>
        </div>
      ) : isAuthenticated ? (
        <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-3xl p-4 space-y-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500 uppercase font-black tracking-widest">Berikan Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform active:scale-90"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating) 
                        ? 'fill-orange-500 text-orange-500' 
                        : 'text-gray-700'
                    } transition-colors`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bagikan pengalamanmu di tempat ini..."
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors resize-none min-h-[100px]"
            />
            <button
              type="submit"
              disabled={isSubmitting || !rating}
              className="absolute bottom-3 right-3 p-2 bg-orange-600 disabled:bg-gray-700 text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:scale-100"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-900/30 border border-gray-800 border-dashed rounded-3xl p-6 text-center">
          <p className="text-sm text-gray-500 font-medium mb-3">Login untuk memberikan review</p>
          <button className="text-xs font-black text-orange-500 uppercase tracking-widest hover:underline">
            Sign In Sekarang
          </button>
        </div>
      )}

      {/* Review List */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2].map(i => (
            <div key={i} className="h-24 bg-gray-900 animate-pulse rounded-3xl" />
          ))
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-gray-900/30 border border-gray-800 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-gray-700">
                    {review.user.image ? (
                      <Image src={review.user.image} alt={review.user.name || ''} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-tight">
                      {review.user.name || 'User'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: localeId })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star 
                      key={s} 
                      className={`w-3 h-3 ${s <= review.rating ? 'fill-orange-500 text-orange-500' : 'text-gray-700'}`} 
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-400 leading-relaxed pl-11">
                  {review.comment}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600 font-medium italic">Belum ada review. Jadilah yang pertama!</p>
          </div>
        )}
      </div>
    </div>
  );
}
