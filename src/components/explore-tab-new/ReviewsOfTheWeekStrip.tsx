import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import clbhouzLogo from '@/assets/clbhouz-logo.png';
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
  display_name: string;
  engagement_score: number | null;
}

interface ReviewsOfTheWeekStripProps {
  activeRegion?: string | null;
}

function formatCourseLocation(location: string | null): string | null {
  if (!location) return null;
  return location.split(',')[0].trim();
}

function ReviewsOfTheWeekStripInner({ activeRegion = null }: ReviewsOfTheWeekStripProps) {
  const navigate = useNavigate();

  const { data: reviews } = useQuery({
    queryKey: ['explore-reviews-of-month', activeRegion],
    queryFn: async (): Promise<ReviewItem[]> => {
      const params: Record<string, any> = { days_back: 30, result_limit: 10, p_sort_by: 'engagement' };
      if (activeRegion) params.p_region_slug = activeRegion;

      const { data, error } = await supabase.rpc('get_top_video_reviews', params);

      if (error) {
        if (import.meta.env.DEV) console.error('[ReviewsOfTheWeek] RPC error:', error);
        return [];
      }

      if (!data || data.length < 3) {
        const fallbackParams: Record<string, any> = { days_back: 90, result_limit: 10 };
        if (activeRegion) fallbackParams.p_region_slug = activeRegion;

        const { data: fallback } = await supabase.rpc('get_top_video_reviews', fallbackParams);
        const results = (fallback ?? data ?? []) as ReviewItem[];
        return [...results].sort((a, b) => (b.engagement_score ?? 0) - (a.engagement_score ?? 0));
      }

      return [...(data as ReviewItem[])].sort((a, b) => (b.engagement_score ?? 0) - (a.engagement_score ?? 0));
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
    <section style={{ padding: '24px 0 4px' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
          Most loved this month
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)', margin: '2px 0 0', fontWeight: 500 }}>
          Top reviews your community shared
        </p>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
        {reviews.map((review) => (
          <button
            key={review.review_id}
            type="button"
            onClick={() => handleReviewTap(review)}
            className="shrink-0 w-[182px] aspect-[3/4] rounded-2xl overflow-hidden relative bg-muted focus:outline-none"
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

            {/* Rating badge — unified star + text */}
            <span
              className="absolute flex items-center gap-1 leading-none"
              style={{
                top: 8, right: 8,
                padding: '4px 8px',
                borderRadius: 9999,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <img src={clbhouzLogo} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{review.rating.toFixed(1)}</span>
            </span>

            {/* Course name + location */}
            <div className="absolute" style={{ bottom: 10, left: 10, right: 10 }}>
              <span className="text-[13px] font-bold text-white line-clamp-1 block truncate">
                {review.course_name}
              </span>
              {formatCourseLocation(review.course_location) && (
                <span className="text-[11px] text-white/60 line-clamp-1 block truncate">
                  {formatCourseLocation(review.course_location)}
                </span>
              )}
            </div>

            {/* Creator avatar */}
            {review.avatar_url && (
              <div className="absolute top-2 left-2">
                <SquircleAvatar
                  src={review.avatar_url}
                  alt={review.display_name}
                  size={24}
                  hideRing
                />
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

export const ReviewsOfTheWeekStrip = memo(ReviewsOfTheWeekStripInner);
