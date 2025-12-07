import React from 'react';
import type { Top100TierId } from '@/lib/top100Club';
import { getTop100Club } from '@/lib/top100Club';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';

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

  // Ring color from unified theme system
  const tierColor = getRingColorForTotalPlayed(totalTop100Played);
  const club = getTop100Club(totalTop100Played);
  const hasAchievement = totalTop100Played >= 5;
  
  // Map threshold to AchievementTier
  const achievementTier = club.threshold?.toString() as AchievementTier || '5';
  
  const formattedDate = lastRoundAt
    ? new Date(lastRoundAt).toLocaleDateString()
    : null;

  return (
    <section className="flex flex-col items-center gap-3 pb-4">
      {/* Profile + achievement badge */}
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Large avatar - uses unified ring color */}
          <SquircleAvatar
            size={150}
            src={avatarUrl}
            alt={displayName ?? 'Player avatar'}
            fallback={initials}
            ringColor={tierColor}
          />
        </div>

        {/* Achievement badge below avatar - uses unified AchievementBadgeCard */}
        {hasAchievement && (
          <div className="mt-4">
            <AchievementBadgeCard
              tier={achievementTier}
              title={`${totalTop100Played} Top 100`}
              subtitle={club.tierName || 'Top 100 Club'}
              unlocked={true}
              compact={true}
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
