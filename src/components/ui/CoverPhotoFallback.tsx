import React from 'react';
import { cn } from '@/lib/utils';

interface CoverPhotoFallbackProps {
  className?: string;
}

/**
 * Cover photo fallback — rendered behind the avatar on profile pages when the
 * user has no cover_photo_url set. Soft neutral gradient only, no watermark.
 *
 * Matches the Clbhouz design language: restraint, page-bg-neutral chrome,
 * brand colour reserved for content and accents (avatar ring, HCP pill, etc).
 */
export const CoverPhotoFallback: React.FC<CoverPhotoFallbackProps> = ({
  className,
}) => {
  return (
    <div
      className={cn('relative w-full h-full overflow-hidden', className)}
      style={{
        // Cinematic dark fallback so full-bleed heroes bleed into the notch
        // intentionally (instead of reading as a grey status-bar strip).
        background:
          'linear-gradient(180deg, #1E4D38 0%, #163A2B 45%, #0F172A 100%)',
      }}
    />
  );
};

export default CoverPhotoFallback;
