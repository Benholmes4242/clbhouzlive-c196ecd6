/**
 * WatchHeroVideo - Hero video card for Watch tab
 * 
 * Displays the most liked video with:
 * - 16:9 aspect ratio
 * - Trending badge (top right)
 * - Creator info overlay (squircle avatar)
 * - Autoplay on mount (muted)
 */

import React, { useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import { HeroVideo, TrendingPeriod } from '@/hooks/useWatchHeroVideo';
import { getStreamPoster } from '@/utils/stream';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface WatchHeroVideoProps {
  video: HeroVideo | null;
  trendingPeriod: TrendingPeriod;
  isLoading: boolean;
  onTap: () => void;
}

const BADGE_TEXT: Record<TrendingPeriod, string> = {
  today: 'TRENDING TODAY',
  this_week: 'TRENDING THIS WEEK',
  this_month: 'TRENDING THIS MONTH',
  all_time: 'TOP VIDEO',
};

export function WatchHeroVideo({ 
  video, 
  trendingPeriod, 
  isLoading, 
  onTap 
}: WatchHeroVideoProps) {
  const playerRef = useRef<HLSPlayerRef>(null);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="pt-4">
        <Skeleton className="w-full aspect-[16/9]" />
        <div className="flex items-center gap-2.5 mt-3 px-4">
          <Skeleton className="w-9 h-10 rounded-[34%]" />
          <div className="space-y-1.5">
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-16 h-3 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state - No video available
  if (!video || video.media.length === 0) {
    return (
      <div className="pt-4">
        <div className="w-full aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center mb-3 shadow-sm">
            <Heart className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-foreground font-semibold">No trending videos yet</p>
          <p className="text-muted-foreground text-sm">Be the first to post!</p>
        </div>
      </div>
    );
  }

  const primaryMedia = video.media[0];
  const mediaUrl = primaryMedia.media_url;
  const posterUrl = primaryMedia.poster_url || getStreamPoster(mediaUrl, '1s') || undefined;
  const creator = video.creator;

  return (
    <div className="pt-4">
      <div 
        className="relative w-full aspect-[16/9] overflow-hidden cursor-pointer group bg-muted"
        onClick={onTap}
      >
        {/* Video Player */}
        <HLSPlayer
          ref={playerRef}
          src={mediaUrl}
          autoplay={true}
          muted
          loop
          objectFit="cover"
          className="absolute inset-0 w-full h-full"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Trending Badge - Top Right - Dark glass to match like count in grid */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full">
          <span className="text-white text-xs font-semibold tracking-wide">
            {BADGE_TEXT[trendingPeriod]}
          </span>
          <span className="text-white/80">🔥</span>
        </div>

        {/* Bottom Content - Creator Info Only (no caption) */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Creator Info with Squircle Avatar */}
          {creator && (
            <div className="flex items-center gap-2.5">
              <SquircleAvatar
                size={36}
                src={creator.profile_photo_url}
                alt={creator.display_name || 'Creator'}
                fallback={(creator.display_name || 'G').charAt(0).toUpperCase()}
                hideRing
              />
              <p className="text-white text-sm font-semibold truncate min-w-0">
                {creator.display_name || 'Golfer'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WatchHeroVideo;
