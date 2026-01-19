/**
 * OptimizedImage Component
 * 
 * @deprecated Use UnifiedImage from '@/media' instead
 * 
 * This is a backward-compatibility wrapper around UnifiedImage.
 * All new code should import UnifiedImage directly from '@/media'.
 */

import React, { forwardRef } from 'react';
import { UnifiedImage } from '@/media';

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

/**
 * @deprecated Use UnifiedImage from '@/media' instead
 */
export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      priority = false,
      showBlurPlaceholder = false,
      fallbackSrc,
      objectFit = 'cover',
      className,
      style,
      onLoad,
      onError,
      onLoadComplete,
      // These props are not used by UnifiedImage but accepted for backward compat
      fetchPriority,
      srcSet,
      sizes,
      ...props
    },
    ref
  ) => {
    // Map objectFit values that UnifiedImage doesn't support
    const mappedObjectFit = objectFit === 'none' || objectFit === 'scale-down' 
      ? 'contain' 
      : objectFit;

    return (
      <UnifiedImage
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder={showBlurPlaceholder ? 'blur' : 'skeleton'}
        fallbackSrc={fallbackSrc}
        objectFit={mappedObjectFit}
        className={className}
        style={style}
        onLoad={() => {
          onLoad?.(null as any);
          onLoadComplete?.();
        }}
        onError={onError ? () => onError(null as any) : undefined}
        {...props}
      />
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
