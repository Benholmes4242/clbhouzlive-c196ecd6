/**
 * MediaTile - Unified media tile for UniversalMediaGrid
 * 
 * Handles both images and videos with:
 * - HLSPlayer integration for video
 * - Autoplay via MediaRuntime
 * - Configurable overlays
 * - Duration badge
 * - Creator info
 * - Enhanced landscape variant with metadata overlay
 */

import React, { useCallback, useRef, useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { HLSPlayer, HLSPlayerRef, RegisterMediaFn } from '@/media';
import { OverlayCorners } from '@/components/shared/overlay';
import { Images, Trophy, Heart, MessageCircle } from 'lucide-react';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { UniversalMediaItem, UniversalGridConfig, PORTRAIT_ASPECT, LANDSCAPE_ASPECT } from './types';

// Format counts for display (1K, 1.5M, etc.)
function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

interface MediaTileProps {
  item: UniversalMediaItem;
  config: UniversalGridConfig;
  variant: 'portrait' | 'landscape';
  index: number;
  onPress?: (item: UniversalMediaItem, index: number) => void;
  onAuthorClick?: (authorId: string) => void;
  registerMedia?: RegisterMediaFn;
  isPlaying?: boolean;
}

const MediaTile = memo<MediaTileProps>(({
  item,
  config,
  variant,
  index,
  onPress,
  onAuthorClick,
  registerMedia,
  isPlaying = false,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const tileRef = useRef<HTMLButtonElement>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [resolvedDuration, setResolvedDuration] = useState<number | null | undefined>(
    item.durationSeconds
  );
  
  const isVideo = item.type === 'video';
  const isAutoplayCandidate = item.isAutoplayCandidate ?? false;
  const isLandscape = variant === 'landscape';
  const thumbnailSrc = item.thumbnailUrl || item.url;
  
  // Aspect class
  const aspectClass = isLandscape ? 'aspect-video' : 'aspect-[3/4]';
  
  // Handle click
  const handleClick = useCallback(() => {
    onPress?.(item, index);
  }, [item, index, onPress]);
  
  // Handle author click
  const handleAuthorClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.creator?.id) {
      onAuthorClick?.(item.creator.id);
    }
  }, [item.creator?.id, onAuthorClick]);
  
  // Register with autoplay system
  useEffect(() => {
    if (!isVideo || !registerMedia) return;
    
    const checkAndRegister = () => {
      const videoEl = playerRef.current?.getElement();
      const tileEl = tileRef.current;
      
      if (videoEl && tileEl) {
        registerMedia({
          id: item.postId,
          element: videoEl,
          observeTarget: tileEl,
          isCandidate: isAutoplayCandidate,
          sortIndex: item.sortIndex ?? index,
        });
      }
    };
    
    checkAndRegister();
    const retryTimer = setTimeout(checkAndRegister, 100);
    
    return () => {
      clearTimeout(retryTimer);
      registerMedia({
        id: item.postId,
        element: null,
        observeTarget: null,
        isCandidate: isAutoplayCandidate,
        sortIndex: item.sortIndex ?? index,
      });
    };
  }, [item.postId, isVideo, isAutoplayCandidate, item.sortIndex, index, registerMedia]);
  
  // Handle video ready
  const handleCanPlay = useCallback(() => {
    const el = playerRef.current?.getElement();
    if (el) setVideoEl(el);
    
    // Resolve duration if not provided
    if (!item.durationSeconds && playerRef.current) {
      const d = playerRef.current.getDuration();
      if (Number.isFinite(d) && d > 0 && d !== Infinity) {
        setResolvedDuration(d);
      }
    }
  }, [item.durationSeconds]);
  
  // Top-left override content
  let topLeftOverride: React.ReactNode = null;
  
  if (item.isMilestone) {
    topLeftOverride = (
      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-black/50">
        <Trophy className="h-2.5 w-2.5 text-amber-400" />
      </div>
    );
  } else if (item.additionalMediaCount && item.additionalMediaCount > 0) {
    topLeftOverride = (
      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-medium">
        <Images className="h-2.5 w-2.5" />
        <span>+{item.additionalMediaCount}</span>
      </div>
    );
  }
  
  // Club data for landscape tiles
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
        'relative overflow-hidden bg-muted/30',
        isLandscape && 'col-span-2 rounded-lg shadow-sm'
      )}
      onClick={handleClick}
    >
      {/* Thumbnail - always visible as fallback */}
      <img
        src={thumbnailSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        draggable={false}
      />
      
      {/* Video layer */}
      {isVideo && isAutoplayCandidate && item.playbackUrl && (
        <HLSPlayer
          ref={playerRef}
          src={item.playbackUrl}
          poster={thumbnailSrc}
          autoplay={isPlaying}
          muted
          loop
          objectFit="cover"
          externallyManaged
          managedByMediaRuntime={true}
          mediaId={item.postId}
          onLoadedData={handleCanPlay}
          className="absolute inset-0 h-full w-full"
        />
      )}
      
      {/* Video scrubber */}
      {isVideo && videoEl && (
        <VideoScrubber videoEl={videoEl} height={3} />
      )}
      
      {/* Enhanced landscape overlay with metadata */}
      {isLandscape && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <div className="flex items-center gap-3">
            {/* Creator avatar */}
            {config.showCreator && item.creator?.avatar && (
              <div 
                className="shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 cursor-pointer"
                onClick={handleAuthorClick}
              >
                <img 
                  src={item.creator.avatar} 
                  alt={item.creator.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Text content */}
            <div className="flex-1 min-w-0">
              {/* Course name or caption */}
              {item.courseName && (
                <p className="text-white font-semibold text-sm line-clamp-1 mb-0.5">
                  {item.courseName}
                </p>
              )}
              {/* Creator name */}
              {config.showCreator && item.creator?.name && (
                <p 
                  className="text-white/80 text-xs truncate cursor-pointer hover:text-white"
                  onClick={handleAuthorClick}
                >
                  {item.creator.name}
                </p>
              )}
            </div>
            
            {/* Engagement stats */}
            {config.showLikes && ((item.likes || 0) > 0 || (item.commentCount || 0) > 0) && (
              <div className="text-white/90 flex items-center gap-3 text-sm">
                {(item.likes || 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" fill="currentColor" />
                    {formatCount(item.likes || 0)}
                  </span>
                )}
                {(item.commentCount || 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {formatCount(item.commentCount || 0)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Portrait tile overlay system (existing) */}
      {!isLandscape && (
        <>
          {/* Bottom gradient for text legibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Overlay system */}
          <OverlayCorners
            surface="tile"
            variant={variant}
            club={clubData}
            durationSeconds={isVideo && config.showDuration ? resolvedDuration : undefined}
            durationPlacement="top-left"
            creatorName={config.showCreator ? item.creator?.name : undefined}
            creatorAvatar={config.showCreator ? item.creator?.avatar : undefined}
            likes={config.showLikes ? item.likes : undefined}
            showCreator={config.showCreator}
            showLikes={config.showLikes}
            showAvatar={config.showCreator}
            onCreatorClick={handleAuthorClick}
            topLeftOverride={topLeftOverride}
            hideRankingIfOverride={true}
          />
        </>
      )}
    </motion.button>
  );
});

MediaTile.displayName = 'MediaTile';

export default MediaTile;
