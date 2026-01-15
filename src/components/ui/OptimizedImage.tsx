/**
 * Phase 1 Perf: Optimized image component with lazy loading and proper sizing
 * Features:
 * - Lazy loading by default (disable with priority prop for LCP images)
 * - Required width/height to prevent CLS
 * - Async decoding for non-blocking decode
 * - Fetch priority hints for LCP optimization
 * - Cloudflare Images srcset auto-generation
 * - Error handling with fallback
 */

import React, { forwardRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'width' | 'height'> {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility - required */
  alt: string;
  /** Width of the image - required for CLS prevention */
  width: number;
  /** Height of the image - required for CLS prevention */
  height: number;
  /** Set to true for LCP/above-fold images to disable lazy loading */
  priority?: boolean;
  /** Fetch priority hint for the browser */
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Optional srcset for responsive images */
  srcSet?: string;
  /** Optional sizes attribute for responsive images */
  sizes?: string;
  /** Show blur placeholder while loading */
  showBlurPlaceholder?: boolean;
  /** Custom fallback image on error */
  fallbackSrc?: string;
  /** Callback when image finishes loading */
  onLoadComplete?: () => void;
  /** Object fit mode */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      priority = false,
      fetchPriority,
      srcSet,
      sizes,
      showBlurPlaceholder = false,
      fallbackSrc,
      onLoadComplete,
      objectFit = 'cover',
      className,
      style,
      onLoad,
      onError,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoaded(true);
      onLoadComplete?.();
      onLoad?.(e);
    }, [onLoadComplete, onLoad]);

    const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
      setHasError(true);
      onError?.(e);
    }, [onError]);

    // Generate srcset for Cloudflare Images URLs
    const generatedSrcSet = srcSet || generateCloudflareImagesSrcSet(src, width);
    const generatedSizes = sizes || generateDefaultSizes(width);

    // Determine actual src (use fallback if error occurred)
    const actualSrc = hasError && fallbackSrc ? fallbackSrc : src;

    // Determine fetch priority - high for priority/LCP images
    const computedFetchPriority = fetchPriority || (priority ? 'high' : 'auto');

    // Object fit class mapping
    const objectFitClass = {
      cover: 'object-cover',
      contain: 'object-contain',
      fill: 'object-fill',
      none: 'object-none',
      'scale-down': 'object-scale-down',
    }[objectFit];

    if (showBlurPlaceholder) {
      return (
        <div
          className={cn('relative overflow-hidden', className)}
          style={{
            width: typeof width === 'number' ? width : undefined,
            height: typeof height === 'number' ? height : undefined,
            ...style,
          }}
        >
          {/* Blur placeholder */}
          {!isLoaded && (
            <div
              className="absolute inset-0 bg-muted animate-pulse"
              aria-hidden="true"
            />
          )}
          
          <img
            ref={ref}
            src={actualSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={computedFetchPriority}
            srcSet={generatedSrcSet}
            sizes={generatedSizes}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full transition-opacity duration-300',
              objectFitClass,
              !isLoaded && 'opacity-0',
              isLoaded && 'opacity-100'
            )}
            {...props}
          />
        </div>
      );
    }

    // Simple version without wrapper (better for most cases)
    return (
      <img
        ref={ref}
        src={actualSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={computedFetchPriority}
        srcSet={generatedSrcSet}
        sizes={generatedSizes}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(objectFitClass, className)}
        style={style}
        {...props}
      />
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Generate srcset for Cloudflare Images URLs
 */
function generateCloudflareImagesSrcSet(src: string, baseWidth: number): string | undefined {
  if (!src) return undefined;
  
  // Only generate for Cloudflare-hosted images
  const isCloudflare = 
    src.includes('imagedelivery.net') ||
    src.includes('cloudflareimages.com') ||
    src.includes('/cdn-cgi/image/');
    
  if (!isCloudflare) return undefined;

  // Generate responsive widths: 0.5x, 1x, 1.5x, 2x
  const widths = [
    Math.round(baseWidth * 0.5),
    baseWidth,
    Math.round(baseWidth * 1.5),
    Math.round(baseWidth * 2),
  ].filter((w) => w <= 2000 && w > 0);

  // For imagedelivery.net URLs, we can specify width variant
  if (src.includes('imagedelivery.net')) {
    return widths
      .map((w) => `${src}/w=${w} ${w}w`)
      .join(', ');
  }

  return undefined;
}

/**
 * Generate default sizes attribute for responsive images
 */
function generateDefaultSizes(baseWidth: number): string {
  return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${baseWidth}px`;
}

export default OptimizedImage;
