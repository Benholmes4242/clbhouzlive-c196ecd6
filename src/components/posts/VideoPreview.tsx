
import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Play } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoPreviewProps {
  src: string;
  poster?: string;
  className?: string;
  onFullscreen?: () => void;
  videoId: string;
  isGridThumbnail?: boolean;
}

// Enhanced cache for generated thumbnails with immediate availability
const thumbnailCache = new Map<string, string>();
const thumbnailPromises = new Map<string, Promise<string>>();

const VideoPreview = ({ 
  src, 
  poster, 
  className = "", 
  onFullscreen, 
  videoId, 
  isGridThumbnail = false 
}: VideoPreviewProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState<string>('');
  const [thumbnailReady, setThumbnailReady] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const isMobile = useIsMobile();
  const { elementRef, isInView } = useIntersectionObserver({ threshold: 0.8 });
  
  const { videoRef, isPlaying, isLoading, shouldShowPlayIcon } = useVideoAutoplay({
    isInView,
    isHovered,
    videoId,
    isGridContext: isGridThumbnail
  });
  
  // Detect iOS Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  console.log('VideoPreview rendering:', {
    videoId,
    src,
    poster,
    isGridThumbnail,
    thumbnailReady,
    thumbnailSrc: !!thumbnailSrc,
    hasValidSrc: !!src && src.length > 0,
    cachedThumbnail: thumbnailCache.has(videoId),
    isMobile
  });

  // Generate thumbnails aggressively for both grid and non-grid contexts
  useEffect(() => {
    if (!src) return;

    // Check if we already have a cached thumbnail
    const cachedThumbnail = thumbnailCache.get(videoId);
    if (cachedThumbnail) {
      console.log('Using cached thumbnail for:', videoId);
      setThumbnailSrc(cachedThumbnail);
      setThumbnailReady(true);
      return;
    }

    // Check if thumbnail generation is already in progress
    const existingPromise = thumbnailPromises.get(videoId);
    if (existingPromise) {
      existingPromise.then(dataURL => {
        setThumbnailSrc(dataURL);
        setThumbnailReady(true);
      }).catch(() => {
        console.log('Existing promise failed for:', videoId);
        setThumbnailError(true);
        if (poster) {
          setThumbnailSrc(poster);
          setThumbnailReady(true);
        }
      });
      return;
    }

    // Generate thumbnail for all contexts
    const generateThumbnailPromise = new Promise<string>((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      
      let resolved = false;
      
      const generateThumbnail = () => {
        if (resolved) return;
        
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            
            // Cache the thumbnail for future use
            thumbnailCache.set(videoId, dataURL);
            resolved = true;
            resolve(dataURL);
            
            console.log('Real thumbnail generated and cached for:', videoId);
          } else {
            console.log('Video dimensions not ready for:', videoId);
          }
        } catch (error) {
          console.log('Error generating thumbnail for:', videoId, error);
          if (!resolved) {
            resolved = true;
            reject(error);
          }
        }
      };

      // Multiple event handlers to catch thumbnail generation
      video.onloadeddata = generateThumbnail;
      video.oncanplay = generateThumbnail;
      video.onseeked = generateThumbnail;
      video.onloadedmetadata = () => {
        // Seek to get the first meaningful frame
        if (video.duration > 0) {
          video.currentTime = Math.min(0.5, video.duration * 0.1);
        }
      };
      
      video.onerror = () => {
        console.log('Video error during thumbnail generation:', videoId);
        if (!resolved) {
          resolved = true;
          reject(new Error('Video thumbnail generation failed'));
        }
      };
      
      video.src = src;
      video.load();

      // Timeout for thumbnail generation
      setTimeout(() => {
        if (!resolved) {
          console.log('Thumbnail generation timeout for:', videoId);
          resolved = true;
          reject(new Error('Thumbnail generation timeout'));
        }
      }, 3000);
    });

    // Store the promise and handle results
    thumbnailPromises.set(videoId, generateThumbnailPromise);
    
    generateThumbnailPromise
      .then(dataURL => {
        setThumbnailSrc(dataURL);
        setThumbnailReady(true);
        setThumbnailError(false);
        console.log('Real thumbnail ready for:', videoId);
      })
      .catch(() => {
        console.log('Thumbnail generation failed for:', videoId);
        setThumbnailError(true);
        // Use poster as fallback
        if (poster) {
          setThumbnailSrc(poster);
          setThumbnailReady(true);
        } else {
          // Show a placeholder or the video element itself
          setThumbnailReady(true);
        }
      })
      .finally(() => {
        thumbnailPromises.delete(videoId);
      });

  }, [src, videoId, poster]);

  const handleMouseEnter = () => {
    if (!isMobile && !isGridThumbnail && !isIOSSafari) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && !isGridThumbnail && !isIOSSafari) {
      setIsHovered(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isGridThumbnail) {
      onFullscreen?.();
      return;
    }
  };

  const handleVideoError = () => {
    console.log('Video error for:', videoId);
    setHasVideoError(true);
  };

  // Check for invalid video src
  if (!src || src.trim() === '' || typeof src !== 'string') {
    console.log('Invalid video src:', { videoId, src, type: typeof src });
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-gray-500 text-sm">No video</div>
      </div>
    );
  }

  // For grid thumbnails, prioritize showing thumbnails
  if (isGridThumbnail) {
    return (
      <div
        ref={elementRef}
        className={`relative cursor-pointer group overflow-hidden bg-gray-900 ${className}`}
        onClick={handleClick}
      >
        {/* Always try to show thumbnail first */}
        {thumbnailSrc && !thumbnailError ? (
          <img
            src={thumbnailSrc}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log('Thumbnail image load error for:', videoId);
              setThumbnailError(true);
            }}
          />
        ) : thumbnailReady && !thumbnailSrc && !poster ? (
          // Fallback: show video element as thumbnail with specific styling
          <video
            src={src}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            poster={poster}
            onLoadedData={(e) => {
              // Try to extract thumbnail when video loads
              const video = e.target as HTMLVideoElement;
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  ctx.drawImage(video, 0, 0);
                  const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                  thumbnailCache.set(videoId, dataURL);
                  setThumbnailSrc(dataURL);
                  setThumbnailError(false);
                }
              }
            }}
            onError={handleVideoError}
          />
        ) : poster ? (
          // Use poster as fallback
          <img
            src={poster}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          // Loading state or error state
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            {!thumbnailReady ? (
              <div className="text-white text-xs">Loading...</div>
            ) : (
              <div className="text-white text-xs">No preview</div>
            )}
          </div>
        )}
        
        {/* Video element for autoplay (only when needed) */}
        {!isIOSSafari && isPlaying && thumbnailSrc && (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-cover absolute inset-0"
            muted
            loop
            playsInline
            onError={handleVideoError}
            preload="metadata"
          />
        )}
        
        {/* Small Instagram-style play icon */}
        {shouldShowPlayIcon && (
          <div className="absolute bottom-2 right-2">
            <div className="w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // For non-grid context (desktop explore), ensure proper thumbnail display
  return (
    <div
      ref={elementRef}
      className={`relative cursor-pointer group overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base layer - always show something */}
      <div className="w-full h-full bg-gray-900 absolute inset-0">
        {/* Show thumbnail if available */}
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            onError={() => setThumbnailError(true)}
          />
        ) : poster ? (
          <img
            src={poster}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          // Fallback - show first frame of video
          <video
            src={src}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedData={(e) => {
              const video = e.target as HTMLVideoElement;
              if (video.videoWidth > 0 && video.videoHeight > 0 && !thumbnailSrc) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  ctx.drawImage(video, 0, 0);
                  const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                  thumbnailCache.set(videoId, dataURL);
                  setThumbnailSrc(dataURL);
                }
              }
            }}
            onError={handleVideoError}
          />
        )}
      </div>

      {/* Video overlay for autoplay */}
      {isPlaying && (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover absolute inset-0 z-10"
          muted
          loop
          playsInline
          onClick={handleClick}
          onError={handleVideoError}
          preload="metadata"
          controls={false}
        />
      )}

      {/* Controls overlay - only show enlarge button on hover and not in grid thumbnails */}
      {!isGridThumbnail && isHovered && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen?.();
            }}
            className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors shadow-lg"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Gradient overlay for better button visibility - only in non-grid contexts */}
      {!isGridThumbnail && isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-15" />
      )}
    </div>
  );
};

export default VideoPreview;
