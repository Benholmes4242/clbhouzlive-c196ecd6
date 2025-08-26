import React, { memo, useState, useRef, useEffect, useCallback } from 'react';

interface UltraFastImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onClick?: () => void;
}

// Ultra-optimized image component with aggressive performance optimizations
const UltraFastImage: React.FC<UltraFastImageProps> = memo(({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  onLoad,
  onError,
  onClick
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Ultra-aggressive intersection observer
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
        rootMargin: '500px', // Even more aggressive preloading
        threshold: 0
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [priority, shouldLoad]);

  // Optimized image URL generation
  const getOptimizedUrl = useCallback((url: string): string => {
    if (!url) return '';
    
    // Skip optimization for videos
    if (url.includes('cloudflarestream.com') || url.includes('.m3u8') || 
        url.includes('.mp4') || url.includes('.mov')) {
      return url;
    }

    // Optimize R2 and Supabase images
    if (url.includes('media.clbhouz.co.uk') || 
        (url.includes('supabase') && url.includes('storage'))) {
      const separator = url.includes('?') ? '&' : '?';
      const w = width ? `&w=${width}` : '';
      const h = height ? `&h=${height}` : '';
      return `${url}${separator}q=85&f=webp&fit=cover${w}${h}`;
    }

    return url;
  }, [width, height]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    onError?.(e);
  }, [onError]);

  if (hasError) {
    return (
      <div 
        className={`bg-muted animate-pulse ${className}`}
        style={{ width, height }}
      />
    );
  }

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* Optimized placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-muted/30 animate-pulse"
          style={{ width, height }}
        />
      )}
      
      {/* Ultra-optimized image */}
      {shouldLoad && (
        <img
          src={getOptimizedUrl(src)}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          onClick={onClick}
          style={{ 
            width, 
            height,
            objectFit: 'cover'
          }}
        />
      )}
    </div>
  );
});

UltraFastImage.displayName = 'UltraFastImage';

export default UltraFastImage;