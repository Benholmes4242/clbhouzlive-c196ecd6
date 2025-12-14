/**
 * IdentityOverlay - Name, Club, HCP displayed over hero
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
  xpValue: number;
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
      {/* Avatar with XP Ring */}
      <AvatarXPRing
        avatarUrl={avatarUrl}
        displayName={displayName}
        xpValue={xpValue}
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
          <ShieldCheck
            className="w-5 h-5"
            style={{ color: 'var(--dgp-accent-green)' }}
          />
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
