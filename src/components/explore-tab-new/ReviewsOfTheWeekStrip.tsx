import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ReviewItem {
  post_id: string;
  review_id: string;
  thumbnail_url: string | null;
  rating: number;
  course_name: string;
  avatar_url: string | null;
  username: string;
}

function ReviewsOfTheWeekStripInner() {
  const { data: reviews } = useQuery({
    queryKey: ['explore-reviews-of-week'],
    queryFn: async (): Promise<ReviewItem[]> => {
      // TODO: Change back to 7 or 30 for production
      const { data, error } = await supabase.rpc('get_top_video_reviews', {
        days_back: 365,
        result_limit: 10,
      });

      if (error) {
        // Fallback to 30 days
        const { data: fallback, error: fbErr } = await supabase.rpc('get_top_video_reviews', {
          days_back: 30,
          result_limit: 10,
        });
        if (fbErr) {
          console.error('[ReviewsOfTheWeek] RPC error:', fbErr);
          return [];
        }
        return (fallback ?? []) as ReviewItem[];
      }

      if (!data || data.length < 3) {
        const { data: fallback } = await supabase.rpc('get_top_video_reviews', {
          days_back: 30,
          result_limit: 10,
        });
        return (fallback ?? data ?? []) as ReviewItem[];
      }

      return data as ReviewItem[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  console.log('[ReviewsStrip] reviews loaded:', reviews?.length);
  if (!reviews || reviews.length < 2) return null;

  return (
    <div className="py-4" style={{ gridColumn: '1 / -1' }}>
      <h3 className="text-sm font-semibold text-foreground px-4 pb-3">
        ⭐ Reviews of the Week
      </h3>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
        {reviews.map((review) => (
          <button
            key={review.review_id}
            type="button"
            onClick={() => {
              // Phase 5: open fullscreen player
            }}
            className="shrink-0 w-[140px] aspect-[3/4] rounded-xl overflow-hidden relative bg-muted focus:outline-none"
          >
            {review.thumbnail_url && (
              <img
                src={review.thumbnail_url}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Rating badge */}
            <span className="absolute bottom-8 left-2 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white text-[11px] font-semibold leading-none">
              ⭐ {review.rating.toFixed(1)}
            </span>

            {/* Course name */}
            <span className="absolute bottom-2 left-2 right-2 text-[11px] font-semibold text-white line-clamp-1">
              {review.course_name}
            </span>

            {/* Creator avatar */}
            {review.avatar_url && (
              <img
                src={review.avatar_url}
                alt=""
                className="absolute top-2 left-2 w-6 h-6 rounded-full border border-white/50 object-cover"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export const ReviewsOfTheWeekStrip = memo(ReviewsOfTheWeekStripInner);
