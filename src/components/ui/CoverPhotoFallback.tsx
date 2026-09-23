import React from 'react';
import { cn } from '@/lib/utils';
import { MEMBER_CELL, MEMBER_PANEL } from '@/lib/tokens/surfaces';

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
        // Filled content fallback: Cell settles into Panel beneath the avatar.
        background: `linear-gradient(180deg, ${MEMBER_CELL} 0%, ${MEMBER_PANEL} 45%, ${MEMBER_PANEL} 100%)`,
      }}
    />
  );
};

export default CoverPhotoFallback;
