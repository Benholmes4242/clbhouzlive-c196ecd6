/**
 * GridImageTile - 1:1 square image tile for image grids
 * 
 * Watch Tab Standard:
 * - bg-muted shimmer loading state
 * - Left-to-right shimmer sweep
 * - Fade-up entrance animation (controlled by parent)
 * - Priority loading for first 9 visible tiles
 * - Broken image fallback icon
 */

import { useState } from 'react';
import { Layers, Heart, Camera } from 'lucide-react';
import { GridPost } from './types';
import { cn } from '@/lib/utils';

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

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
  const [isBroken, setIsBroken] = useState(false);
  
  if (!media) return null;
  
  const hasMultipleImages = post.post_media && post.post_media.length > 1;
  const likeCount = post.like_count || 0;
  
  // Priority loading for first 9 tiles (3x3 grid visible)
  const isPriority = index < 9;
  
  return (
    <div
      className={cn(
        "relative cursor-pointer overflow-hidden bg-muted active:scale-[0.97] transition-transform",
        isNewlyLoaded && !prefersReducedMotion && "animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-backwards"
      )}
      style={{ 
        aspectRatio: '1/1',
        ...(isNewlyLoaded && !prefersReducedMotion ? { animationDelay: `${entranceDelay}ms` } : {}),
      }}
      onClick={onClick}
    >
      {/* Shimmer loading state */}
      <div 
        className={cn(
          "absolute inset-0 bg-muted overflow-hidden transition-opacity duration-300",
          imageLoaded || isBroken ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-background/40 to-transparent" />
      </div>

      {/* Broken image fallback */}
      {isBroken && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <Camera className="h-6 w-6 text-muted-foreground/40" />
        </div>
      )}
      
      {!isBroken && (
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
          onError={() => setIsBroken(true)}
        />
      )}
      
      {/* Like count badge - top right (consistent with ShortVideoTile) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full z-10">
        <Heart className={cn("w-3 h-3", likeCount > 0 ? "fill-like text-like" : "text-white")} />
        {likeCount > 0 && (
          <span className="text-white text-[10px] font-medium">{formatCount(likeCount)}</span>
        )}
      </div>

      {/* Multi-image indicator */}
      {hasMultipleImages && (
        <div className="absolute top-2 left-2">
          <Layers className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}
    </div>
  );
}
