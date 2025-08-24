import React, { useState, useRef, useEffect, memo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { getDirectImageUrl } from '@/utils/r2ImageUtils';

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
  sizes?: string; // CSS sizes attribute for responsive images
  quality?: number; // Image quality (1-100)
  format?: 'webp' | 'avif' | 'auto'; // Preferred format
  placeholder?: 'blur' | 'shimmer' | 'none'; // Placeholder type
  aspectRatio?: number; // For maintaining aspect ratio during load
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
  loading = 'lazy',
  sizes = '100vw',
  quality = 80,
  format = 'auto',
  placeholder = 'blur',
  aspectRatio
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [srcSet, setSrcSet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use intersection observer only if not priority - more aggressive for mobile
  const { ref: intersectionRef, isInView } = useIntersectionObserver({
    threshold: 0.01, // 1% visibility to show media content
    rootMargin: priority ? '0px' : '200px' // Even more aggressive margin
  });

  // Generate responsive image sources
  const generateImageSources = (url: string) => {
    // Use direct URL for R2 and video content - no optimization needed
    const directUrl = getDirectImageUrl(url);
    return {
      srcSet: '',
      src: directUrl
    };
  };

  useEffect(() => {
    if (priority || isInView) {
      const { srcSet: newSrcSet, src: newSrc } = generateImageSources(src);
      setImageSrc(newSrc);
      setSrcSet(newSrcSet);
    }
  }, [src, isInView, priority, width, height, quality, format]);

  const handleLoad = () => {
    setIsLoading(false);
    setShowPlaceholder(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    setShowPlaceholder(false);
    onError?.(e);
  };

  // Create blur placeholder
  const getPlaceholderStyle = () => {
    if (placeholder === 'none' || !showPlaceholder) return {};
    
    const baseStyle = {
      backgroundColor: 'rgb(229, 229, 229)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };

    if (placeholder === 'shimmer') {
      return {
        ...baseStyle,
        background: 'linear-gradient(90deg, rgb(229, 229, 229) 25%, rgb(243, 244, 246) 50%, rgb(229, 229, 229) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
      };
    }

    if (placeholder === 'blur') {
      return {
        ...baseStyle,
        filter: 'blur(20px)',
        transform: 'scale(1.1)',
      };
    }

    return baseStyle;
  };

  return (
    <div
      ref={intersectionRef}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      style={aspectRatio ? { aspectRatio: aspectRatio.toString() } : undefined}
    >
      {/* Enhanced placeholder */}
      {showPlaceholder && (
        <div 
          className="absolute inset-0 z-10" 
          style={getPlaceholderStyle()}
        />
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-media-loading flex items-center justify-center text-muted-foreground">
          <svg className="w-8 h-8 text-muted-foreground/50" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={imageSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'eager'} // Always eager loading to prevent grey placeholders
          decoding="async"
          {...(priority && { fetchPriority: 'high' })}
          onLoad={handleLoad}
          onError={handleError}
          crossOrigin="anonymous"
          className={`w-full h-full object-cover transition-all duration-500 ${
            isLoading || showPlaceholder ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
        />
      )}
    </div>
  );
};

export const OptimizedImage = memo(OptimizedImageComponent);