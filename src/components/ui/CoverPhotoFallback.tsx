import React from 'react';
import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoverPhotoFallbackProps {
  className?: string;
  /** Hide the watermark (for very small previews where the flag looks cramped) */
  hideWatermark?: boolean;
}

/**
 * Cover photo fallback — rendered behind the avatar on profile pages when the
 * user has no cover_photo_url set. Soft neutral gradient with a subtle Clbhouz
 * brand watermark so the empty state reads as intentional, not broken.
 *
 * Matches the Clbhouz design language: restraint, page-bg-neutral chrome,
 * brand colour reserved for content and accents (avatar ring, HCP pill, etc).
 */
export const CoverPhotoFallback: React.FC<CoverPhotoFallbackProps> = ({
  className,
  hideWatermark = false,
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
    >
      {!hideWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Flag
            className="w-24 h-24"
            strokeWidth={1.5}
            style={{ color: '#FFFFFF', opacity: 0.10 }}
          />
        </div>
      )}
    </div>
  );
};

export default CoverPhotoFallback;
