/**
 * BlurredMediaBackground - Creates Apple-quality blurred background for letterboxing
 * 
 * Uses significantly oversized (200%) blur source with heavy blur (60px)
 * to create seamless, edge-free backgrounds that match the media.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface BlurredMediaBackgroundProps {
  /** Source URL for the background image */
  src: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether this is for a video (uses poster/thumbnail) */
  isVideo?: boolean;
}

export const BlurredMediaBackground: React.FC<BlurredMediaBackgroundProps> = ({
  src,
  className = '',
  isVideo = false,
}) => {
  if (!src) return null;

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {/* Blur layer - significantly oversized (200%) to prevent edge visibility */}
      <div className="absolute inset-[-50%] w-[200%] h-[200%]">
        <img 
          src={src}
          alt=""
          aria-hidden="true"
          className={cn(
            'w-full h-full object-cover',
            // Heavy blur for smooth, abstract background
            'blur-[60px]',
            // Boost saturation slightly to match original media vibrancy
            'saturate-[1.2]',
            // Darken so foreground media stands out
            'brightness-[0.7]'
          )}
          loading="lazy"
          decoding="async"
        />
      </div>
      {/* Gradient overlays for depth and to help media stand out */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
      <div className="absolute inset-0 bg-black/25" />
    </div>
  );
};

export default BlurredMediaBackground;
