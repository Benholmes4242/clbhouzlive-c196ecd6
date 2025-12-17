import React, { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ActivityMediaItem } from './types';
import VideoOverlay from './VideoOverlay';
import GridAutoplayVideo from './GridAutoplayVideo';
import { Images, Trophy } from 'lucide-react';
import { RegisterVideoFn } from '@/hooks/useGridAutoplay';

interface HeroPostTileProps {
  item: ActivityMediaItem;
  onPress?: (postId: string) => void;
  registerVideo?: RegisterVideoFn;
  isPlaying?: boolean;
}

/**
 * Full-width hero tile for standout posts
 * Cinematic 16:9 aspect, spans both columns
 * Course tag ONLY appears on hero tiles (top-left)
 */
const HeroPostTile: React.FC<HeroPostTileProps> = ({ 
  item, 
  onPress, 
  registerVideo,
  isPlaying = false 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  const handleClick = useCallback(() => {
    onPress?.(item.postId);
  }, [item.postId, onPress]);

  const isVideo = item.type === 'video';
  const isAutoplayCandidate = item.isAutoplayCandidate ?? false;

  // Register video with autoplay hook
  useEffect(() => {
    if (!isVideo || !registerVideo) return;

    registerVideo({
      id: item.postId,
      element: videoRef.current,
      isCandidate: isAutoplayCandidate,
      sortIndex: item.sortIndex ?? 0,
    });

    // Clean up on unmount
    return () => {
      registerVideo({
        id: item.postId,
        element: null,
        isCandidate: isAutoplayCandidate,
        sortIndex: item.sortIndex ?? 0,
      });
    };
  }, [item.postId, isVideo, isAutoplayCandidate, item.sortIndex, registerVideo]);

  const handleCanPlay = useCallback(() => {
    setIsVideoReady(true);
  }, []);

  const thumbnailSrc = item.thumbnailUrl || item.url;
  
  // Course tag only on hero cards, positioned top-left (unless milestone is there)
  const showCourseTag = Boolean(item.courseName);

  return (
    <button
      type="button"
      className={cn(
        "col-span-2",
        "aspect-[16/9]",
        "relative overflow-hidden bg-muted/30"
      )}
      onClick={handleClick}
    >
      {/* 1) Safe thumbnail ALWAYS visible - prevents white flash */}
      <img
        src={thumbnailSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        draggable={false}
      />

      {/* 2) HLS-aware video fades in over the top once it can play */}
      {isVideo && isAutoplayCandidate && item.playbackUrl && (
        <GridAutoplayVideo
          ref={videoRef}
          src={item.playbackUrl}
          poster={thumbnailSrc}
          onCanPlay={handleCanPlay}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-150",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Bottom gradient overlay for readability */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

      {/* Video overlay with play/pause icon and duration */}
      {isVideo && (
        <VideoOverlay
          durationSeconds={item.durationSeconds}
          isPlaying={isAutoplayCandidate && isPlaying}
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
