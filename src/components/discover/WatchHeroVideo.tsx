/**
 * WatchHeroVideo - Hero video card for Watch tab
 * 
 * Displays the most liked video with:
 * - 16:9 aspect ratio
 * - Trending badge based on timeframe
 * - Creator info overlay
 * - Like count badge
 * - Autoplay on mount (muted)
 */

import React, { useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart } from 'lucide-react';
import { HeroVideo, TrendingPeriod } from '@/hooks/useWatchHeroVideo';
import { getStreamPoster } from '@/utils/stream';
import { HLSPlayer, HLSPlayerRef } from '@/media';

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

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

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
      <div className="px-4 pt-4">
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden">
          <Skeleton className="absolute inset-0" />
        </div>
      </div>
    );
  }

  // No video available
  if (!video || video.media.length === 0) {
    return null;
  }

  const primaryMedia = video.media[0];
  const mediaUrl = primaryMedia.media_url;
  const posterUrl = primaryMedia.poster_url || getStreamPoster(mediaUrl, '1s') || undefined;
  const creator = video.creator;
  const likeCount = video.like_count || 0;

  return (
    <div className="px-4 pt-4">
      <div 
        className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer group bg-muted"
        onClick={onTap}
      >
        {/* Video Player */}
        <HLSPlayer
          ref={playerRef}
          src={mediaUrl}
          poster={posterUrl}
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

        {/* Like Count Badge - Top Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
          <Heart className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-medium">{formatCount(likeCount)}</span>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Trending Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-3">
            <span className="text-white text-xs font-semibold tracking-wide">
              {BADGE_TEXT[trendingPeriod]}
            </span>
            <span className="text-white/80">🔥</span>
          </div>

          {/* Caption */}
          {video.content && (
            <p className="text-white text-sm font-medium line-clamp-2 mb-3">
              {video.content}
            </p>
          )}

          {/* Creator Info */}
          {creator && (
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9 border-2 border-white/30">
                <AvatarImage src={creator.profile_photo_url || undefined} />
                <AvatarFallback className="bg-white/20 text-white text-sm">
                  {(creator.display_name || creator.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {creator.display_name || creator.username || 'Unknown'}
                </p>
                {creator.username && (
                  <p className="text-white/70 text-xs truncate">
                    @{creator.username}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WatchHeroVideo;
