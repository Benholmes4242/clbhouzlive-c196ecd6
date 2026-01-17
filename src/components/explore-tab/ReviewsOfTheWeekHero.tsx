/**
 * ReviewsOfTheWeekHero - Single 1:1 tile featuring top video review of the week
 * 
 * Displays the best video review with ReviewTileOverlay layout:
 * - Top capsule: Course name + rating
 * - Bottom left capsule: User info + "Read review" CTA
 * - Falls back to Featured Course if no video reviews
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { useReviewsOfTheWeek, ReviewOfTheWeek } from '@/hooks/useReviewsOfTheWeek';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { Loader2, ChevronRight, Trophy } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getReviewOverlayTheme } from '@/lib/postHelpers';

interface ReviewsOfTheWeekHeroProps {
  onFallbackToFeaturedCourse?: () => void;
  className?: string;
}

export function ReviewsOfTheWeekHero({ 
  onFallbackToFeaturedCourse,
  className 
}: ReviewsOfTheWeekHeroProps) {
  const navigate = useNavigate();
  const hasFallenBack = useRef(false);
  
  // Fetch reviews - only need the top one
  const { data: reviews, isLoading } = useReviewsOfTheWeek({ limit: 1 });
  
  // Get the top review
  const review = reviews?.[0];
  
  // Fallback to featured course if no reviews (only trigger once)
  React.useEffect(() => {
    if (!isLoading && !review && !hasFallenBack.current) {
      hasFallenBack.current = true;
      onFallbackToFeaturedCourse?.();
    }
  }, [isLoading, review, onFallbackToFeaturedCourse]);
  
  // Handle tap on review
  const handleReviewTap = useCallback(() => {
    if (review) {
      navigate(`/post/${review.post_id}`);
    }
  }, [navigate, review]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "relative w-full aspect-square bg-muted animate-pulse rounded-xl overflow-hidden",
        "flex items-center justify-center",
        className
      )}>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Return null if no reviews (fallback is triggered via effect)
  if (!review) {
    return null;
  }
  
  return (
    <div 
      className={cn(
        "relative w-full aspect-square overflow-hidden rounded-xl cursor-pointer",
        className
      )}
      onClick={handleReviewTap}
    >
      <ReviewTile review={review} />
    </div>
  );
}

// Individual tile component with ReviewTileOverlay-style layout
interface ReviewTileProps {
  review: ReviewOfTheWeek;
}

const ReviewTile = React.memo(function ReviewTile({ review }: ReviewTileProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  
  // Get HLS URL and poster
  const { hlsUrl, posterUrl } = useMemo(() => {
    if (!review.video_url) return { hlsUrl: null, posterUrl: null };
    const streamId = uidFromNode({ src: review.video_url });
    if (!streamId) return { hlsUrl: null, posterUrl: null };
    return {
      hlsUrl: generateStreamHlsUrl(streamId),
      posterUrl: generateStreamThumbnailUrl(streamId, { width: 720, height: 720, time: 1 }),
    };
  }, [review.video_url]);
  
  const theme = getReviewOverlayTheme(review.rating);
  const isOutstanding = review.rating >= 9.0;
  
  // User initials for avatar fallback
  const initials = (review.display_name || review.username || 'G')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  
  return (
    <div className="relative w-full h-full bg-black">
      {/* Media layer */}
      <div className="absolute inset-0">
        {/* Video */}
        {hlsUrl && (
          <HLSPlayer
            ref={playerRef}
            src={hlsUrl}
            autoplay
            muted
            loop
            className="h-full w-full object-cover"
          />
        )}
        
        {/* Poster/Thumbnail as fallback */}
        {(posterUrl || review.thumbnail_url) && (
          <img
            src={posterUrl || review.thumbnail_url || ''}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      {/* Gradients for legibility */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none" />
      
      {/* "Reviews of the Week" badge - top left */}
      <div className="absolute top-3 left-3 z-20">
        <div
          className="rounded-lg border shadow-[0_2px_12px_rgba(0,0,0,0.2)] px-2.5 py-1.5"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px) saturate(130%)',
            WebkitBackdropFilter: 'blur(12px) saturate(130%)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-white uppercase tracking-wide">
            <Trophy className="w-3 h-3" aria-hidden />
            Review of the Week
          </span>
        </div>
      </div>

      {/* TOP PANEL - Course info + Rating (matching ReviewTileOverlay) */}
      <div
        className={cn(
          "absolute top-12 left-3 right-3 z-10",
          "rounded-lg border",
          "shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
        )}
        style={{
          backgroundColor: isOutstanding
            ? 'rgba(251, 191, 36, 0.05)'
            : 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(12px) saturate(130%)',
          WebkitBackdropFilter: 'blur(12px) saturate(130%)',
          borderColor: isOutstanding
            ? 'rgba(251, 191, 36, 0.15)'
            : 'rgba(255, 255, 255, 0.06)',
          padding: '8px 10px',
        }}
      >
        {/* Two-column: Left (course info) / Right (rating) */}
        <div className="flex justify-between items-start gap-3">
          {/* Left: Course name + location */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="text-white font-semibold text-sm leading-tight line-clamp-1">
              {review.course_name}
            </div>
            {review.course_location && (
              <div className="text-white/50 text-xs line-clamp-1 font-normal">
                {review.course_location}
              </div>
            )}
          </div>
          
          {/* Right: Rating (vertical stack) */}
          <div className="flex flex-col items-center gap-0 flex-shrink-0">
            <span 
              className="text-2xl font-bold tabular-nums leading-none"
              style={{ color: isOutstanding ? '#fbbf24' : '#c4c8ce' }}
            >
              {review.rating === 10 ? '10' : review.rating.toFixed(1)}
            </span>
            <span 
              className="text-[8px] font-medium tracking-wider"
              style={{ color: isOutstanding ? 'rgba(251, 191, 36, 0.6)' : 'rgba(196, 200, 206, 0.6)' }}
            >
              {theme.label}
            </span>
          </div>
        </div>
      </div>
      
      {/* BOTTOM PANEL - User info + Read review CTA (matching ReviewTileOverlay) */}
      <div
        className={cn(
          "absolute bottom-3 left-3 z-10",
          "rounded-lg border",
          "shadow-[0_2px_12px_rgba(0,0,0,0.2)]",
          "max-w-[70%]"
        )}
        style={{
          backgroundColor: isOutstanding
            ? 'rgba(251, 191, 36, 0.05)'
            : 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(12px) saturate(130%)',
          WebkitBackdropFilter: 'blur(12px) saturate(130%)',
          borderColor: isOutstanding
            ? 'rgba(251, 191, 36, 0.15)'
            : 'rgba(255, 255, 255, 0.06)',
          padding: '8px 10px',
        }}
      >
        {/* User info row + Read review CTA */}
        <div className="flex items-center gap-2">
          <SquircleAvatar
            size={28}
            src={review.avatar_url}
            alt={review.display_name || review.username || 'Golfer'}
            fallback={initials}
            hideRing
          />
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-xs truncate leading-tight">
              {review.display_name || review.username || 'Golfer'}
            </div>
            {/* Read review CTA */}
            <div className={cn(
              "flex items-center gap-0.5 mt-0.5",
              "text-[10px] font-medium",
              isOutstanding 
                ? "text-amber-400/80"
                : "text-white/50"
            )}>
              <span>Read review</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ReviewsOfTheWeekHero;
