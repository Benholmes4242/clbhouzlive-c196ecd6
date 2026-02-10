import React, { useState, useCallback, useRef, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
import { useMediaStatus, getAspectClass } from './useMediaStatus';
import MediaSkeleton from './MediaSkeleton';
import MediaErrorFallback from './MediaErrorFallback';
import OverlayLabels from './OverlayLabels';
import { ActivityMediaCardProps, AspectRatio } from './types';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
// REMOVED: safePlay import - playback now user-tap only via MediaRuntime

/**
 * Premium media card component for Activity grid
 * Features:
 * - Soft rounded corners
 * - Gradient overlay for labels
 * - Hover/press micro-interactions
 * - Video preview on hover (desktop)
 * - Elegant loading and error states
 */
const ActivityMediaCard: React.FC<ActivityMediaCardProps> = ({
  item,
  onPress,
  aspectRatio
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const mediaId = useId();
  
  const { status, src, onLoad, onError, retry, canRetry } = useMediaStatus(item.url);
  const isVideo = item.type === 'video';
  const aspectClass = getAspectClass(aspectRatio);

  // Check for hover support (desktop vs touch)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setSupportsHover(window.matchMedia('(pointer:fine)').matches);
    }
  }, []);

  // Handle video preview on hover - route through MediaRuntime
  const handleMouseEnter = useCallback(() => {
    if (!supportsHover) return;
    setIsHovered(true);
    
    if (isVideo && videoRef.current) {
      videoRef.current.muted = true;
      // Request play via runtime for hover intent
      MediaRuntime.requestPlay({ id: mediaId, surface: 'grid', reason: 'user' });
    }
  }, [supportsHover, isVideo, mediaId]);

  const handleMouseLeave = useCallback(() => {
    if (!supportsHover) return;
    setIsHovered(false);
    
    if (isVideo) {
      // Request pause via runtime
      MediaRuntime.requestPause({ id: mediaId, reason: 'user' });
    }
  }, [supportsHover, isVideo, mediaId]);

  const handleClick = useCallback(() => {
    onPress?.(item.postId);
  }, [item.postId, onPress]);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/10",
        "cursor-pointer",
        // Micro-interactions
        "transition-all duration-150 ease-out",
        "hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]",
        "active:translate-y-0 active:shadow-[0_2px_8px_rgba(0,0,0,0.1)] active:scale-[0.98]",
        aspectClass
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading state */}
      {status === 'loading' && (
        <div className="absolute inset-0">
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30" />
        </div>
      )}
      
      {/* Error state */}
      {status === 'error' && (
        <MediaErrorFallback 
          onRetry={retry} 
          isVideo={isVideo} 
          canRetry={canRetry}
          className="absolute inset-0"
        />
      )}
      
      {/* Media content */}
      {status !== 'error' && (
        <>
          {isVideo && supportsHover ? (
            <video
              ref={videoRef}
              src={isHovered ? src : undefined}
              className={cn(
                "w-full h-full object-cover",
                status === 'loading' && "opacity-0"
              )}
              playsInline
              muted
              loop
              preload="metadata"
              onLoadedData={onLoad}
              onError={onError}
            />
          ) : (
            <img
              ref={imgRef}
              src={item.thumbnailUrl || src}
              alt=""
              className={cn(
                "w-full h-full object-cover",
                status === 'loading' && "opacity-0"
              )}
              loading="lazy"
              onLoad={onLoad}
              onError={onError}
            />
          )}
        </>
      )}
      
      {/* Overlay labels */}
      {status === 'loaded' && (
        <OverlayLabels
          courseName={item.courseName}
          isVideo={isVideo}
          additionalMediaCount={item.additionalMediaCount}
          isMilestone={item.isMilestone}
          isHovered={isHovered}
        />
      )}
    </div>
  );
};

export default ActivityMediaCard;
