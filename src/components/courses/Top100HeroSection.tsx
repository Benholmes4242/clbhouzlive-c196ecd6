import React from 'react';
import type { Top100Ring } from '@/lib/top100Club';

// Tier color mapping (hex values for inline styles)
const TIER_COLORS: Record<Top100Ring, string> = {
  none: '#94a3b8',
  rookie: '#D9C7A3',
  fairway: '#8BBF5A',
  founders: '#2E5930',
  heritage: '#C8A44B',
  century: '#B7BCC6',
  elite: '#D9A441',
  legendary: '#5A3E8C',
  grandslam: '#0C0F14',
};

export interface Top100HeroSectionProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  totalPlayed: number;
  regionsCount: number;
  clubRing?: Top100Ring;
  clubLabel?: string | null;
  clubTierName?: string | null;
  lastPlayedDate?: string | null;
  isOwnProfile?: boolean;
}

export function Top100HeroSection({
  avatarUrl,
  displayName,
  totalPlayed,
  regionsCount,
  clubRing = 'none',
  clubLabel,
  clubTierName,
  lastPlayedDate,
  isOwnProfile,
}: Top100HeroSectionProps) {
  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const tierColor = TIER_COLORS[clubRing] || TIER_COLORS.none;

  return (
    <div className="flex flex-col items-center text-center space-y-4 py-4">
      {/* Ring + avatar */}
      <div className="relative">
        {/* Outer white container with subtle glow */}
        <div
          className="flex items-center justify-center rounded-[36px] p-[4px]"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: `0 0 24px rgba(0,0,0,0.06), 0 0 28px ${tierColor}22`,
          }}
        >
          {/* Tier ring */}
          <div
            className="rounded-[30px] p-[3px]"
            style={{ border: `4px solid ${tierColor}` }}
          >
            {/* White inner ring */}
            <div className="rounded-[26px] p-[2px] bg-white">
              {/* Avatar squircle */}
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName ?? 'Golfer avatar'}
                  className="h-32 w-24 rounded-[22px] object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="h-32 w-24 rounded-[22px] bg-slate-200 flex items-center justify-center text-xl font-semibold text-slate-700">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Club pill – text only, tier colored */}
        {clubTierName && (
          <div
            className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 bottom-0 px-4 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap"
            style={{
              backgroundColor: `${tierColor}12`,
              borderColor: tierColor,
              color: tierColor,
            }}
          >
            {clubTierName}
          </div>
        )}
      </div>

      {/* Stats - tighter spacing */}
      <div className="text-center mt-6 flex flex-col gap-1.5">
        <p className="text-lg font-semibold text-foreground">
          {isOwnProfile ? "You've" : `${displayName} has`} played {totalPlayed} Top 100 course
          {totalPlayed === 1 ? '' : 's'}
        </p>

        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          Across {regionsCount} {regionsCount === 1 ? 'region' : 'regions'}
        </p>

        {lastPlayedDate && (
          <p className="text-sm text-muted-foreground">
            Last Top 100 round: {new Date(lastPlayedDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
