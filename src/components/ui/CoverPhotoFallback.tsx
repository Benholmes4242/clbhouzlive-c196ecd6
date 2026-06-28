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
        background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 50%, #CBD5E1 100%)',
      }}
    >
      {!hideWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Flag
            className="w-24 h-24"
            strokeWidth={1.5}
            style={{ color: '#0F172A', opacity: 0.08 }}
          />
        </div>
      )}
    </div>
  );
};

export default CoverPhotoFallback;
