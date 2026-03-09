import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ReviewItem {
  post_id: string;
  review_id: string;
  course_id: string;
  thumbnail_url: string | null;
  rating: number;
  course_name: string;
  course_location: string | null;
  avatar_url: string | null;
  username: string;
}

interface ReviewsOfTheWeekStripProps {
  activeRegion?: string | null;
}

function ReviewsOfTheWeekStripInner({ activeRegion = null }: ReviewsOfTheWeekStripProps) {
  const navigate = useNavigate();

  const { data: reviews } = useQuery({
    queryKey: ['explore-reviews-of-week', activeRegion],
    queryFn: async (): Promise<ReviewItem[]> => {
      const params: Record<string, any> = { days_back: 30, result_limit: 10 };
      if (activeRegion) params.p_region_slug = activeRegion;

      const { data, error } = await supabase.rpc('get_top_video_reviews', params);

      if (error) {
        console.error('[ReviewsOfTheWeek] RPC error:', error);
        return [];
      }

      if (!data || data.length < 3) {
        const fallbackParams: Record<string, any> = { days_back: 90, result_limit: 10 };
        if (activeRegion) fallbackParams.p_region_slug = activeRegion;

        const { data: fallback } = await supabase.rpc('get_top_video_reviews', fallbackParams);
        return (fallback ?? data ?? []) as ReviewItem[];
      }

      return data as ReviewItem[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (!reviews || reviews.length < 2) return null;

  const handleReviewTap = (review: ReviewItem) => {
    const url = `/courses/${review.course_id}?tab=reviews&review=${review.review_id}`;
    navigate(url);
  };

  return (
    <div className="py-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground px-4 pb-3">
        <MdOutlineStarOutline className="w-4 h-4 text-amber-500" />
        Reviews of the Week
      </h3>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
        {reviews.map((review) => (
          <button
            key={review.review_id}
            type="button"
            onClick={() => handleReviewTap(review)}
            className="shrink-0 w-[140px] aspect-[3/4] rounded-xl overflow-hidden relative bg-muted focus:outline-none"
          >
            {review.thumbnail_url ? (
              <img
                src={review.thumbnail_url}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-muted flex items-center justify-center p-2">
                <span className="text-[10px] text-muted-foreground text-center font-medium leading-tight">
                  {review.course_name}
                </span>
              </div>
            )}

            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Rating badge */}
            <span
              className="absolute top-2 right-2 rounded-full flex items-center gap-[3px] text-[11px] font-semibold text-white leading-none"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', padding: '3px 7px' }}
            >
              <img src="/images/brand/clubhouz-mark-white.svg" alt="" className="w-[10px] h-[10px]" />
              {review.rating.toFixed(1)}
            </span>

            {/* Course name + location */}
            <div className="absolute bottom-2 left-2 right-2">
              <span className="text-[11px] font-semibold text-white line-clamp-1 block truncate">
                {review.course_name}
              </span>
              {review.course_location && (
                <span className="text-[9px] text-white/60 line-clamp-1 block truncate">
                  {review.course_location}
                </span>
              )}
            </div>

            {/* Creator avatar */}
            {review.avatar_url && (
              <div className="absolute top-2 left-2">
                <SquircleAvatar
                  src={review.avatar_url}
                  alt={review.username}
                  size={24}
                  hideRing
                />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export const ReviewsOfTheWeekStrip = memo(ReviewsOfTheWeekStripInner);
