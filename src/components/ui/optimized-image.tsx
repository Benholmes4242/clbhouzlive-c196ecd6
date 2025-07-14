import React, { useState, useRef, useEffect, memo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onClick?: () => void;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

const OptimizedImageComponent: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  onError,
  onClick,
  priority = false,
  loading = 'lazy'
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use intersection observer only if not priority
  const { ref: intersectionRef, isInView } = useIntersectionObserver({
    threshold: 0,
    rootMargin: '50px'
  });

  // Optimize Supabase storage URLs
  const getOptimizedSrc = (url: string): string => {
    if (url.includes('supabase') && url.includes('/storage/')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}quality=85&resize=fill&format=webp`;
    }
    return url;
  };

  useEffect(() => {
    if (priority) {
      setImageSrc(getOptimizedSrc(src));
    } else if (isInView) {
      setImageSrc(getOptimizedSrc(src));
    }
  }, [src, isInView, priority]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    onError?.(e);
  };

  return (
    <div
      ref={intersectionRef}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-media-loading animate-pulse" />
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-media-loading flex items-center justify-center text-muted-foreground">
          Failed to load
        </div>
      ) : (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${className}`}
        />
      )}
    </div>
  );
};

export const OptimizedImage = memo(OptimizedImageComponent);