/**
 * MediaThumbnail
 * Unified thumbnail component for videos and images with optional overlays
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { UnifiedImage } from './UnifiedImage';
import { getThumbnailUrl, ThumbnailSize } from '../utils/thumbnail';
import type { AspectRatio } from '../types';
import { Eye, Play } from 'lucide-react';

export interface MediaThumbnailProps {
  /** Cloudflare Stream UID */
  streamId?: string;
  /** Direct image URL (alternative to streamId) */
  imageUrl?: string;
  /** Alt text for accessibility */
  alt: string;
  /** Aspect ratio (default: '16:9') */
  aspectRatio?: AspectRatio;
  /** Size preset (default: 'medium') */
  size?: ThumbnailSize;
  /** Video duration in seconds */
  duration?: number;
  /** View count to display */
  viewCount?: number;
  /** Show duration overlay (default: true if duration provided) */
  showDuration?: boolean;
  /** Show view count overlay */
  showViewCount?: boolean;
  /** Custom overlay content */
  overlay?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Enable hover scale effect (default: true) */
  hoverEffect?: boolean;
  /** Disable lazy loading */
  priority?: boolean;
  /** Show play button overlay on hover */
  showPlayButton?: boolean;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format view count (e.g., 1.2K, 3.4M)
 */
function formatViewCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

export const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  streamId,
  imageUrl,
  alt,
  aspectRatio = '16:9',
  size = 'medium',
  duration,
  viewCount,
  showDuration,
  showViewCount = false,
  overlay,
  onClick,
  className,
  hoverEffect = true,
  priority = false,
  showPlayButton = false,
}) => {
  // Generate thumbnail URL
  const thumbnailUrl = getThumbnailUrl({ streamId, imageUrl, size });
  
  // Default showDuration to true if duration is provided
  const shouldShowDuration = showDuration ?? (duration !== undefined && duration > 0);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg bg-muted',
        hoverEffect && 'transition-transform duration-200 hover:scale-[1.02]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <UnifiedImage
        src={thumbnailUrl}
        alt={alt}
        aspectRatio={aspectRatio}
        objectFit="cover"
        priority={priority}
        placeholder="skeleton"
        className="w-full h-full"
      />

      {/* Duration badge */}
      {shouldShowDuration && duration !== undefined && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium text-white bg-black/75 rounded">
          {formatDuration(duration)}
        </div>
      )}

      {/* View count badge */}
      {showViewCount && viewCount !== undefined && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-white bg-black/75 rounded">
          <Eye className="w-3 h-3" />
          {formatViewCount(viewCount)}
        </div>
      )}

      {/* Custom overlay */}
      {overlay && (
        <div className="absolute inset-0">
          {overlay}
        </div>
      )}

      {/* Play button overlay */}
      {showPlayButton && onClick && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90 shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
            <Play className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaThumbnail;
