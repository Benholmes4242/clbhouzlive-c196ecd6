import React, { useCallback, useRef, useEffect, useState, memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { UnifiedMediaItem, UnifiedGridConfig, GridSurface } from './types';
import { OverlayCorners, ReviewTileOverlay } from '@/components/shared/overlay';
import { RegisterMediaFn } from '@/media';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import type { MediaSurface } from '@/media/runtime/MediaRuntime';
import { Images, Trophy, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { logGridItemRender, logGridItemIntersect, logGridItemPlayAttempt } from '@/utils/gridAuditTimeline';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { AchievementBadgesOverlay } from '@/components/post/badges/AchievementBadgesOverlay';
import { TileOptionsMenu } from '@/components/grid/TileOptionsMenu';

/**
 * Map grid surface to MediaRuntime surface
 */
function mapGridSurfaceToMediaSurface(gridSurface: GridSurface | undefined): MediaSurface {
  switch (gridSurface) {
    case 'profile-activity':
    case 'profile':
      return 'profile';
    case 'watch':
      return 'watch';
    default:
      return 'grid';
  }
}

// Debug logging for video lifecycle analysis - ENABLED for profile debugging
const DEBUG_UNIFIED_TILE = true;
const logTile = (event: string, data?: any) => {
  if (!DEBUG_UNIFIED_TILE) return;
  const timestamp = performance.now().toFixed(2);
  console.log(`%c[${timestamp}ms] [UnifiedMediaTile] ${event}`, 'color: #22c55e;', data || '');
};

interface UnifiedMediaTileProps {
  item: UnifiedMediaItem;
  config: UnifiedGridConfig;
  variant: 'portrait' | 'landscape';
  index: number;
  onPress?: (item: UnifiedMediaItem, index: number) => void;
  onAuthorClick?: (authorId: string) => void;
  registerVideo?: RegisterMediaFn;
  isPlaying?: boolean;
  isVideoReady?: boolean;           // NEW: Video ready state
  onReady?: (id: string) => void;    // NEW: Video ready callback
  /** Whether this is the current user's own post */
  isOwnPost?: boolean;
  /** Called when delete action triggered (only for own posts) */
  onDelete?: (postId: string) => void;
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
  isVideoReady = false,
  onReady,
  isOwnPost = false,
  onDelete,
}) => {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const tileRef = useRef<HTMLButtonElement>(null); // Sentinel for IntersectionObserver
  const hasReportedReadyRef = useRef(false);
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

  // Log mount/unmount - with audit timeline
  useEffect(() => {
    logGridItemRender(item.postId, index, isVideo);
    logTile('MOUNT', { 
      postId: item.postId,
      isVideo,
      isAutoplayCandidate,
      variant,
      index,
      isPlaying
    });
    return () => {
      logTile('UNMOUNT', { postId: item.postId });
    };
  }, []);

  // Reset ready flag when item changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
  }, [item.postId]);

  // Log isPlaying changes - with audit timeline
  useEffect(() => {
    if (isPlaying) {
      logGridItemPlayAttempt(item.postId, 'isPlaying_prop_change');
    }
    logTile('IS_PLAYING_CHANGE', { 
      postId: item.postId,
      isPlaying,
      isVideo,
      isAutoplayCandidate 
    });
  }, [isPlaying, item.postId, isVideo, isAutoplayCandidate]);

  useEffect(() => {
    setResolvedDurationSeconds(item.durationSeconds);
  }, [item.durationSeconds]);

  // Register video with autoplay hook - using tile wrapper as observeTarget
  // CRITICAL: Only attempt registration if the video player will actually render (isAutoplayCandidate)
  useEffect(() => {
    // Skip if not a video, no register function, autoplay disabled, or not an autoplay candidate
    // The video element only exists if isAutoplayCandidate is true (see render condition below)
    if (!isVideo || !registerVideo || !config.autoplayEnabled || !isAutoplayCandidate) {
      logTile('REGISTER_SKIPPED', { 
        postId: item.postId, 
        isVideo, 
        hasRegisterVideo: !!registerVideo,
        autoplayEnabled: config.autoplayEnabled,
        isAutoplayCandidate,
      });
      return;
    }

    let registered = false;
    let retryCount = 0;
    const maxRetries = 5; // Increase retries for slower renders

    const checkAndRegister = () => {
      const videoEl = playerRef.current?.getVideoElement();
      const tileEl = tileRef.current;
      
      if (videoEl && tileEl) {
        logTile('✅ REGISTERING', { 
          postId: item.postId, 
          isAutoplayCandidate, 
          sortIndex: item.sortIndex,
          surface: config.surface,
        });
        registerVideo({
          id: item.postId,
          element: videoEl,
          observeTarget: tileEl, // Observe the tile wrapper, not the video element
          isCandidate: isAutoplayCandidate,
          sortIndex: item.sortIndex ?? 0,
        });
        registered = true;
      } else {
        retryCount++;
        logTile('⏳ REGISTER_WAITING', { 
          postId: item.postId, 
          hasVideoEl: !!videoEl, 
          hasTileEl: !!tileEl,
          retry: retryCount,
        });
        
        // Retry with increasing delay if video element not ready yet
        if (retryCount < maxRetries) {
          setTimeout(checkAndRegister, 100 * retryCount);
        } else {
          logTile('❌ REGISTER_FAILED - Max retries exceeded', { postId: item.postId });
        }
      }
    };

    // Initial check with small delay to allow React to mount the player
    const initialTimer = setTimeout(checkAndRegister, 50);

    return () => {
      clearTimeout(initialTimer);
      if (registered) {
        logTile('🗑️ UNREGISTERING', { postId: item.postId });
        registerVideo({
          id: item.postId,
          element: null,
          observeTarget: null, // Explicit cleanup
          isCandidate: isAutoplayCandidate,
          sortIndex: item.sortIndex ?? 0,
        });
      }
    };
  }, [item.postId, isVideo, isAutoplayCandidate, item.sortIndex, registerVideo, config.autoplayEnabled, config.surface]);

  const handleCanPlay = useCallback(() => {
    // Capture video element reference for scrubber
    const el = playerRef.current?.getVideoElement();
    if (el) setVideoEl(el);

    const dbDuration = item.durationSeconds;
    const hasValidDbDuration = typeof dbDuration === 'number' && Number.isFinite(dbDuration) && dbDuration > 0;
    
    if (!hasValidDbDuration && playerRef.current) {
      const d = playerRef.current.getDuration();
      if (Number.isFinite(d) && d > 0 && d !== Infinity) {
        setResolvedDurationSeconds(d);
      }
    }
    
    // Report video ready for prefetch queue
    if (!hasReportedReadyRef.current && isVideo) {
      hasReportedReadyRef.current = true;
      logTile('VIDEO_READY', { postId: item.postId });
      onReady?.(item.postId);
    }
  }, [item.durationSeconds, item.postId, isVideo, onReady]);

  const thumbnailSrc = item.thumbnailUrl || item.url;
  const aspectClass = isLandscape ? 'aspect-[16/9]' : 'aspect-[3/4]';
  
  // Get filter class for studio filters
  const filterClass = getFilterClass(item.filterId);
  
  // Get crop/rotate/adjustments from studioEdits
  const studioEdits = (item as any).studioEdits;
  const cropClass = getCropWrapperClass(studioEdits?.crop);
  const pixelLayerStyle = getPixelLayerStyle(studioEdits);
  
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
        "w-full", // IMPORTANT: ensure tile has width even when wrapped (e.g., ActivityGridV2)
        "relative overflow-hidden bg-muted/30",
        isLandscape && "col-span-2"
      )}
      onClick={handleClick}
    >
      {/* Pixel layer with crop wrapper */}
      <div className={cn("absolute inset-0", cropClass)}>
        {/* Filtered + rotated pixel layer - wraps thumbnail and video */}
        <div 
          className={cn("w-full h-full", filterClass)}
          style={pixelLayerStyle}
        >
          {/* Thumbnail - only show before video is ready (paused-video-first) */}
          {(!isVideo || !isVideoReady) && (
            <img
              src={thumbnailSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
          )}

          {/* Video layer - uses UnifiedVideoPlayer (handles its own poster→video crossfade) */}
          {/* FIX: Use postId as mediaId to match registration ID and ensure playingIds check works */}
          {isVideo && isAutoplayCandidate && item.playbackUrl && config.autoplayEnabled && (
            <div className={cn(
              "absolute inset-0 transition-opacity duration-200",
              isVideoReady ? "opacity-100" : "opacity-0"
            )}>
              <UnifiedVideoPlayer
                ref={playerRef}
                src={item.playbackUrl}
                autoplay={isPlaying}
                muted
                loop
                objectFit="cover"
                managedByMediaRuntime={true}
                surface={mapGridSurfaceToMediaSurface(config.surface)}
                mediaId={item.postId}
                onLoadedData={handleCanPlay}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          )}
          
          {/* Skeleton overlay - shown before video is ready OR when playing but not yet confirmed */}
          {/* FIX: Hide spinner when isPlaying is true (video is being played by MediaRuntime) */}
          {isVideo && !isVideoReady && !isPlaying && (
            <div className="absolute inset-0 bg-zinc-800/60 animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          )}
        </div>
      </div>

      {/* Achievement Badges overlay - top left */}
      <AchievementBadgesOverlay badgeIds={item.badges} />

      {/* Text overlays from studioEdits - OUTSIDE filtered layer */}
      {studioEdits?.textOverlays?.length > 0 && (
        <TextOverlayRenderer
          textOverlays={studioEdits.textOverlays}
          isEditable={false}
        />
      )}

      {/* Video scrubber - positioned at bottom of media, above gradient/meta */}
      {isVideo && videoEl && (
        <VideoScrubber videoEl={videoEl} height={3} />
      )}

      {/* Bottom gradient overlay for text legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* DEBUG: Log review fields - disabled after debugging */}

      {/* Review overlay for review posts - takes priority over standard overlay */}
      {item.isReview && item.courseName && typeof item.reviewRating === 'number' ? (
        <ReviewTileOverlay
          courseName={item.courseName}
          courseLocation={item.courseLocation}
          rating={item.reviewRating}
          user={item.creator ? {
            name: item.creator.name,
            username: item.creator.username,
            avatar: item.creator.avatar,
          } : undefined}
        />
      ) : (
        /* Unified overlay system for non-review posts */
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
      )}

      {/* Options menu for own posts - top right */}
      {isOwnPost && onDelete && (
        <TileOptionsMenu 
          onDelete={() => onDelete(item.postId)}
        />
      )}
    </motion.button>
  );
};

UnifiedMediaTile.displayName = 'UnifiedMediaTile';

export default memo(UnifiedMediaTile);
