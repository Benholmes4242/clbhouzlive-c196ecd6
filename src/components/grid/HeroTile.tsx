/**
 * HeroTile - Hero video tile for hero-grid layouts
 * 
 * Full-width 16:9 video with special treatment:
 * - Always autoplays when visible (if heroAutoplay: true)
 * - Shows creator info prominently
 * - Click opens fullscreen player
 */

import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { HLSPlayer, HLSPlayerRef, RegisterMediaFn } from '@/media';
import { OverlayCorners } from '@/components/shared/overlay';
import { Play } from 'lucide-react';
import { UniversalMediaItem, UniversalGridConfig } from './types';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';

interface HeroTileProps {
  item: UniversalMediaItem;
  config: UniversalGridConfig;
  onPress?: (item: UniversalMediaItem) => void;
  onAuthorClick?: (authorId: string) => void;
  registerMedia?: RegisterMediaFn;
  isPlaying?: boolean;
}

const HeroTile = memo<HeroTileProps>(({
  item,
  config,
  onPress,
  onAuthorClick,
  registerMedia,
  isPlaying = false,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const tileRef = useRef<HTMLButtonElement>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  
  const isVideo = item.type === 'video';
  const thumbnailSrc = item.thumbnailUrl || item.url;
  const shouldAutoplay = config.heroAutoplay && isVideo;
  
  const handleClick = useCallback(() => {
    onPress?.(item);
  }, [item, onPress]);
  
  const handleAuthorClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.creator?.id) {
      onAuthorClick?.(item.creator.id);
    }
  }, [item.creator?.id, onAuthorClick]);
  
  // Register with autoplay system
  useEffect(() => {
    if (!isVideo || !registerMedia || !shouldAutoplay) return;
    
    const checkAndRegister = () => {
      const videoEl = playerRef.current?.getElement();
      const tileEl = tileRef.current;
      
      if (videoEl && tileEl) {
        registerMedia({
          id: item.postId,
          element: videoEl,
          observeTarget: tileEl,
          isCandidate: true,
          sortIndex: -1, // Hero has highest priority
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
        isCandidate: true,
        sortIndex: -1,
      });
    };
  }, [item.postId, isVideo, shouldAutoplay, registerMedia]);
  
  const handleCanPlay = useCallback(() => {
    const el = playerRef.current?.getElement();
    if (el) setVideoEl(el);
  }, []);
  
  return (
    <motion.button
      ref={tileRef}
      type="button"
      className="w-full aspect-video relative overflow-hidden rounded-lg"
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        draggable={false}
      />
      
      {/* Video layer */}
      {isVideo && item.playbackUrl && (
        <HLSPlayer
          ref={playerRef}
          src={item.playbackUrl}
          autoplay={isPlaying && shouldAutoplay}
          muted
          loop
          objectFit="cover"
          externallyManaged
          managedByMediaRuntime={true}
          mediaId={uidFromNode({ src: item.playbackUrl }) || item.postId}
          onLoadedData={handleCanPlay}
          className="absolute inset-0 h-full w-full"
        />
      )}
      
      {/* Text overlays from studio_edits */}
      {(item as any).studioEdits?.textOverlays?.length > 0 && (
        <TextOverlayRenderer
          textOverlays={(item as any).studioEdits.textOverlays}
          isEditable={false}
        />
      )}
      
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      
      {/* Play button hint for videos */}
      {isVideo && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}
      
      {/* Creator info - bottom left */}
      {config.showCreator && item.creator && (
        <div 
          className="absolute bottom-4 left-4 flex items-center gap-3 pointer-events-auto"
          onClick={handleAuthorClick}
        >
          {item.creator.avatar && (
            <img
              src={item.creator.avatar}
              alt={item.creator.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
            />
          )}
          <div className="text-left">
            <p className="text-white font-semibold text-sm drop-shadow-md">
              {item.creator.name}
            </p>
            {item.courseName && (
              <p className="text-white/80 text-xs drop-shadow-md">
                {item.courseName}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Duration badge - top right */}
      {isVideo && item.durationSeconds && (
        <div className="absolute top-3 right-3">
          <div className="px-2 py-1 rounded bg-black/50 text-white text-xs font-medium">
            {formatDuration(item.durationSeconds)}
          </div>
        </div>
      )}
    </motion.button>
  );
});

HeroTile.displayName = 'HeroTile';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default HeroTile;
