import React, { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useLazyIntersectionObserver } from '@/hooks/useLazyIntersectionObserver';
import { useImageLoader } from '@/hooks/useImageLoader';
import { generateSrcSet, generateBlurPlaceholder, getOptimalQuality } from '@/utils/imageHelpers';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  progressive?: boolean;
  fallback?: string;
  responsive?: boolean;
  sizes?: string;
  blur?: boolean;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: (e?: any) => void;
}

/**
 * Enhanced LazyImage with WebP conversion, progressive loading, and connection-aware quality
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  priority = false,
  quality = 'auto',
  progressive = true,
  responsive = true,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  blur = true,
  fallback = '/placeholder.svg',
  onLoadStart,
  onLoad,
  onError,
  ...props
}) => {
  const imgRef = useRef<HTMLImageElement>(null);

  // Use intersection observer hook
  const { isInView, setContainerRef } = useLazyIntersectionObserver({
    priority,
    rootMargin: '50px',
    threshold: 0.1,
  });

  // Use image loader hook
  const {
    isLoaded,
    isLoading,
    hasError,
    currentSrc,
    showLowQuality,
    handleLoad,
    handleError,
  } = useImageLoader({
    src,
    isInView,
    priority,
    progressive,
    quality,
    fallback,
    onLoadStart,
    onLoad,
    onError,
  });

  // Generate responsive image sources
  const srcSet = useCallback(() => {
    if (!responsive || !src.includes('supabase')) return '';
    const optimalQuality = getOptimalQuality(quality);
    return generateSrcSet(src, optimalQuality);
  }, [responsive, src, quality]);

  // Generate blur placeholder
  const blurPlaceholder = useCallback(() => {
    return blur ? generateBlurPlaceholder() : '';
  }, [blur]);

  const shouldLoad = isInView || priority;

  return (
    <div 
      ref={setContainerRef}
      className={cn('relative overflow-hidden bg-muted', className)}
    >
      {/* Placeholder/Loading state */}
      {!isLoaded && shouldLoad && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
      )}

      {/* Blur placeholder */}
      {blur && !isLoaded && shouldLoad && (
        <img
          src={blurPlaceholder()}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Main image with responsive support */}
      {shouldLoad && (
        <img
          ref={imgRef}
          src={currentSrc || fallback}
          srcSet={responsive ? srcSet() : undefined}
          sizes={responsive ? sizes : undefined}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            isLoading && 'opacity-70',
            showLowQuality && 'filter blur-[1px]',
            hasError && 'opacity-50',
            !isLoaded && blur && 'opacity-0'
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-muted-foreground text-xs">
            Failed to load
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;