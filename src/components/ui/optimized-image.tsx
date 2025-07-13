import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onClick?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  onClick,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading (skip if priority)
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
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

  // Optimize image URL for faster loading
  const getOptimizedSrc = (url: string) => {
    if (!url) return '';
    
    // For Supabase storage URLs, add optimization parameters
    if (url.includes('supabase') && url.includes('storage')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}quality=60&resize=contain&width=${width || 300}&format=webp`;
    }
    
    return url;
  };

  // Load image when it intersects or is priority
  useEffect(() => {
    if (hasIntersected && src) {
      const optimizedSrc = getOptimizedSrc(src);
      
      // Preload the image
      const img = new Image();
      img.onload = () => {
        setImageSrc(optimizedSrc);
        setIsLoading(false);
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      img.src = optimizedSrc;
    }
  }, [hasIntersected, src, width]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-media-loading animate-pulse rounded-[inherit]" />
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-[inherit] transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          maxWidth: '100%'
        }}
        onError={handleError}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-media-loading rounded-[inherit] flex items-center justify-center">
          <div className="text-xs text-muted-foreground">Failed to load</div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;