import React from 'react';
import type { Top100TierId } from '@/lib/top100Club';
import { getRingColorForTier, getTop100Club } from '@/lib/top100Club';
import { AchievementBadge } from '@/components/achievements/AchievementBadge';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

export interface Top100ProgressHeroProps {
  displayName: string | null;
  avatarUrl: string | null;
  tierId: Top100TierId;
  tierLabel: string | null;
  totalTop100Played: number;
  regionsCount: number;
  lastRoundAt: string | null;
  isOwnProfile?: boolean;
}

export function Top100ProgressHero({
  displayName,
  avatarUrl,
  tierId,
  tierLabel,
  totalTop100Played,
  regionsCount,
  lastRoundAt,
  isOwnProfile = true,
}: Top100ProgressHeroProps) {
  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // Only show achievement ring if user has earned one (tierId !== 'none')
  const hasAchievementRing = tierId && tierId !== 'none';
  const tierColor = hasAchievementRing ? getRingColorForTier(tierId) : null;
  const club = getTop100Club(totalTop100Played);
  const hasAchievement = totalTop100Played >= 5;
  
  const formattedDate = lastRoundAt
    ? new Date(lastRoundAt).toLocaleDateString()
    : null;

  return (
    <section className="flex flex-col items-center gap-3 pb-4">
      {/* Profile + achievement badge */}
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Large avatar - follows global avatar ring rule */}
          <SquircleAvatar
            size={150}
            src={avatarUrl}
            alt={displayName ?? 'Player avatar'}
            fallback={initials}
            ringColor={tierColor}
          />
        </div>

        {/* Achievement badge below avatar - only if user has first achievement */}
        {hasAchievement && (
          <div className="mt-4">
            <AchievementBadge
              count={totalTop100Played}
              title="Top 100"
              tierLabel={club.tierName || 'Top 100 Club'}
              ringColor={club.ringColor}
              size="md"
            />
          </div>
        )}
      </div>

      {/* Primary summary line */}
      <p className="mt-2 text-center text-lg font-semibold text-foreground">
        {isOwnProfile ? "You've" : `${displayName} has`} played{' '}
        <span className="font-bold">{totalTop100Played} Top 100 course{totalTop100Played === 1 ? '' : 's'}</span>
      </p>

      {/* Secondary summary line */}
      {formattedDate && (
        <p className="text-sm text-muted-foreground">
          Last Top 100 round: {formattedDate}
        </p>
      )}
    </section>
  );
}
