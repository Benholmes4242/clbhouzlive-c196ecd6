import React, { useState, useRef, useEffect, memo } from 'react';

interface PerformanceImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onClick?: () => void;
}

const PerformanceImage: React.FC<PerformanceImageProps> = memo(({
  src,
  alt,
  className = '',
  width = 300,
  height = 300,
  priority = false,
  onError,
  onClick
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Generate optimized image URL
  const getOptimizedImageUrl = (url: string) => {
    if (!url) return '';
    
    // Optimize Supabase storage URLs
    if (url.includes('supabase') && url.includes('storage')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}quality=70&resize=contain&width=${width}&height=${height}&format=webp`;
    }
    
    return url;
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <div 
        ref={imgRef}
        className="w-full h-full bg-muted"
        style={{ minHeight: height }}
      >
        {isVisible && (
          <img
            src={getOptimizedImageUrl(src)}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              imageRendering: 'auto',
              backfaceVisibility: 'hidden',
              transform: 'translateZ(0)'
            }}
            onLoad={handleLoad}
            onError={handleError}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        )}
        
        {!isLoaded && !hasError && isVisible && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        
        {hasError && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Failed to load</div>
          </div>
        )}
      </div>
    </div>
  );
});

PerformanceImage.displayName = 'PerformanceImage';

export default PerformanceImage;