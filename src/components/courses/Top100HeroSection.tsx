import React from 'react';
import type { Top100Ring } from '@/lib/top100Club';
import { getRingColorForTier } from '@/lib/top100Club';
import { Squircle } from '@/components/ui/squircle';
import { Top100AchievementBadge } from '@/components/top100/Top100AchievementBadge';

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

  // Get ring color from unified tier system
  const tierColor = getRingColorForTier(clubRing);

  return (
    <div className="flex flex-col items-center text-center space-y-4 py-4">
      {/* Avatar with achievement tier ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer tier ring using squircle mask - 2px */}
        <Squircle width={150} height={150}>
          <div 
            className="w-full h-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
            style={{ backgroundColor: tierColor }}
          >
            {/* White ring layer - 1px */}
            <Squircle width={146} height={146}>
              <div className="w-full h-full bg-white flex items-center justify-center">
                {/* Avatar */}
                <Squircle width={144} height={144}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName ?? 'Player avatar'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-semibold bg-muted text-foreground">
                      {initials}
                    </div>
                  )}
                </Squircle>
              </div>
            </Squircle>
          </div>
        </Squircle>
      </div>

      {/* Achievement badge pill - below avatar */}
      {clubRing && clubRing !== 'none' && (
        <div className="mt-3">
          <Top100AchievementBadge
            tier={clubRing}
            showSubtitle={false}
            size="compact"
          />
        </div>
      )}

      {/* Stats */}
      <div className="text-center flex flex-col gap-1.5">
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
