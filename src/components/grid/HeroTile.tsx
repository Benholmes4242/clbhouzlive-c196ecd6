/**
 * HeroTile - Hero video tile for hero-grid layouts
 * 
 * UNIFIED WITH CLUBHOUSE: Uses visibility-based autoplay via IntersectionObserver
 * - managedByMediaRuntime={false} for direct browser-led autoplay
 * - autoplay based on 40% visibility threshold
 * - preload="auto" for instant buffering
 */

import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { OverlayCorners } from '@/components/shared/overlay';
import { Play } from 'lucide-react';
import { UniversalMediaItem, UniversalGridConfig } from './types';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { getFilterClass } from '@/utils/studioFilters';
import { getPixelLayerStyle } from '@/utils/studioEdit';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { useInView } from 'react-intersection-observer';

interface HeroTileProps {
  item: UniversalMediaItem;
  config: UniversalGridConfig;
  onPress?: (item: UniversalMediaItem) => void;
  onAuthorClick?: (authorId: string) => void;
}

const HeroTile = memo<HeroTileProps>(({
  item,
  config,
  onPress,
  onAuthorClick,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  
  // Visibility-based autoplay (40% threshold)
  const { ref: inViewRef, inView: isVisible } = useInView({
    threshold: 0.4,
    triggerOnce: false,
  });
  
  const isVideo = item.type === 'video';
  const thumbnailSrc = item.thumbnailUrl || item.url;
  const shouldAutoplay = config.heroAutoplay && isVideo;
  const studioEdits = (item as any).studioEdits;
  const filterClass = getFilterClass(studioEdits?.filter || (item as any).filterId);
  const pixelStyle = getPixelLayerStyle(studioEdits);
  
  const handleClick = useCallback(() => {
    onPress?.(item);
  }, [item, onPress]);
  
  const handleAuthorClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.creator?.id) {
      onAuthorClick?.(item.creator.id);
    }
  }, [item.creator?.id, onAuthorClick]);
  
  return (
    <motion.button
      ref={inViewRef}
      type="button"
      className="w-full aspect-video relative overflow-hidden rounded-lg"
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Thumbnail with filter */}
      <div className={cn("absolute inset-0 w-full h-full", filterClass)} style={pixelStyle}>
        <img
          src={thumbnailSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          draggable={false}
        />
      </div>
      
      {/* Video layer - UNIFIED WITH CLUBHOUSE */}
      {isVideo && item.playbackUrl && (
        <div className={cn("absolute inset-0 w-full h-full", filterClass)} style={pixelStyle}>
          <HLSPlayer
            ref={playerRef}
            src={item.playbackUrl}
            autoplay={isVisible && shouldAutoplay}
            muted
            loop
            objectFit="cover"
            managedByMediaRuntime={false}
            externallyManaged={false}
            preload="auto"
            mediaId={uidFromNode({ src: item.playbackUrl }) || item.postId}
            className="absolute inset-0 h-full w-full"
          />
        </div>
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
      {isVideo && !isVisible && (
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
