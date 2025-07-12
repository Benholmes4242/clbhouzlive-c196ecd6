import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import LazyImage from './lazy-image';

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  className?: string;
  priority?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  showControls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: () => void;
}

/**
 * LazyVideo component with optimized loading, thumbnail preview, and custom controls
 * Reduces bandwidth usage and improves performance
 */
export const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  className,
  priority = false,
  preload = 'none',
  showControls = true,
  autoPlay = false,
  muted = true,
  onLoadStart,
  onCanPlay,
  onError,
  ...props
}) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [hasError, setHasError] = useState(false);
  const [showPoster, setShowPoster] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (containerRef.current) {
      containerRef.current = null;
    }
    
    if (node && !priority && !isInView) {
      containerRef.current = node;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '100px',
          threshold: 0.1,
        }
      );
      
      observer.observe(node);
      
      return () => {
        observer.unobserve(node);
      };
    }
  }, [priority, isInView]);

  // Video event handlers
  const handleLoadStart = () => {
    setIsLoaded(true);
    onLoadStart?.();
  };

  const handleCanPlay = () => {
    onCanPlay?.();
    if (autoPlay) {
      handlePlay();
    }
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const handlePlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
        setShowPoster(false);
      } catch (error) {
        console.warn('Video play failed:', error);
      }
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Pause video when it goes out of view
  useEffect(() => {
    if (!isInView && isPlaying) {
      handlePause();
    }
  }, [isInView, isPlaying]);

  // Clean up video when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, []);

  const shouldLoadVideo = isInView || priority;

  return (
    <div 
      ref={setContainerRef}
      className={cn('relative overflow-hidden bg-black', className)}
    >
      {/* Poster/Thumbnail */}
      {poster && showPoster && (
        <LazyImage
          src={poster}
          alt="Video thumbnail"
          className="absolute inset-0 w-full h-full"
        />
      )}

      {/* Video element */}
      {shouldLoadVideo && !hasError && (
        <video
          ref={videoRef}
          src={src}
          preload={preload}
          muted={isMuted}
          playsInline
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onError={handleError}
          onPlay={() => {
            setIsPlaying(true);
            setShowPoster(false);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setShowPoster(true);
          }}
          className={cn(
            'w-full h-full object-cover',
            showPoster ? 'opacity-0' : 'opacity-100'
          )}
          {...props}
        />
      )}

      {/* Controls overlay */}
      {showControls && shouldLoadVideo && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center group">
          {/* Play/Pause button */}
          <button
            onClick={togglePlay}
            className={cn(
              'flex items-center justify-center w-16 h-16 bg-black/50 text-white rounded-full transition-all duration-200',
              'hover:bg-black/70 hover:scale-110',
              'group-hover:opacity-100',
              isPlaying && !showPoster ? 'opacity-0' : 'opacity-100'
            )}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 ml-0.5" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>

          {/* Mute/Unmute button */}
          <button
            onClick={toggleMute}
            className={cn(
              'absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full transition-all duration-200',
              'hover:bg-black/70',
              'opacity-0 group-hover:opacity-100'
            )}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-muted-foreground text-sm text-center px-4">
            <div className="mb-2">⚠️</div>
            <div>Video failed to load</div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {shouldLoadVideo && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default LazyVideo;