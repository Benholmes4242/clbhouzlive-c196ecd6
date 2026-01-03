import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import type { Top100TierId } from '@/lib/top100Club';
import { getTop100Club } from '@/lib/top100Club';
import { AchievementBadgeCard, type AchievementTier } from '@/components/achievements/AchievementBadgeCard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { getNextBadgeNudge } from '@/lib/achievements/nextBadgeNudge';
import NudgeBanner from '@/components/achievements/NudgeBanner';
import { Check } from 'lucide-react';

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

// Premium glass pill for unlocked status (B1)
function UnlockedPill() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
      <Check className="w-3 h-3 text-emerald-400" />
      <span className="text-[10px] font-medium text-white/80 tracking-wide">Unlocked</span>
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
      className="w-full mt-4 mb-4 px-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Direct flex row on page background - no container clipping */}
      <div
        className="flex items-center justify-between"
        style={{
          columnGap: 'min(max(32px, 5vw), 56px)',
        }}
      >
        {/* Avatar on the left - responsive size, no clipping wrapper */}
        <div
          style={{
            width: 'min(34vw, 140px)',
            height: 'min(34vw, 140px)',
            minWidth: '90px',
            minHeight: '90px',
          }}
        >
          <SquircleAvatar
            size={140}
            src={avatarUrl}
            alt={displayName ?? 'Player avatar'}
            fallback={initials}
            ringColor={ringColor}
            className="w-full h-full"
          />
        </div>

        {/* Achievement badge card on the right - removed secondary Unlocked line per polish (1) */}
        <div
          style={{
            width: 'min(42vw, 260px)',
            minWidth: '140px',
          }}
          className="flex flex-col items-center gap-2"
        >
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
  
  // Human-friendly date format: "1 Feb 2026" (A3)
  const formattedDate = lastRoundAt
    ? format(new Date(lastRoundAt), 'd MMM yyyy')
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
    <section className="flex flex-col items-center gap-3">
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

      {/* Primary summary line - DOMINANT number (A2) */}
      <p className="text-center text-foreground px-4">
        <span className="text-base font-medium">
          {isOwnProfile ? "You've played " : `${displayName} has played `}
        </span>
        <span className="text-3xl font-bold text-foreground">
          {totalTop100Played}
        </span>
        <span className="text-base font-medium">
          {' '}Top 100 course{totalTop100Played === 1 ? '' : 's'}
        </span>
      </p>

      {/* Secondary summary line - human-friendly date (A3) */}
      {formattedDate && (
        <p className="text-sm text-muted-foreground">
          Last logged: {formattedDate}
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