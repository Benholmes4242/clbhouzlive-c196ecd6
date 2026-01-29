/**
 * BlurredMediaBackground - Creates a blurred, scaled background for letterboxing
 * 
 * Used when displaying media with object-contain to fill empty space with
 * a pleasing blurred version of the same image.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface BlurredMediaBackgroundProps {
  /** Source URL for the background image */
  src: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether this is for a video (uses different blur settings) */
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
      {/* Blurred, scaled-up version of the image */}
      <img 
        src={src}
        alt=""
        aria-hidden="true"
        className={cn(
          'absolute inset-[-20%] w-[140%] h-[140%] object-cover',
          isVideo ? 'blur-2xl saturate-125 opacity-40' : 'blur-3xl saturate-150 opacity-50'
        )}
        loading="lazy"
        decoding="async"
      />
      {/* Dark gradient overlay for contrast and readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/30" />
    </div>
  );
};

export default BlurredMediaBackground;
