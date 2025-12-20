import React, { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { UnifiedMediaItem, UnifiedGridConfig, GridSurface } from './types';
import TileOverlay from './TileOverlay';
import GridAutoplayVideo from '@/components/profile/activity/GridAutoplayVideo';
import VideoOverlay from '@/components/profile/activity/VideoOverlay';
import { Images, Trophy } from 'lucide-react';
import { RegisterVideoFn } from '@/hooks/useGridAutoplay';
import { motion } from 'framer-motion';

interface UnifiedMediaTileProps {
  item: UnifiedMediaItem;
  config: UnifiedGridConfig;
  variant: 'portrait' | 'landscape';
  index: number;
  onPress?: (item: UnifiedMediaItem, index: number) => void;
  onAuthorClick?: (authorId: string) => void;
  registerVideo?: RegisterVideoFn;
  isPlaying?: boolean;
}

/**
 * Unified media tile component used by both Watch and Profile grids
 * 
 * Features:
 * - Portrait: 3:4 aspect ratio
 * - Landscape: 16:9, spans full width
 * - Configurable overlays (creator label, likes)
 * - Press feedback animation (scale 0.98 on tap)
 * - Consistent styling and autoplay behavior
 * 
 * Tap behavior by surface:
 * - Watch grid: Opens Shorts Fullscreen Player
 * - Profile Activity: Opens standard Post Viewer
 */
const UnifiedMediaTile: React.FC<UnifiedMediaTileProps> = ({
  item,
  config,
  variant,
  index,
  onPress,
  onAuthorClick,
  registerVideo,
  isPlaying = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [resolvedDurationSeconds, setResolvedDurationSeconds] = useState<number | null | undefined>(
    item.durationSeconds
  );
  
  const handleClick = useCallback(() => {
    onPress?.(item, index);
  }, [item, index, onPress]);

  const handleAuthorClick = useCallback(() => {
    if (item.creator?.id) {
      onAuthorClick?.(item.creator.id);
    }
  }, [item.creator?.id, onAuthorClick]);

  const isVideo = item.type === 'video';
  const isAutoplayCandidate = item.isAutoplayCandidate ?? false;
  const isLandscape = variant === 'landscape';

  useEffect(() => {
    setResolvedDurationSeconds(item.durationSeconds);
  }, [item.durationSeconds]);

  // Register video with autoplay hook
  useEffect(() => {
    if (!isVideo || !registerVideo || !config.autoplayEnabled) return;

    const checkAndRegister = () => {
      if (videoRef.current) {
        registerVideo({
          id: item.postId,
          element: videoRef.current,
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
  }, [item.postId, isVideo, isAutoplayCandidate, item.sortIndex, registerVideo, config.autoplayEnabled]);

  const handleCanPlay = useCallback(() => {
    setIsVideoReady(true);

    const dbDuration = item.durationSeconds;
    const hasValidDbDuration = typeof dbDuration === 'number' && Number.isFinite(dbDuration) && dbDuration > 0;
    
    if (!hasValidDbDuration && videoRef.current) {
      const d = videoRef.current.duration;
      if (Number.isFinite(d) && d > 0 && d !== Infinity) {
        setResolvedDurationSeconds(d);
      }
    }
  }, [item.durationSeconds]);

  const thumbnailSrc = item.thumbnailUrl || item.url;
  const aspectClass = isLandscape ? 'aspect-[16/9]' : 'aspect-[3/4]';

  return (
    <motion.button
      type="button"
      className={cn(
        aspectClass,
        "relative overflow-hidden bg-muted/30",
        isLandscape && "col-span-2"
      )}
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
    >
      {/* Thumbnail - always visible as fallback */}
      <img
        src={thumbnailSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        draggable={false}
      />

      {/* Video layer - fades in when ready */}
      {isVideo && isAutoplayCandidate && item.playbackUrl && config.autoplayEnabled && (
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

      {/* Bottom gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Video duration/play indicator */}
      {isVideo && (
        <VideoOverlay
          durationSeconds={resolvedDurationSeconds}
          isPlaying={isAutoplayCandidate && isPlaying}
        />
      )}

      {/* Multi-media indicator - top right */}
      {item.additionalMediaCount && item.additionalMediaCount > 0 && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-medium">
          <Images className="h-2.5 w-2.5" />
          <span>+{item.additionalMediaCount}</span>
        </div>
      )}

      {/* Milestone indicator - top left */}
      {item.isMilestone && (
        <div className="absolute top-2 left-2 z-20 flex items-center justify-center h-5 w-5 rounded-full bg-black/50">
          <Trophy className="h-2.5 w-2.5 text-amber-400" />
        </div>
      )}

      {/* Course tag - only on landscape tiles, top left */}
      {isLandscape && item.courseName && !item.isMilestone && (
        <div className="absolute left-3 top-3 z-20 max-w-[70%]">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/65 text-xs font-medium text-white shadow-sm truncate">
            {item.courseName}
          </span>
        </div>
      )}

      {/* Creator/Likes overlay */}
      <TileOverlay
        creatorName={item.creator?.name}
        creatorAvatar={item.creator?.avatar}
        likes={item.likes}
        showCreator={config.showCreator}
        showLikes={config.showLikes}
        variant={variant}
        onAuthorClick={handleAuthorClick}
      />
    </motion.button>
  );
};

export default UnifiedMediaTile;
