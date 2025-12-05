import React from 'react';
import type { Top100TierId } from '@/lib/top100Club';
import { getRingColorForTier } from '@/lib/top100Club';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Top100AchievementBadge } from './Top100AchievementBadge';

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

  const tierColor = tierId && tierId !== 'none' ? getRingColorForTier(tierId) : null;
  
  const formattedDate = lastRoundAt
    ? new Date(lastRoundAt).toLocaleDateString()
    : null;

  return (
    <section className="flex flex-col items-center gap-3 pb-4">
      {/* Profile + achievement pill */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {/* Avatar with new squircle spec */}
          <SquircleAvatar
            size={150}
            src={avatarUrl}
            alt={displayName ?? 'Player avatar'}
            fallback={initials}
            ringColor={tierColor}
            priority
          />

          {/* Achievement badge pill - overlaying bottom of avatar */}
          {tierId && tierId !== 'none' && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <Top100AchievementBadge
                tier={tierId}
                showSubtitle={false}
                size="compact"
              />
            </div>
          )}
        </div>
      </div>

      {/* Primary summary line */}
      <p className="mt-4 text-center text-lg font-semibold text-foreground">
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
