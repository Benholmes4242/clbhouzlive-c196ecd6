import React, { memo, useState, useRef, useEffect, useCallback } from 'react';

interface UltraFastVideoProps {
  src: string;
  className?: string;
  width?: number;
  height?: number;
  muted?: boolean;
  autoplay?: boolean;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

// Ultra-optimized video component with aggressive performance optimizations
const UltraFastVideo: React.FC<UltraFastVideoProps> = memo(({
  src,
  className = '',
  width,
  height,
  muted = true,
  autoplay = false,
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Ultra-aggressive intersection observer for videos
  useEffect(() => {
    if (priority || shouldLoad) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observerRef.current?.disconnect();
        }
      },
      { 
        rootMargin: '300px', // Aggressive preloading for videos
        threshold: 0
      }
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [priority, shouldLoad]);

  const handleLoadedData = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  if (hasError) {
    return (
      <div 
        className={`bg-muted animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-sm">Video unavailable</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Ultra-fast loading placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-muted/30 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Ultra-optimized video */}
      {shouldLoad && (
        <video
          ref={videoRef}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          width={width}
          height={height}
          muted={muted}
          autoPlay={autoplay}
          playsInline
          preload={priority ? 'metadata' : 'none'}
          onLoadedData={handleLoadedData}
          onError={handleError}
          style={{ 
            width, 
            height,
            objectFit: 'cover'
          }}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
});

UltraFastVideo.displayName = 'UltraFastVideo';

export default UltraFastVideo;