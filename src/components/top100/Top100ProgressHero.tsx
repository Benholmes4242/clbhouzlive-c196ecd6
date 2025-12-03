import React from 'react';
import type { Top100TierId } from '@/lib/top100Club';
import { getRingColorForTier } from '@/lib/top100Club';
import { Squircle } from '@/components/ui/squircle';
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

  const tierColor = getRingColorForTier(tierId);
  
  const formattedDate = lastRoundAt
    ? new Date(lastRoundAt).toLocaleDateString()
    : null;

  return (
    <section className="flex flex-col items-center gap-3 pb-4">
      {/* Profile + achievement pill */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
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
