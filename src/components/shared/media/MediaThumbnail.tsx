// MediaThumbnail — Thumbnail tile for media grid/strip
import React from 'react';
import { Play, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderedMediaItem } from './types';

interface MediaThumbnailProps {
  item: OrderedMediaItem;
  index: number;
  isCover: boolean;
  totalItems: number;
  hasStudioEdits?: boolean;
  showStudio?: boolean;
  onRemove: () => void;
  onExpand: () => void;
  onStudio?: () => void;
  onSetCover?: () => void;
  isViewerOpen?: boolean;
}

export function MediaThumbnail({
  item,
  index,
  isCover,
  totalItems,
  onRemove,
  onExpand,
  onSetCover,
}: MediaThumbnailProps) {
  const src = item.thumbnailUrl || item.previewUrl;
  const isVideo = item.type === 'video';

  return (
    <div
      className="relative flex-shrink-0 rounded-2xl overflow-hidden bg-muted"
      style={{ width: 'clamp(160px, 45vw, 208px)', height: 'clamp(160px, 45vw, 208px)' }}
    >
      <button onClick={onExpand} className="w-full h-full">
        {isVideo && !item.thumbnailUrl ? (
          <video
            src={item.previewUrl}
            className="w-full h-full object-cover pointer-events-none"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
        )}
      </button>

      {/* Video indicator */}
      {isVideo && (
        <div className="absolute bottom-2 left-2 bg-black/60 rounded-full px-2 py-0.5 flex items-center gap-1">
          <Play className="w-3 h-3 text-white" fill="white" />
        </div>
      )}

      {/* Cover badge */}
      {isCover && totalItems > 1 && (
        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
          <Star className="w-2.5 h-2.5" fill="currentColor" /> Cover
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      {/* Set cover button */}
      {!isCover && totalItems > 1 && onSetCover && (
        <button
          onClick={onSetCover}
          className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-medium px-2 py-1 rounded-full"
        >
          Set cover
        </button>
      )}

      {/* Upload overlay */}
      {item.uploadStatus === 'uploading' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
      )}
      {item.uploadStatus === 'failed' && (
        <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
          <span className="text-xs text-destructive font-medium">Failed</span>
        </div>
      )}
    </div>
  );
}
