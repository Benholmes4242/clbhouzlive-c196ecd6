import React from 'react';
import type { Top100TierId } from '@/lib/top100Club';
import { getRingColorForTier } from '@/lib/top100Club';
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

/**
 * Large avatar component for My Progress page
 * Uses 1/1.05 aspect ratio, 34% border radius
 * LARGE AVATAR: 3px achievement ring + 2.5px grey inner ring
 */
function LargeProgressAvatar({ 
  src, 
  alt, 
  fallback, 
  ringColor 
}: { 
  src: string | null; 
  alt: string; 
  fallback: string;
  ringColor: string | null;
}) {
  const size = 150;
  const fallbackFontSize = Math.round(size * 0.22);
  const hasRing = Boolean(ringColor);

  const avatarContent = src ? (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      loading="eager"
    />
  ) : (
    <div 
      className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground font-semibold"
      style={{ fontSize: `${fallbackFontSize}px` }}
    >
      {fallback}
    </div>
  );

  if (hasRing) {
    return (
      <div
        className="relative overflow-hidden"
        style={{
          width: `${size}px`,
          aspectRatio: '1 / 1.05',
          borderRadius: '34%',
          border: `3px solid ${ringColor}`,
          boxShadow: `0 0 6px ${ringColor}88`,
        }}
      >
        <div
          className="w-full h-full overflow-hidden"
          style={{ borderRadius: '32%', border: '2.5px solid #D1D5DB' }}
        >
          {avatarContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${size}px`,
        aspectRatio: '1 / 1.05',
        borderRadius: '34%',
        border: '2.5px solid #D1D5DB',
      }}
    >
      {avatarContent}
    </div>
  );
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
          {/* Large avatar with custom ring sizes */}
          <LargeProgressAvatar
            src={avatarUrl}
            alt={displayName ?? 'Player avatar'}
            fallback={initials}
            ringColor={tierColor}
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
