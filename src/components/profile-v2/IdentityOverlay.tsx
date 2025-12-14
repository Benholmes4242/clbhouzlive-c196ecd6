/**
 * IdentityOverlay - Name, Club, HCP displayed over hero
 * 
 * V1 Polish Pass:
 * - Tighter name → identity row spacing
 * - Club + HCP inline as single identity row
 * - Calm motion: 220ms cubic-bezier(0.4, 0.0, 0.2, 1)
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { AvatarXPRing } from './AvatarXPRing';
import { ShieldCheck } from 'lucide-react';

interface IdentityOverlayProps {
  displayName: string;
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

// V1 Polish: Calm motion easing
const POLISH_TRANSITION = 'all 220ms cubic-bezier(0.4, 0.0, 0.2, 1)';

export const IdentityOverlay: React.FC<IdentityOverlayProps> = ({
  displayName,
  username,
  clubName,
  handicapIndex,
  avatarUrl,
  top100Count = 0,
  xpValue,
  isVerified,
  onAvatarClick,
  className,
}) => {
  const hasClubOrHcp = clubName || (handicapIndex !== undefined && handicapIndex !== null);
  
  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-10',
        'flex flex-col items-center',
        'pb-6 pt-12',
        className
      )}
      style={{ transition: POLISH_TRANSITION }}
    >
      {/* Avatar with Achievement Ring */}
      <AvatarXPRing
        avatarUrl={avatarUrl}
        displayName={displayName}
        top100Count={top100Count}
        size="xl"
        onClick={onAvatarClick}
        animateOnFirstView={true}
      />

      {/* Name + Verified Badge - strongest hierarchy */}
      <div 
        className="flex items-center gap-2 mt-3"
        style={{ transition: POLISH_TRANSITION }}
      >
        <h1
          className="text-[28px] font-semibold tracking-tight"
          style={{ color: 'var(--dgp-text-primary)' }}
        >
          {displayName}
        </h1>
        {isVerified && (
          <ShieldCheck
            className="w-5 h-5"
            style={{ color: 'var(--dgp-accent-green)' }}
          />
        )}
      </div>

      {/* Club + HCP Inline Identity Row - secondary hierarchy, tighter spacing */}
      {hasClubOrHcp && (
        <div 
          className="flex items-center gap-2 mt-1"
          style={{ transition: POLISH_TRANSITION }}
        >
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
                  className="text-sm font-medium"
                  style={{ color: 'var(--dgp-text-muted)' }}
                >
                  ·
                </span>
              )}
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--dgp-text-secondary)' }}
              >
                {handicapIndex.toFixed(1)} HCP
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default IdentityOverlay;
