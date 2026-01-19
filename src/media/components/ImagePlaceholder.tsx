/**
 * ImagePlaceholder Component
 * Displays loading state for images with skeleton or blur placeholder
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface ImagePlaceholderProps {
  /** Placeholder type */
  type: 'skeleton' | 'blur';
  /** Low-quality image URL for blur placeholder */
  blurDataUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  type,
  blurDataUrl,
  className,
}) => {
  // Blur placeholder with LQIP
  if (type === 'blur' && blurDataUrl) {
    return (
      <div
        className={cn('absolute inset-0', className)}
        style={{
          backgroundImage: `url(${blurDataUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.1)', // Prevent blur edges showing
        }}
        aria-hidden="true"
      />
    );
  }

  // Skeleton shimmer (default)
  return (
    <div
      className={cn(
        'absolute inset-0 bg-muted overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
        style={{
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </div>
  );
};

export default ImagePlaceholder;
