/**
 * UnifiedImage Component
 * THE image component for the entire app
 * 
 * Features:
 * - Lazy loading with native loading="lazy" 
 * - Placeholder states (skeleton, blur, none)
 * - Error handling with fallback
 * - Aspect ratio enforcement for CLS prevention
 * - Srcset generation for R2/Cloudflare images
 * - Priority loading for LCP images
 */

import React, { useState, useCallback, useMemo, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AspectRatio as AspectRatioType } from '@/media/types';
import { ImagePlaceholder } from './ImagePlaceholder';

export interface UnifiedImageProps {
  /** Image URL (R2, CDN, or any URL) */
  src: string;
  /** Alt text for accessibility (REQUIRED) */
  alt: string;
  /** Display width in pixels */
  width?: number;
  /** Display height in pixels */
  height?: number;
  /** Aspect ratio if no width/height */
  aspectRatio?: AspectRatioType;
  /** How image fills container (default: 'cover') */
  objectFit?: 'cover' | 'contain' | 'fill';
  /** Disable lazy load for LCP images */
  priority?: boolean;
  /** Placeholder type (default: 'skeleton') */
  placeholder?: 'blur' | 'skeleton' | 'none';
  /** Low-quality image for blur placeholder */
  blurDataUrl?: string;
  /** Fallback image URL on error */
  fallbackSrc?: string;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Called when image loads */
  onLoad?: () => void;
  /** Called on load error */
  onError?: (error: Error) => void;
  /** Show error UI on failure (default: true) */
  showErrorState?: boolean;
  /** Show retry button on error (default: false) */
  retryable?: boolean;
}

type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

export const UnifiedImage = forwardRef<HTMLImageElement, UnifiedImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      aspectRatio,
      objectFit = 'cover',
      priority = false,
      placeholder = 'skeleton',
      blurDataUrl,
      fallbackSrc,
      className,
      style,
      onLoad,
      onError,
      showErrorState = true,
      retryable = false,
    },
    ref
  ) => {
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [currentSrc, setCurrentSrc] = useState(src);
    const [retryCount, setRetryCount] = useState(0);

    // Calculate aspect ratio style for CLS prevention
    const aspectRatioStyle = useMemo(() => {
      if (width && height) {
        return { aspectRatio: `${width}/${height}` };
      }
      if (aspectRatio && aspectRatio !== 'auto') {
        const ratioMap: Record<string, string> = {
          '3:4': '3/4',
          '4:3': '4/3',
          '16:9': '16/9',
          '9:16': '9/16',
          '1:1': '1/1',
          '21:9': '21/9',
        };
        return { aspectRatio: ratioMap[aspectRatio] || aspectRatio };
      }
      return {};
    }, [width, height, aspectRatio]);

    // Generate srcset for responsive images (if R2/Cloudflare)
    const srcSet = useMemo(() => {
      // Skip srcset for data URLs or non-http URLs
      if (!src || src.startsWith('data:') || !src.startsWith('http')) {
        return undefined;
      }

      // Check if it's a Cloudflare Images URL that supports transforms
      if (src.includes('imagedelivery.net')) {
        // Generate responsive sizes
        const sizes = [320, 640, 960, 1280, 1920];
        return sizes
          .map(w => `${src}/w=${w} ${w}w`)
          .join(', ');
      }

      // For R2 storage with image resizing
      if (src.includes('r2.cloudflarestorage') || src.includes('/cdn-cgi/image/')) {
        const sizes = [320, 640, 960, 1280, 1920];
        return sizes
          .map(w => `${src}?width=${w} ${w}w`)
          .join(', ');
      }

      return undefined;
    }, [src]);

    // Generate sizes attribute
    const sizesAttr = useMemo(() => {
      if (width) {
        return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${width}px`;
      }
      return '100vw';
    }, [width]);

    // Object fit class
    const objectFitClass = {
      cover: 'object-cover',
      contain: 'object-contain',
      fill: 'object-fill',
    }[objectFit];

    // Handle image load
    const handleLoad = useCallback(() => {
      setLoadingState('loaded');
      onLoad?.();
    }, [onLoad]);

    // Handle image error
    const handleError = useCallback(() => {
      // Try fallback first
      if (currentSrc !== fallbackSrc && fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        return;
      }
      
      setLoadingState('error');
      onError?.(new Error(`Failed to load image: ${src}`));
    }, [currentSrc, fallbackSrc, src, onError]);

    // Handle retry
    const handleRetry = useCallback(() => {
      setRetryCount(c => c + 1);
      setLoadingState('idle');
      setCurrentSrc(`${src}${src.includes('?') ? '&' : '?'}retry=${retryCount + 1}`);
    }, [src, retryCount]);

    // Handle image load start
    const handleLoadStart = useCallback(() => {
      if (loadingState === 'idle') {
        setLoadingState('loading');
      }
    }, [loadingState]);

    // Determine what to show
    const showPlaceholder = loadingState !== 'loaded' && loadingState !== 'error';
    const showError = loadingState === 'error' && showErrorState;
    const showImage = loadingState !== 'error' || !showErrorState;

    return (
      <div
        className={cn(
          'relative overflow-hidden',
          className
        )}
        style={{
          ...aspectRatioStyle,
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
          ...style,
        }}
      >
        {/* Placeholder */}
        {showPlaceholder && placeholder !== 'none' && (
          <ImagePlaceholder
            type={placeholder}
            blurDataUrl={blurDataUrl}
          />
        )}

        {/* Error state */}
        {showError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
            <svg
              className="w-8 h-8 mb-2 text-muted-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Failed to load</span>
            {retryable && (
              <button
                onClick={handleRetry}
                className="mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Actual image */}
        {showImage && (
          <img
            ref={ref}
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            srcSet={srcSet}
            sizes={srcSet ? sizesAttr : undefined}
            onLoad={handleLoad}
            onLoadStart={handleLoadStart}
            onError={handleError}
            className={cn(
              'w-full h-full transition-opacity duration-300',
              objectFitClass,
              loadingState === 'loaded' ? 'opacity-100' : 'opacity-0'
            )}
          />
        )}
      </div>
    );
  }
);

UnifiedImage.displayName = 'UnifiedImage';

export default UnifiedImage;
