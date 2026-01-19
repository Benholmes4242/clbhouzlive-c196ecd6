/**
 * FullscreenMediaItem - Single media item display
 * 
 * Renders either video or image with appropriate styling and interactions.
 */

import React, { useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { UnifiedVideoPlayer } from '../components/UnifiedVideoPlayer';
import { UnifiedImage } from '../components/UnifiedImage';
import { FullscreenMediaItem as FullscreenMediaItemType } from '../hooks/useFullscreenViewer';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';

export interface FullscreenMediaItemProps {
  item: FullscreenMediaItemType;
  isActive?: boolean;
  isNearby?: boolean;
  className?: string;
}

export const FullscreenMediaItem: React.FC<FullscreenMediaItemProps> = ({
  item,
  isActive = false,
  isNearby = true,
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const lastTapRef = useRef<number>(0);
  const [showHeart, setShowHeart] = useState(false);

  // Double-tap to like
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      e.preventDefault();
      e.stopPropagation();
      
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 450);
    }
  }, []);

  return (
    <div
      className={cn('relative w-full h-full bg-black overflow-hidden', className)}
      onClick={handleTap}
    >
      {/* Double-tap heart burst */}
      {showHeart && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-50">
          <div className="text-white opacity-0 scale-75 animate-[heart-burst_0.45s_ease-out_forwards]">
            <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        </div>
      )}

      {/* Media content */}
      <SingleMediaDisplay
        item={item}
        isActive={isActive}
        isNearby={isNearby}
        muted={viewer.isMuted}
      />

      {/* Readability gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: '35vh',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)',
        }}
      />
    </div>
  );
};

// ============ Single Media Display ============

interface SingleMediaDisplayProps {
  item: FullscreenMediaItemType;
  isActive: boolean;
  isNearby: boolean;
  muted: boolean;
}

export const SingleMediaDisplay: React.FC<SingleMediaDisplayProps> = ({
  item,
  isActive,
  isNearby,
  muted,
}) => {
  if (item.mediaType === 'video') {
    return (
      <UnifiedVideoPlayer
        src={item.mediaUrl}
        posterUrl={item.posterUrl}
        muted={muted}
        autoplay={isActive}
        loop
        controls={false}
        className="absolute inset-0 w-full h-full"
        objectFit="cover"
      />
    );
  }

  return (
    <UnifiedImage
      src={item.mediaUrl}
      alt={item.caption || ''}
      className="absolute inset-0 w-full h-full"
      objectFit="cover"
      priority={isActive}
    />
  );
};

export default FullscreenMediaItem;
