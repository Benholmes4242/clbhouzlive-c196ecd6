/**
 * WatchShortCard - Individual video card for Watch grid
 * 
 * Features:
 * - 9:16 aspect ratio (portrait)
 * - LAZY VIDEO MOUNTING - Only mounts HLSPlayer when near viewport
 * - Like count overlay
 * - Creator name overlay
 * - Multi-media indicator
 */

import { useRef, useState, useCallback } from 'react';
import { Heart, Layers } from 'lucide-react';
import { WatchShort } from '@/hooks/useWatchShorts';
import { getStreamPoster } from '@/utils/stream';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { cn } from '@/lib/utils';

interface WatchShortCardProps {
  video: WatchShort;
  index: number;
  onTap: () => void;
  isAutoplayCandidate: boolean;
  /** Whether video should be mounted (controlled by parent grid) */
  shouldMountVideo?: boolean;
  /** Whether card is visible in viewport */
  isVisible?: boolean;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function WatchShortCard({ 
  video, 
  index, 
  onTap, 
  isAutoplayCandidate,
  shouldMountVideo = false,
  isVisible = false,
}: WatchShortCardProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const [posterHidden, setPosterHidden] = useState(false);
  const [hasError, setHasError] = useState(false);

  const primaryMedia = video.media[0];
  if (!primaryMedia) return null;

  const mediaUrl = primaryMedia.media_url;
  const posterUrl = primaryMedia.poster_url || getStreamPoster(mediaUrl, '1s') || undefined;
  const creator = video.creator;
  const likeCount = video.like_count || 0;
  const hasMultipleMedia = video.media.length > 1;

  // Determine if we should actually autoplay
  // Only autoplay if: mounted, visible, and is an autoplay candidate
  const shouldAutoplay = shouldMountVideo && isVisible && isAutoplayCandidate;

  const handleLoadedData = useCallback(() => {
    // Hide poster once video has data
    setPosterHidden(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  return (
    <div
      className={cn(
        "relative aspect-[3/4] overflow-hidden cursor-pointer bg-muted",
        "transition-transform duration-100 active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
      onClick={onTap}
      tabIndex={0}
      role="button"
      aria-label={`Watch video by ${creator?.display_name || 'Golfer'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
    >
      {/* Poster Image - shown until video loads OR if video not mounted */}
      {posterUrl && (!posterHidden || !shouldMountVideo) && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-10"
          loading={index < 6 ? 'eager' : 'lazy'}
        />
      )}

      {/* Video Player - ONLY mount when near viewport (key fix for performance) */}
      {shouldMountVideo && !hasError && (
        <HLSPlayer
          ref={playerRef}
          src={mediaUrl}
          autoplay={shouldAutoplay}
          muted
          loop
          objectFit="cover"
          className="absolute inset-0 w-full h-full"
          onLoadedData={handleLoadedData}
          onError={handleError}
          mediaId={video.id}
        />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-20" />

      {/* Like Count - Top Right */}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full z-30">
        <Heart className="w-3 h-3 text-white" />
        <span className="text-white text-xs font-medium">{formatCount(likeCount)}</span>
      </div>

      {/* Multi-media Indicator - Top Left */}
      {hasMultipleMedia && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full z-30">
          <Layers className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-medium">+{video.media.length - 1}</span>
        </div>
      )}

      {/* Creator Name - Bottom */}
      <div className="absolute bottom-2 left-2 right-2 z-30">
        <p className="text-white text-sm font-medium truncate">
          {creator?.display_name || 'Golfer'}
        </p>
      </div>
    </div>
  );
}

export default WatchShortCard;
