import React, { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ActivityMediaItem } from './types';
import VideoOverlay from './VideoOverlay';
import { Images, Trophy } from 'lucide-react';
import { RegisterVideoFn } from '@/hooks/useGridAutoplay';

interface StandardPostTileProps {
  item: ActivityMediaItem;
  onPress?: (postId: string) => void;
  registerVideo?: RegisterVideoFn;
  isPlaying?: boolean;
}

/**
 * Standard tile for two-column waterfall grid
 * Consistent 3:4 aspect ratio with pointed corners
 * No course tag on standard tiles (only hero)
 */
const StandardPostTile: React.FC<StandardPostTileProps> = ({ 
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
  
  // Force consistent aspect ratio for all grid tiles to prevent gaps
  const aspectClass = 'aspect-[3/4]';

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

  return (
    <button
      type="button"
      className={cn(
        aspectClass,
        "relative overflow-hidden bg-muted/30",
        "active:scale-[0.97] transition-transform duration-150"
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

      {/* 2) Video fades in over the top once it can play */}
      {isVideo && isAutoplayCandidate && item.playbackUrl && (
        <video
          ref={videoRef}
          src={item.playbackUrl}
          poster={thumbnailSrc}
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={handleCanPlay}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-150",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Video overlay with play/pause icon and duration */}
      {isVideo && (
        <VideoOverlay
          durationSeconds={item.durationSeconds}
          isPlaying={isAutoplayCandidate && isPlaying}
        />
      )}

      {/* Multi-media indicator - top-right */}
      {item.additionalMediaCount && item.additionalMediaCount > 0 && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-medium">
          <Images className="h-2.5 w-2.5" />
          <span>+{item.additionalMediaCount}</span>
        </div>
      )}

      {/* Milestone indicator - top-left */}
      {item.isMilestone && (
        <div className="absolute top-2 left-2 z-20 flex items-center justify-center h-5 w-5 rounded-full bg-black/50">
          <Trophy className="h-2.5 w-2.5 text-amber-400" />
        </div>
      )}

      {/* NO course name on standard tiles - only on hero tiles */}
    </button>
  );
};

export default StandardPostTile;
