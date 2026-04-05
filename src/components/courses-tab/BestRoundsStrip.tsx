import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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
}

interface BestRoundsStripProps {
  activeRegion: string | null;
}

const GRADIENT_FALLBACKS = [
  'from-[#1a2a0d] to-[#0d1508]',
  'from-[#0d1a2a] to-[#050d14]',
  'from-[#2a1a0d] to-[#140d05]',
];

export function BestRoundsStrip({ activeRegion }: BestRoundsStripProps) {
  const navigate = useNavigate();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['best-rounds-this-week', activeRegion],
    queryFn: async (): Promise<ReviewItem[]> => {
      const params: Record<string, any> = { days_back: 30, result_limit: 10 };
      if (activeRegion) params.p_region_slug = activeRegion;
      const { data, error } = await supabase.rpc('get_top_video_reviews', params);
      if (error) return [];
      return (data ?? []) as ReviewItem[];
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div style={{ padding: '8px 0 4px' }}>
        <div
          className="flex items-center gap-1.5"
          style={{ padding: '4px 16px 8px' }}
        >
          <Star className="w-3.5 h-3.5" style={{ color: '#F7931E' }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            Best rounds this week
          </span>
        </div>
        <div
          className="flex overflow-x-auto"
          style={{ padding: '0 12px', gap: 8, scrollbarWidth: 'none' }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted animate-pulse shrink-0"
              style={{ width: 150, height: 130, borderRadius: 12 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) return null;

  return (
    <div style={{ padding: '8px 0 4px' }}>
      {/* Section header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '4px 16px 8px' }}
      >
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" style={{ color: '#F7931E' }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            Best rounds this week
          </span>
        </div>
        <button
          onClick={() => navigate('/discover?tab=explore')}
          className="active:scale-[0.97] transition-transform"
          style={{ fontSize: 13, fontWeight: 500, color: '#F7931E' }}
        >
          See all →
        </button>
      </div>

      {/* Horizontal scroll */}
      <div
        className="flex overflow-x-auto"
        style={{
          padding: '0 12px',
          gap: 8,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {reviews.map((review, idx) => (
          <button
            key={review.review_id}
            onClick={() => navigate(`/courses/${review.course_id}`)}
            className="shrink-0 text-left active:scale-[0.97] transition-transform"
            style={{
              width: 150,
              borderRadius: 12,
              overflow: 'hidden',
              border: '0.5px solid hsl(var(--border) / 0.15)',
              background: 'white',
            }}
          >
            {/* Image area */}
            <div className="relative" style={{ width: 150, height: 100 }}>
              {review.thumbnail_url ? (
                <img
                  src={review.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${GRADIENT_FALLBACKS[idx % GRADIENT_FALLBACKS.length]}`}
                />
              )}

              {/* Rating chip */}
              {review.rating > 0 && (
                <div
                  className="absolute flex items-center"
                  style={{
                    top: 6,
                    right: 6,
                    gap: 3,
                    background: 'rgba(255,255,255,0.2)',
                    border: '0.5px solid rgba(255,255,255,0.3)',
                    borderRadius: 6,
                    padding: '2px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  <Star className="w-[9px] h-[9px]" style={{ color: '#F7931E', fill: '#F7931E' }} />
                  {review.rating.toFixed(1)}
                </div>
              )}

              {/* Reviewer avatar */}
              {review.avatar_url && (
                <div className="absolute" style={{ bottom: 6, left: 6 }}>
                  <SquircleAvatar
                    src={review.avatar_url}
                    size="xs"
                    hideRing
                  />
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: '7px 8px' }}>
              <p
                className="line-clamp-2"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  lineHeight: 1.3,
                }}
              >
                {review.course_name}
              </p>
              {review.course_location && (
                <p
                  style={{
                    fontSize: 10,
                    color: 'hsl(var(--muted-foreground))',
                    marginTop: 2,
                  }}
                >
                  {review.course_location}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
