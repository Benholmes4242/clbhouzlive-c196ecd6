
import React, { useState, useEffect } from 'react';
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
    hasValidSrc: !!src && src.length > 0
  });

  // Generate thumbnail immediately for instant display
  useEffect(() => {
    if (!src || !isGridThumbnail) return;

    // Use video element to generate thumbnail immediately
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    const generateThumbnail = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        setThumbnailSrc(dataURL);
        setThumbnailReady(true);
        console.log('Thumbnail generated instantly for:', videoId);
      }
    };

    video.onloadeddata = () => {
      video.currentTime = 0.1; // Get frame from beginning
    };
    
    video.onseeked = generateThumbnail;
    video.oncanplay = generateThumbnail;
    
    video.onerror = () => {
      console.log('Video thumbnail generation failed for:', videoId);
      setHasVideoError(true);
      setThumbnailReady(true); // Show fallback
    };
    
    video.src = src;
    video.load();

    return () => {
      video.src = '';
    };
  }, [src, videoId, isGridThumbnail]);

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

  // For grid thumbnails, prioritize instant display
  if (isGridThumbnail) {
    return (
      <div
        ref={elementRef}
        className={`relative cursor-pointer group overflow-hidden bg-gray-900 ${className}`}
        onClick={handleClick}
      >
        {/* Always show thumbnail first for instant display */}
        <img
          src={thumbnailSrc || poster || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center'}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
          style={{ display: thumbnailReady || poster ? 'block' : 'none' }}
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
        
        {/* Small Instagram-style play icon in bottom-right corner */}
        {shouldShowPlayIcon && (
          <div className="absolute bottom-2 right-2">
            <div className="w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
        
        {/* Loading indicator only when no thumbnail is ready */}
        {!thumbnailReady && !poster && isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
