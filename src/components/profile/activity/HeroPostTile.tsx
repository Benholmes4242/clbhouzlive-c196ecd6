import React, { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ActivityMediaItem } from './types';
import VideoOverlay from './VideoOverlay';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { RegisterMediaFn } from '@/media';
import { Images, Trophy } from 'lucide-react';
import { getFilterClass } from '@/utils/studioFilters';

interface HeroPostTileProps {
  item: ActivityMediaItem;
  onPress?: (postId: string) => void;
  registerVideo?: RegisterMediaFn;
  isPlaying?: boolean;
  filterId?: string | null;
  isVideoReady?: boolean;  // From parent queue
  onReady?: (id: string) => void;  // Callback to parent
}

/**
 * Full-width hero tile for standout posts
 * Cinematic 16:9 aspect, spans both columns
 * Course tag ONLY appears on hero tiles (top-left)
 * 
 * TikTok-level optimizations:
 * - UnifiedVideoPlayer for source stability, pool promotion, buffering debounce
 * - 50%/10% hysteresis autoplay thresholds
 * - 150ms crossfade timing
 */
const HeroPostTile: React.FC<HeroPostTileProps> = ({ 
  item, 
  onPress, 
  registerVideo,
  isPlaying = false,
  filterId,
  isVideoReady = false,
  onReady,
}) => {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const containerRef = useRef<HTMLButtonElement>(null);
  const hasReportedReadyRef = useRef(false);
  const filterClass = getFilterClass(filterId);
  const [resolvedDurationSeconds, setResolvedDurationSeconds] = useState<number | null | undefined>(
    item.durationSeconds
  );
  const [shouldPlay, setShouldPlay] = useState(false);
  
  const handleClick = useCallback(() => {
    onPress?.(item.postId);
  }, [item.postId, onPress]);

  const isVideo = item.type === 'video';
  const isAutoplayCandidate = item.isAutoplayCandidate ?? false;

  useEffect(() => {
    setResolvedDurationSeconds(item.durationSeconds);
  }, [item.durationSeconds]);

  // Hysteresis-based autoplay: 50% to start, 10% to stop
  useEffect(() => {
    if (!containerRef.current || !isVideo || !isAutoplayCandidate) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const ratio = entry.intersectionRatio;
        
        setShouldPlay(prev => {
          if (!prev && ratio >= 0.5) return true;
          if (prev && ratio < 0.1) return false;
          return prev;
        });
      },
      { threshold: [0, 0.1, 0.5, 1.0] }
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVideo, isAutoplayCandidate]);

  const handleCanPlay = useCallback(() => {
    // Report ready to parent queue
    if (!hasReportedReadyRef.current && isVideo) {
      hasReportedReadyRef.current = true;
      onReady?.(item.postId);
    }

    const dbDuration = item.durationSeconds;
    const hasValidDbDuration = typeof dbDuration === 'number' && Number.isFinite(dbDuration) && dbDuration > 0;
    
    if (!hasValidDbDuration && playerRef.current) {
      const d = playerRef.current.getDuration();
      if (Number.isFinite(d) && d > 0 && d !== Infinity) {
        setResolvedDurationSeconds(d);
      }
    }
  }, [item.postId, item.durationSeconds, isVideo, onReady]);
  
  // Reset ready flag when item changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
  }, [item.postId]);

  const thumbnailSrc = item.thumbnailUrl || item.url;
  
  // Course tag only on hero cards, positioned top-left (unless milestone is there)
  const showCourseTag = Boolean(item.courseName);

  return (
    <button
      ref={containerRef}
      type="button"
      className={cn(
        "col-span-2",
        "aspect-[16/9]",
        "relative overflow-hidden bg-muted/30"
      )}
      onClick={handleClick}
    >
      {/* Filtered pixel layer */}
      <div className={cn("absolute inset-0 w-full h-full", filterClass)}>
        {/* 1) Priority thumbnail for hero tiles - prevents white flash */}
        <img
          src={thumbnailSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          draggable={false}
        />

        {/* 2) UnifiedVideoPlayer with 150ms crossfade */}
        {isVideo && isAutoplayCandidate && item.playbackUrl && (
          <div className={cn(
            "absolute inset-0 transition-opacity duration-150 ease-out",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <UnifiedVideoPlayer
              ref={playerRef}
              src={item.playbackUrl}
              posterUrl={thumbnailSrc}
              autoplay={shouldPlay}
              muted
              loop
              managedByMediaRuntime={false}
              preload="auto"
              surface="profile"
              mediaId={item.postId}
              onLoadedData={handleCanPlay}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Bottom gradient overlay for readability - OUTSIDE filtered layer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

      {/* Video overlay with play/pause icon and duration */}
      {isVideo && (
        <VideoOverlay
          durationSeconds={resolvedDurationSeconds}
          isPlaying={isAutoplayCandidate && shouldPlay}
        />
      )}

      {/* TOP-LEFT: Course tag (only on hero cards) */}
      {showCourseTag && !item.isMilestone && (
        <div className="absolute left-3 top-3 z-20 max-w-[70%]">
          <span className="inline-flex items-center px-2.5 py-1 rounded-sq-pill bg-black/65 text-xs font-medium text-white shadow-sm truncate">
            {item.courseName}
          </span>
        </div>
      )}

      {/* TOP-RIGHT: Multi-media indicator */}
      {item.additionalMediaCount && item.additionalMediaCount > 0 && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-sq-pill bg-black/55 text-white text-xs font-medium">
          <Images className="h-3 w-3" />
          <span>+{item.additionalMediaCount}</span>
        </div>
      )}

      {/* TOP-LEFT: Milestone indicator (takes precedence over course tag position) */}
      {item.isMilestone && (
        <div className="absolute top-3 left-3 z-20 flex items-center justify-center h-6 w-6 rounded-sq-pill bg-black/50">
          <Trophy className="h-3 w-3 text-amber-400" />
        </div>
      )}
    </button>
  );
};

export default HeroPostTile;