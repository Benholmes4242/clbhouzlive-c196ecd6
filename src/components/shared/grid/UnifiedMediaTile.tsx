import React, { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { UnifiedMediaItem, UnifiedGridConfig } from './types';
import { OverlayCorners } from '@/components/shared/overlay';
import { HLSPlayer, HLSPlayerRef, RegisterMediaFn } from '@/media';
import { Images, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { VideoScrubber } from '@/components/video/VideoScrubber';

interface UnifiedMediaTileProps {
  item: UnifiedMediaItem;
  config: UnifiedGridConfig;
  variant: 'portrait' | 'landscape';
  index: number;
  onPress?: (item: UnifiedMediaItem, index: number) => void;
  onAuthorClick?: (authorId: string) => void;
  registerVideo?: RegisterMediaFn;
  isPlaying?: boolean;
}

/**
 * Unified media tile component used by both Watch and Profile grids
 * 
 * Uses OverlayCorners for consistent overlay positioning:
 * - Top-left: Ranking pill (or milestone/multi-media indicator)
 * - Top-right: Club pill + Duration badge (stacked)
 * - Bottom-left: Creator name + Like count
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
  const playerRef = useRef<HLSPlayerRef>(null);
  const tileRef = useRef<HTMLButtonElement>(null); // Sentinel for IntersectionObserver
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [resolvedDurationSeconds, setResolvedDurationSeconds] = useState<number | null | undefined>(
    item.durationSeconds
  );
  
  const handleClick = useCallback(() => {
    onPress?.(item, index);
  }, [item, index, onPress]);

  const handleAuthorClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Register video with autoplay hook - using tile wrapper as observeTarget
  useEffect(() => {
    if (!isVideo || !registerVideo || !config.autoplayEnabled) return;

    const checkAndRegister = () => {
      const videoEl = playerRef.current?.getElement();
      const tileEl = tileRef.current;
      if (videoEl && tileEl) {
        registerVideo({
          id: item.postId,
          element: videoEl,
          observeTarget: tileEl, // Observe the tile wrapper, not the video element
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
        observeTarget: null, // Explicit cleanup
        isCandidate: isAutoplayCandidate,
        sortIndex: item.sortIndex ?? 0,
      });
    };
  }, [item.postId, isVideo, isAutoplayCandidate, item.sortIndex, registerVideo, config.autoplayEnabled]);

  const handleCanPlay = useCallback(() => {
    // Capture video element reference for scrubber
    const el = playerRef.current?.getElement();
    if (el) setVideoEl(el);

    const dbDuration = item.durationSeconds;
    const hasValidDbDuration = typeof dbDuration === 'number' && Number.isFinite(dbDuration) && dbDuration > 0;
    
    if (!hasValidDbDuration && playerRef.current) {
      const d = playerRef.current.getDuration();
      if (Number.isFinite(d) && d > 0 && d !== Infinity) {
        setResolvedDurationSeconds(d);
      }
    }
  }, [item.durationSeconds]);

  const thumbnailSrc = item.thumbnailUrl || item.url;
  const aspectClass = isLandscape ? 'aspect-[16/9]' : 'aspect-[3/4]';
  
  // Determine top-left override content (priority: milestone > multi-media)
  const hasMultiMedia = item.additionalMediaCount && item.additionalMediaCount > 0;
  
  let topLeftOverride: React.ReactNode = null;
  if (item.isMilestone) {
    topLeftOverride = (
      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-black/50">
        <Trophy className="h-2.5 w-2.5 text-amber-400" />
      </div>
    );
  } else if (hasMultiMedia) {
    topLeftOverride = (
      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-medium">
        <Images className="h-2.5 w-2.5" />
        <span>+{item.additionalMediaCount}</span>
      </div>
    );
  }

  // Build club object if course name exists (for landscape tiles)
  const clubData = isLandscape && item.courseName && item.golfCourseId ? {
    id: item.golfCourseId,
    name: item.courseName,
  } : null;

  return (
    <motion.button
      ref={tileRef}
      type="button"
      className={cn(
        aspectClass,
        "relative overflow-hidden bg-muted/30",
        isLandscape && "col-span-2"
      )}
      onClick={handleClick}
    >
      {/* 
        Single media layer - EITHER thumbnail OR HLSPlayer (not both!)
        When HLSPlayer renders, it handles its own poster→video crossfade.
        This prevents the double-poster flicker bug.
      */}
      {isVideo && isAutoplayCandidate && item.playbackUrl && config.autoplayEnabled ? (
        <HLSPlayer
          ref={playerRef}
          src={item.playbackUrl}
          poster={thumbnailSrc}
          autoplay={isPlaying}
          muted
          loop
          objectFit="cover"
          externallyManaged
          onLoadedData={handleCanPlay}
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        /* Thumbnail fallback for non-video / non-autoplay / missing playbackUrl */
        <img
          src={thumbnailSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      )}

      {/* Video scrubber - positioned at bottom of media, above gradient/meta */}
      {isVideo && videoEl && (
        <VideoScrubber videoEl={videoEl} height={3} />
      )}

      {/* Bottom gradient overlay for text legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Unified overlay system */}
      <OverlayCorners
        surface="tile"
        variant={variant}
        club={clubData}
        durationSeconds={isVideo ? resolvedDurationSeconds : undefined}
        durationPlacement="top-left"
        creatorName={item.creator?.name}
        creatorAvatar={item.creator?.avatar}
        likes={item.likes}
        showCreator={config.showCreator}
        showLikes={config.showLikes}
        showAvatar={config.showCreator}
        onCreatorClick={handleAuthorClick}
        topLeftOverride={topLeftOverride}
        hideRankingIfOverride={true}
      />
    </motion.button>
  );
};

export default UnifiedMediaTile;
