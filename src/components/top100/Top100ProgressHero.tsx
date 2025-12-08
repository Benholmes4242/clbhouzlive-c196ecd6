import React from 'react';
import { motion } from 'framer-motion';
import type { Top100TierId } from '@/lib/top100Club';
import { getTop100Club } from '@/lib/top100Club';
import { AchievementBadgeCard, type AchievementTier } from '@/components/achievements/AchievementBadgeCard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { getNextBadgeNudge } from '@/lib/achievements/nextBadgeNudge';
import NudgeBanner from '@/components/achievements/NudgeBanner';

export interface Top100ProgressHeroProps {
  displayName: string | null;
  avatarUrl: string | null;
  tierId: Top100TierId;
  tierLabel: string | null;
  totalTop100Played: number;
  regionsCount: number;
  lastRoundAt: string | null;
  isOwnProfile?: boolean;
  listsProgress?: Array<{
    listSlug: string;
    played: number;
    total: number;
  }>;
}

// Centered avatar for users with no milestone yet
function CenteredHeroAvatar({ 
  avatarUrl, 
  displayName, 
  ringColor 
}: { 
  avatarUrl: string | null; 
  displayName: string | null;
  ringColor: string | null;
}) {
  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="flex justify-center mb-6">
      <SquircleAvatar
        size={136}
        src={avatarUrl}
        alt={displayName ?? 'Player avatar'}
        fallback={initials}
        ringColor={ringColor}
      />
    </div>
  );
}

// Hero row with avatar left, achievement badge card right
function HeroWithMilestoneRow({ 
  avatarUrl, 
  displayName, 
  ringColor,
  achievementTier,
  totalTop100Played,
  clubName,
}: { 
  avatarUrl: string | null; 
  displayName: string | null;
  ringColor: string | null;
  achievementTier: AchievementTier;
  totalTop100Played: number;
  clubName: string;
}) {
  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <motion.div
      className="mb-6 w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar on the left */}
        <div className="shrink-0">
          <SquircleAvatar
            size={92}
            src={avatarUrl}
            alt={displayName ?? 'Player avatar'}
            fallback={initials}
            ringColor={ringColor}
          />
        </div>

        {/* Achievement badge card on the right - uses canonical component */}
        <div className="flex-1 min-w-0">
          <AchievementBadgeCard
            tier={achievementTier}
            title={`${achievementTier} Club`}
            subtitle={clubName}
            unlocked={true}
            totalTop100Played={totalTop100Played}
          />
        </div>
      </div>
    </motion.div>
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
  listsProgress,
}: Top100ProgressHeroProps) {
  // Ring color from unified theme system
  const tierColor = getRingColorForTotalPlayed(totalTop100Played);
  const club = getTop100Club(totalTop100Played);
  const hasAchievement = totalTop100Played >= 5;
  
  // Map threshold to AchievementTier
  const achievementTier = club.threshold?.toString() as AchievementTier || '5';
  
  const formattedDate = lastRoundAt
    ? new Date(lastRoundAt).toLocaleDateString()
    : null;

  // Calculate nudge if we have list progress data
  const nudge = listsProgress ? getNextBadgeNudge({
    totalTop100Played,
    lists: listsProgress.map(l => {
      const regionMap: Record<string, 'GBI' | 'USA' | 'EU' | 'WORLD'> = {
        'gb-i': 'GBI',
        'usa': 'USA',
        'europe': 'EU',
        'global': 'WORLD',
      };
      return {
        regionId: regionMap[l.listSlug] || 'WORLD',
        played: l.played,
        total: l.total,
      };
    }),
  }) : null;

  return (
    <section className="flex flex-col items-center gap-3 pb-4 px-4">
      {/* Hero: centered avatar OR avatar + milestone side by side */}
      {hasAchievement ? (
        <HeroWithMilestoneRow
          avatarUrl={avatarUrl}
          displayName={displayName}
          ringColor={tierColor}
          achievementTier={achievementTier}
          totalTop100Played={totalTop100Played}
          clubName={club.tierName || 'Top 100 Club'}
        />
      ) : (
        <CenteredHeroAvatar
          avatarUrl={avatarUrl}
          displayName={displayName}
          ringColor={tierColor}
        />
      )}

      {/* Primary summary line */}
      <p className="text-center text-lg font-semibold text-foreground">
        {isOwnProfile ? "You've" : `${displayName} has`} played{' '}
        <span className="font-bold">{totalTop100Played} Top 100 course{totalTop100Played === 1 ? '' : 's'}</span>
      </p>

      {/* Secondary summary line */}
      {formattedDate && (
        <p className="text-sm text-muted-foreground">
          Last Top 100 round: {formattedDate}
        </p>
      )}

      {/* Nudge banner */}
      {nudge && isOwnProfile && (
        <div className="w-full max-w-sm">
          <NudgeBanner nudge={nudge} variant="hero" />
        </div>
      )}
    </section>
  );
}
