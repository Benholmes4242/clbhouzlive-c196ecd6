
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

// Cache for generated thumbnails to avoid regeneration
const thumbnailCache = new Map<string, string>();

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
  const thumbnailGeneratedRef = useRef(false);
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
    cachedThumbnail: thumbnailCache.has(videoId)
  });

  // Immediate thumbnail setup - check cache first, then generate
  useEffect(() => {
    if (!src || !isGridThumbnail || thumbnailGeneratedRef.current) return;

    // Check if we have a cached thumbnail first
    const cachedThumbnail = thumbnailCache.get(videoId);
    if (cachedThumbnail) {
      console.log('Using cached thumbnail for:', videoId);
      setThumbnailSrc(cachedThumbnail);
      setThumbnailReady(true);
      thumbnailGeneratedRef.current = true;
      return;
    }

    // If we have a poster, use it immediately while generating thumbnail
    if (poster) {
      setThumbnailSrc(poster);
      setThumbnailReady(true);
    }

    // Generate thumbnail aggressively for instant display
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    const generateThumbnail = () => {
      if (thumbnailGeneratedRef.current) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        
        // Cache the thumbnail for future use
        thumbnailCache.set(videoId, dataURL);
        
        setThumbnailSrc(dataURL);
        setThumbnailReady(true);
        thumbnailGeneratedRef.current = true;
        console.log('Thumbnail generated and cached for:', videoId);
      }
    };

    // Multiple event handlers to catch thumbnail generation as early as possible
    video.onloadeddata = generateThumbnail;
    video.oncanplay = generateThumbnail;
    video.onseeked = generateThumbnail;
    
    // Set video time to get first frame quickly
    video.onloadedmetadata = () => {
      video.currentTime = 0.1;
    };
    
    video.onerror = () => {
      console.log('Video thumbnail generation failed for:', videoId);
      setHasVideoError(true);
      if (!poster) {
        // Only show fallback if no poster is available
        setThumbnailSrc('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center');
      }
      setThumbnailReady(true);
      thumbnailGeneratedRef.current = true;
    };
    
    video.src = src;
    video.load();

    return () => {
      video.src = '';
    };
  }, [src, videoId, isGridThumbnail, poster]);

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

  // For grid thumbnails, prioritize instant display with no loading states
  if (isGridThumbnail) {
    return (
      <div
        ref={elementRef}
        className={`relative cursor-pointer group overflow-hidden bg-gray-900 ${className}`}
        onClick={handleClick}
      >
        {/* Always show thumbnail immediately - no loading states */}
        <img
          src={thumbnailSrc || poster || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center'}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.src === thumbnailSrc && poster) {
              img.src = poster;
            } else if (img.src !== 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center') {
              img.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';
            }
          }}
        />
        
        {/* Video element for autoplay (hidden initially) */}
        {!isIOSSafari && (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-cover absolute inset-0"
            muted
            loop
            playsInline
            onError={handleVideoError}
            preload="metadata"
            style={{ display: isPlaying ? 'block' : 'none' }}
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

  return (
    <div
      ref={elementRef}
      className={`relative cursor-pointer group overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
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
