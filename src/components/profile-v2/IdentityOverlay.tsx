/**
 * IdentityOverlay - Name, Club, HCP displayed over hero
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { AvatarXPRing } from './AvatarXPRing';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface IdentityOverlayProps {
  displayName: string;
  /** Member's user id — keys the avatar fallback hue. */
  userId?: string | null;
  username: string;
  clubName?: string;
  handicapIndex?: number;
  avatarUrl?: string;
  /** Top 100 courses played count - determines ring tier color */
  top100Count?: number;
  /** Legacy xpValue prop (kept for compatibility) */
  xpValue?: number;
  isVerified?: boolean;
  onAvatarClick?: () => void;
  className?: string;
}

export const IdentityOverlay: React.FC<IdentityOverlayProps> = ({
  displayName,
  username,
  clubName,
  handicapIndex,
  avatarUrl,
  userId,
  top100Count = 0,
  xpValue,
  isVerified,
  onAvatarClick,
  className,
}) => {
  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-10',
        'flex flex-col items-center',
        'pb-6 pt-12',
        className
      )}
    >
      {/* Avatar with Achievement Ring */}
      <AvatarXPRing
        avatarUrl={avatarUrl}
        displayName={displayName}
        userId={userId}
        top100Count={top100Count}
        size="xl"
        onClick={onAvatarClick}
        animateOnFirstView={true}
      />

      {/* Name + Verified Badge */}
      <div className="flex items-center gap-2 mt-4">
        <h1
          className="text-[28px] font-semibold tracking-tight"
          style={{ color: 'var(--dgp-text-primary)' }}
        >
          {displayName}
        </h1>
        {isVerified && (
          <VerifiedBadge size="lg" />
        )}
      </div>

      {/* Club + HCP Row */}
      <div className="flex items-center gap-3 mt-1.5">
        {clubName && (
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            {clubName}
          </span>
        )}
        
        {handicapIndex !== undefined && handicapIndex !== null && (
          <>
            {clubName && (
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: 'var(--dgp-text-muted)' }}
              />
            )}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: 'var(--dgp-glass-surface)',
                color: 'var(--dgp-text-secondary)',
                border: '1px solid var(--dgp-glass-stroke)',
              }}
            >
              HCP {handicapIndex.toFixed(1)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default IdentityOverlay;
