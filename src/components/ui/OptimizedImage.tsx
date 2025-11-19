/**
 * Phase 1 Perf: Optimized image component with lazy loading and proper sizing
 * Use this for all non-critical images (below fold, grids, feeds)
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean; // Set true for above-the-fold images
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  ...props
}) => {
  // Phase 1 Perf: Add lazy loading for non-priority images
  const loading = priority ? 'eager' : 'lazy';
  
  // Generate optimized srcset if width/height provided
  const srcSet = width && src.includes('http') && !src.includes('cloudflare') 
    ? `
      ${src}?w=${Math.floor(width * 0.5)}&h=${height ? Math.floor(height * 0.5) : ''} ${Math.floor(width * 0.5)}w,
      ${src}?w=${width}&h=${height || ''} ${width}w,
      ${src}?w=${Math.floor(width * 1.5)}&h=${height ? Math.floor(height * 1.5) : ''} ${Math.floor(width * 1.5)}w
    `.trim()
    : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      className={cn(className)}
      {...props}
    />
  );
};
