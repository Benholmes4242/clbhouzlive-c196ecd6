
import React from 'react';
import { Play } from 'lucide-react';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useThumbnailGenerator } from './ThumbnailGenerator';
import { VideoPreviewProps } from './types';
import { thumbnailCache } from './thumbnailCache';

const GridVideoPreview = ({ 
  src, 
  poster, 
  className = "", 
  onFullscreen, 
  videoId 
}: Omit<VideoPreviewProps, 'isGridThumbnail'>) => {
  const { elementRef, isInView } = useIntersectionObserver({ threshold: 0.8 });
  const { thumbnailSrc, thumbnailReady, thumbnailError } = useThumbnailGenerator(src, videoId, poster);
  
  const { videoRef, isPlaying, shouldShowPlayIcon } = useVideoAutoplay({
    isInView,
    isHovered: false,
    videoId,
    isGridContext: true
  });

  // Detect iOS Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFullscreen?.();
  };

  const handleVideoError = () => {
    console.log('Video error for:', videoId);
  };

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
};

export default GridVideoPreview;
