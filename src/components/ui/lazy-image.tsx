import React, { useState, useRef, useEffect } from 'react';
import { getDirectImageUrl } from '@/utils/r2ImageUtils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onClick?: () => void;
  placeholder?: string;
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  onError,
  onClick,
  priority = false,
}) => {
  // Use direct URL for R2 and video content
  const optimizedSrc = getDirectImageUrl(src);
  const [imageSrc, setImageSrc] = useState<string>(priority ? optimizedSrc : ''); // Show optimized image for priority
  const [isLoading, setIsLoading] = useState(false); // Start without loading state
  const [hasError, setHasError] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before the image enters viewport
        threshold: 0.01 // 1% visibility threshold
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load the actual image when it intersects or is priority
  useEffect(() => {
    if ((hasIntersected || priority) && optimizedSrc && !imageSrc && !hasError) {
      console.log('🖼️ LAZY IMAGE DEBUG - Starting to load image:', optimizedSrc);
      setIsLoading(true);
      const img = new Image();
      img.onload = () => {
        console.log('🖼️ LAZY IMAGE DEBUG - Image loaded successfully:', optimizedSrc);
        setImageSrc(optimizedSrc);
        setIsLoading(false);
      };
      img.onerror = (error) => {
        console.error('🖼️ LAZY IMAGE DEBUG - Image failed to load:', optimizedSrc, error);
        setHasError(true);
        setIsLoading(false);
      };
      img.src = optimizedSrc;
    }
  }, [hasIntersected, priority, optimizedSrc, imageSrc, hasError]);

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
        <div className="absolute inset-0 bg-media-loading animate-pulse rounded-[inherit] flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground/70 rounded-full animate-spin" />
        </div>
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-[inherit] transition-opacity duration-200`}
        style={{
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          maxWidth: '100%'
        }}
        onError={handleError}
        width={width}
        height={height}
        loading="eager" // Always eager to prevent grey placeholders
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

export default LazyImage;