import React from 'react';
import type { Top100Ring } from '@/lib/top100Club';
import { TIER_BY_ID } from '@/lib/top100Club';
import { getRingColorForTotalPlayed, MILESTONE_THEMES } from '@/lib/globalAchievementMilestoneSystem';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
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

/**
 * Top100HeroSection - Part of Global Achievement & Milestone System
 * Uses unified colors from globalAchievementMilestoneSystem.ts
 */
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

  // Get ring color from Global Achievement & Milestone System
  const hasAchievementRing = clubRing && clubRing !== 'none';
  const tierColor = hasAchievementRing ? getRingColorForTotalPlayed(totalPlayed) : null;

  return (
    <div className="flex flex-col items-center text-center space-y-4 py-4">
      {/* Avatar with achievement tier ring - uses unified system colors */}
      <div className="relative flex items-center justify-center">
        <SquircleAvatar
          size={144}
          src={avatarUrl}
          alt={displayName ?? 'Player avatar'}
          fallback={initials}
          ringColor={tierColor}
          className="shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
        />
        {/* Achievement badge pill - overlaying bottom of avatar */}
        {hasAchievementRing && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
            <Top100AchievementBadge
              tier={clubRing}
              showSubtitle={false}
              size="compact"
              totalTop100Played={totalPlayed}
            />
          </div>
        )}
      </div>

      {/* Stats - extra top margin to account for badge overlay */}
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