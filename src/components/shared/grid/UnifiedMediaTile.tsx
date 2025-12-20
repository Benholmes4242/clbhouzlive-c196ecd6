import React, { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { UnifiedMediaItem, UnifiedGridConfig } from './types';
import TileOverlay from './TileOverlay';
import GridAutoplayVideo from '@/components/profile/activity/GridAutoplayVideo';
import GlassPill from '@/components/shared/GlassPill';
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
 * - Configurable overlays using unified GlassPill system
 * - Press feedback animation (scale 0.98 on tap)
 * 
 * Overlay layout:
 * - Top-left: Ranking pill (Popular today / Trending) OR course tag on landscape
 * - Top-right: Duration badge
 * - Bottom-left (stacked): Creator name, Like count
 * - Bottom-right: Creator avatar squircle
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
  
  // Determine what shows in top-left (priority: milestone > multi-media > ranking > course tag)
  const hasMultiMedia = item.additionalMediaCount && item.additionalMediaCount > 0;
  const hasRanking = item.isPopular || item.isTrending;
  const showCourseTag = isLandscape && item.courseName && !item.isMilestone && !hasMultiMedia && !hasRanking;

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

      {/* Bottom gradient overlay for text legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Top-left indicators (mutually exclusive, priority order) */}
      {item.isMilestone && (
        <div className="absolute top-2 left-2 z-20 flex items-center justify-center h-5 w-5 rounded-full bg-black/50">
          <Trophy className="h-2.5 w-2.5 text-amber-400" />
        </div>
      )}
      
      {!item.isMilestone && hasMultiMedia && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-medium">
          <Images className="h-2.5 w-2.5" />
          <span>+{item.additionalMediaCount}</span>
        </div>
      )}

      {/* Course tag on landscape - only if no ranking/milestone/multi-media */}
      {showCourseTag && (
        <div className="absolute left-3 top-3 z-20 max-w-[70%]">
          <GlassPill
            label={item.courseName!}
            icon="📍"
            variant="club"
            size="sm"
          />
        </div>
      )}

      {/* Unified overlay: Ranking (top-left), Duration (top-right), Creator + Likes (bottom) */}
      <TileOverlay
        creatorName={item.creator?.name}
        creatorAvatar={item.creator?.avatar}
        likes={item.likes}
        durationSeconds={isVideo ? resolvedDurationSeconds : undefined}
        isPopular={item.isPopular}
        isTrending={item.isTrending}
        showCreator={config.showCreator}
        showLikes={config.showLikes}
        showDuration={isVideo}
        showAvatar={config.showCreator}
        showRanking={!item.isMilestone && !hasMultiMedia && !showCourseTag}
        variant={variant}
        onAuthorClick={handleAuthorClick}
      />
    </motion.button>
  );
};

export default UnifiedMediaTile;
