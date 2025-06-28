
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
    hasValidSrc: !!src && src.length > 0,
    cachedThumbnail: thumbnailCache.has(videoId),
    isMobile
  });

  // Generate thumbnails for both grid and non-grid contexts to fix desktop display
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
        if (poster) {
          setThumbnailSrc(poster);
        }
        setThumbnailReady(true);
      });
      return;
    }

    // Use poster immediately if available while generating real thumbnail
    if (poster) {
      setThumbnailSrc(poster);
      setThumbnailReady(true);
    }

    // Generate thumbnail for all contexts to ensure desktop display works
    const generateThumbnailPromise = new Promise<string>((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      
      let resolved = false;
      
      const generateThumbnail = () => {
        if (resolved) return;
        
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
        }
      };

      // Multiple event handlers to catch thumbnail generation as early as possible
      video.onloadeddata = generateThumbnail;
      video.oncanplay = generateThumbnail;
      video.onseeked = generateThumbnail;
      video.onloadedmetadata = () => {
        // Seek to a small time to get the first frame
        video.currentTime = 0.1;
      };
      
      video.onerror = () => {
        resolved = true;
        reject(new Error('Video thumbnail generation failed'));
      };
      
      video.src = src;
      video.load();

      // Cleanup timeout
      setTimeout(() => {
        if (!resolved) {
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
        console.log('Real thumbnail ready for:', videoId);
      })
      .catch(() => {
        console.log('Thumbnail generation failed for:', videoId);
        if (!poster) {
          setHasVideoError(true);
        }
        setThumbnailReady(true);
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

  // For grid thumbnails, show real thumbnails immediately or poster as fallback
  if (isGridThumbnail) {
    return (
      <div
        ref={elementRef}
        className={`relative cursor-pointer group overflow-hidden bg-gray-900 ${className}`}
        onClick={handleClick}
      >
        {/* Show thumbnail immediately - no loading states */}
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              console.log('Thumbnail load error, using video as fallback');
              // If thumbnail fails, show the video element itself
              const videoEl = img.parentElement?.querySelector('video');
              if (videoEl) {
                videoEl.style.display = 'block';
                img.style.display = 'none';
              }
            }}
          />
        ) : (
          // Show video element directly if no thumbnail yet
          <video
            src={src}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedData={(e) => {
              // When video loads, try to extract thumbnail
              const video = e.target as HTMLVideoElement;
              if (!thumbnailSrc && video.videoWidth > 0 && video.videoHeight > 0) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  ctx.drawImage(video, 0, 0);
                  const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                  thumbnailCache.set(videoId, dataURL);
                  setThumbnailSrc(dataURL);
                  setThumbnailReady(true);
                }
              }
            }}
            onError={handleVideoError}
          />
        )}
        
        {/* Video element for autoplay (only when needed) */}
        {!isIOSSafari && isPlaying && (
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

  // For non-grid context (desktop explore), show thumbnail first to prevent black display
  return (
    <div
      ref={elementRef}
      className={`relative cursor-pointer group overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Show thumbnail as base layer to prevent black display on desktop */}
      {thumbnailSrc && !isPlaying && (
        <img
          src={thumbnailSrc}
          alt="Video thumbnail"
          className="w-full h-full object-cover absolute inset-0"
        />
      )}

      <video
        ref={videoRef}
        src={src}
        poster={thumbnailSrc || poster}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        onClick={handleClick}
        onError={handleVideoError}
        preload="metadata"
        controls={false}
      />

      {/* Controls overlay - only show enlarge button on hover and not in grid thumbnails */}
      {!isGridThumbnail && isHovered && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );
};

export default VideoPreview;
