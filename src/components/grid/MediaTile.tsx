/**
 * MediaTile - Unified media tile for UniversalMediaGrid
 * 
 * UNIFIED WITH CLUBHOUSE: Uses visibility-based autoplay via IntersectionObserver
 * - managedByMediaRuntime={false} for direct browser-led autoplay
 * - autoplay based on 40% visibility threshold
 * - preload="auto" for instant buffering
 */

import React, { useCallback, useRef, useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Images, Trophy, Heart } from 'lucide-react';
import { UniversalMediaItem, UniversalGridConfig } from './types';
import { PostOwnerMenu } from '@/components/posts/PostOwnerMenu';


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
  /** Called when video first frame is ready for playback */
  onFirstFrameReady?: (itemId: string) => void;
  /** Whether this is the current user's own post */
  isOwnPost?: boolean;
  /** Called when edit action triggered (only for own posts) */
  onEdit?: (itemId: string) => void;
  /** Called when delete action triggered (only for own posts) */
  onDelete?: (itemId: string) => void;
}

const MediaTile = memo<MediaTileProps>(({
  item,
  config,
  variant,
  index,
  onPress,
  onAuthorClick,
  onFirstFrameReady,
  isOwnPost = false,
  onEdit,
  onDelete,
}) => {
  const tileRef = useRef<HTMLButtonElement>(null);
  const resolvedDuration = item.durationSeconds;

  const isVideo = item.type === 'video';
  const isLandscape = variant === 'landscape';
  const thumbnailSrc = item.thumbnailUrl || item.url;

  const aspectClass = isLandscape ? 'aspect-video' : 'aspect-[3/4]';

  const handleClick = useCallback(() => {
    onPress?.(item, index);
  }, [item, index, onPress]);

  const handleAuthorClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.creator?.id) {
      onAuthorClick?.(item.creator.id);
    }
  }, [item.creator?.id, onAuthorClick]);

  // Poster-only chassis: no playback tracking.
  useEffect(() => {
    if (isVideo) onFirstFrameReady?.(item.id);
  }, [isVideo, item.id, onFirstFrameReady]);


  
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
        isLandscape && 'col-span-2'  // Full width, no rounded corners
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
      
      {/* [VIDEOSTUB] Video/HLSPlayer + scrubber removed — poster <img> above is the only render */}
      
      {/* No gradient overlay - clean look */}
      
      {/* Unified meta layout - same for portrait and landscape */}
      {/* Likes above, name below, avatar bottom right */}
      <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
        {/* Text content - bottom left */}
        <div className="absolute left-3 bottom-3 flex flex-col gap-1 max-w-[calc(100%-80px)]">
          {/* Likes row - de-emphasised, tertiary style (above name) */}
          {config.showLikes && (item.likes || 0) > 0 && (
            <div className="flex items-center gap-1 text-white/50 text-[10px] leading-none font-normal">
              <Heart className="w-3 h-3" />
              <span>{item.likes || 0}</span>
            </div>
          )}

          {/* User name */}
          {config.showCreator && item.creator?.name && (
            <div
              className="text-white font-bold text-sm leading-tight cursor-pointer"
              onClick={handleAuthorClick}
            >
              <span className="truncate block">{item.creator.name}</span>
            </div>
          )}
        </div>

        {/* Avatar - bottom right, squircle */}
        {config.showCreator && item.creator?.avatar && (
          <div
            className="absolute right-3 bottom-3 w-[40px] h-[40px] rounded-[10px] overflow-hidden bg-black/40 backdrop-blur-md pointer-events-auto cursor-pointer"
            style={{
              boxShadow: '0 16px 32px rgba(0, 0, 0, 0.6)'
            }}
            onClick={handleAuthorClick}
          >
            <img
              src={item.creator.avatar}
              alt={item.creator.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
      
      {/* Duration badge - top left for videos (countdown when playing) */}
      {isVideo && config.showDuration && resolvedDuration && (
        <div className="absolute top-2 left-2 z-10">
          <div className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium">
            {isVisible
              ? formatDuration(Math.max(0, resolvedDuration - currentPlaybackTime))
              : formatDuration(resolvedDuration)
            }
          </div>
        </div>
      )}
      
      {/* Top-left override (milestone, multi-image count) - portrait only */}
      {!isLandscape && topLeftOverride && (
        <div className="absolute top-2 left-2 z-10">
          {topLeftOverride}
        </div>
      )}

      {/* Owner menu for own posts — self-wires Edit / Delete / Manage review */}
      {isOwnPost && (
        <PostOwnerMenu
          postId={item.postId}
          isOwnPost={isOwnPost}
          actorType={item.actorType}
          actorId={item.actorId}
          sourceReviewId={item.sourceReviewId}
          reviewCourseId={item.reviewCourseId}
          variant="overlay"
          floating
        />
      )}
    </motion.button>
  );
});

MediaTile.displayName = 'MediaTile';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default MediaTile;
