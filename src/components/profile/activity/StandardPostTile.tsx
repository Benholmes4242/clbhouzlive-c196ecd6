import React, { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ActivityMediaItem } from './types';
import VideoOverlay from './VideoOverlay';
import { HLSPlayer, HLSPlayerRef, RegisterMediaFn } from '@/media';
import { Images, Trophy } from 'lucide-react';

interface StandardPostTileProps {
  item: ActivityMediaItem;
  onPress?: (postId: string) => void;
  registerVideo?: RegisterMediaFn;
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
  const playerRef = useRef<HLSPlayerRef>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [resolvedDurationSeconds, setResolvedDurationSeconds] = useState<number | null | undefined>(
    item.durationSeconds
  );
  
  const handleClick = useCallback(() => {
    onPress?.(item.postId);
  }, [item.postId, onPress]);

  const isVideo = item.type === 'video';
  const isAutoplayCandidate = item.isAutoplayCandidate ?? false;

  useEffect(() => {
    setResolvedDurationSeconds(item.durationSeconds);
  }, [item.durationSeconds]);

  // Force consistent aspect ratio for all grid tiles to prevent gaps
  const aspectClass = 'aspect-[3/4]';

  // Register video with autoplay hook
  useEffect(() => {
    if (!isVideo || !registerVideo) return;

    const checkAndRegister = () => {
      const el = playerRef.current?.getElement();
      if (el) {
        registerVideo({
          id: item.postId,
          element: el,
          isCandidate: isAutoplayCandidate,
          sortIndex: item.sortIndex ?? 0,
        });
      }
    };

    checkAndRegister();
    const retryTimer = setTimeout(checkAndRegister, 100);

    return () => {
      clearTimeout(retryTimer);
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

    // Fallback: derive duration from media metadata if DB value is missing/invalid
    const dbDuration = item.durationSeconds;
    const hasValidDbDuration = typeof dbDuration === 'number' && Number.isFinite(dbDuration) && dbDuration > 0;
    
    if (!hasValidDbDuration) {
      const el = playerRef.current?.getElement();
      if (el) {
        const d = el.duration;
        if (Number.isFinite(d) && d > 0 && d !== Infinity) {
          setResolvedDurationSeconds(d);
        }
      }
    }
  }, [item.durationSeconds]);

  const thumbnailSrc = item.thumbnailUrl || item.url;

  return (
    <button
      type="button"
      className={cn(
        aspectClass,
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
        <HLSPlayer
          ref={playerRef}
          src={item.playbackUrl}
          poster={thumbnailSrc}
          onLoadedData={handleCanPlay}
          loop
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-150",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Video overlay with play/pause icon and duration */}
      {isVideo && (
          <VideoOverlay
            durationSeconds={resolvedDurationSeconds}
            isPlaying={isAutoplayCandidate && isPlaying}
          />
      )}

      {/* Multi-media indicator - top-right */}
      {item.additionalMediaCount && item.additionalMediaCount > 0 && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-0.5 px-1.5 py-0.5 rounded-sq-pill bg-black/55 text-white text-[10px] font-medium">
          <Images className="h-2.5 w-2.5" />
          <span>+{item.additionalMediaCount}</span>
        </div>
      )}

      {/* Milestone indicator - top-left */}
      {item.isMilestone && (
        <div className="absolute top-2 left-2 z-20 flex items-center justify-center h-5 w-5 rounded-sq-pill bg-black/50">
          <Trophy className="h-2.5 w-2.5 text-amber-400" />
        </div>
      )}

      {/* NO course name on standard tiles - only on hero tiles */}
    </button>
  );
};

export default StandardPostTile;
