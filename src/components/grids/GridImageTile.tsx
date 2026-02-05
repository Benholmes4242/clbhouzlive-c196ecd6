/**
 * GridImageTile - 1:1 square image tile for image grids
 * 
 * Watch Tab Standard:
 * - bg-gray-200 shimmer loading state
 * - Left-to-right shimmer sweep
 * - Fade-up entrance animation (controlled by parent)
 * - Priority loading for first 9 visible tiles
 */

import { useState } from 'react';
import { Layers } from 'lucide-react';
import { GridPost } from './types';
import { cn } from '@/lib/utils';

interface GridImageTileProps {
  post: GridPost;
  onClick: () => void;
  index?: number;
  isNewlyLoaded?: boolean;
  entranceDelay?: number;
  prefersReducedMotion?: boolean;
}

export function GridImageTile({ 
  post, 
  onClick, 
  index = 0,
  isNewlyLoaded = false,
  entranceDelay = 0,
  prefersReducedMotion = false,
}: GridImageTileProps) {
  const media = post.post_media?.[0];
  const [imageLoaded, setImageLoaded] = useState(false);
  
  if (!media) return null;
  
  const hasMultipleImages = post.post_media && post.post_media.length > 1;
  
  // Priority loading for first 9 tiles (3x3 grid visible)
  const isPriority = index < 9;
  
  return (
    <div
      className={cn(
        "relative cursor-pointer overflow-hidden bg-gray-200",
        isNewlyLoaded && !prefersReducedMotion && "animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-backwards"
      )}
      style={{ 
        aspectRatio: '1/1',
        ...(isNewlyLoaded && !prefersReducedMotion ? { animationDelay: `${entranceDelay}ms` } : {}),
      }}
      onClick={onClick}
    >
      {/* Shimmer loading state - Watch tab standard */}
      <div 
        className={cn(
          "absolute inset-0 bg-gray-200 overflow-hidden transition-opacity duration-300",
          imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
      
      <img
        src={media.media_url}
        alt=""
        loading={isPriority ? "eager" : "lazy"}
        fetchPriority={isPriority ? "high" : "auto"}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Multi-image indicator */}
      {hasMultipleImages && (
        <div className="absolute top-2 right-2">
          <Layers className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}
    </div>
  );
}
