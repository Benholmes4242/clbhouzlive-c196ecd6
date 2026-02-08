import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import type { Top100TierId } from '@/lib/top100Club';
import { getTop100Club } from '@/lib/top100Club';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getNextBadgeNudge } from '@/lib/achievements/nextBadgeNudge';
import NudgeBanner from '@/components/achievements/NudgeBanner';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}: { 
  avatarUrl: string | null; 
  displayName: string | null;
}) {
  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="flex justify-center mb-6">
      <div className="relative">
        {/* Subtle shadow for depth */}
        <div 
          className="absolute inset-0 rounded-sq-md blur-xl opacity-20"
            style={{ backgroundColor: 'hsl(var(--muted-foreground))' }}
        />
        <SquircleAvatar
          size={136}
          src={avatarUrl}
          alt={displayName ?? 'Player avatar'}
          fallback={initials}
          thinRing
        />
      </div>
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
  achievementTier,
  totalTop100Played,
  clubName,
}: { 
  avatarUrl: string | null; 
  displayName: string | null;
  achievementTier: EliteCardTier;
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
        {/* Avatar on the left - with subtle shadow for depth */}
        <div
          className="relative"
          style={{
            width: 'min(34vw, 140px)',
            height: 'min(34vw, 140px)',
            minWidth: '90px',
            minHeight: '90px',
          }}
        >
          {/* Subtle glow behind avatar */}
          <div 
            className="absolute inset-2 rounded-sq-md blur-xl opacity-15 transition-opacity"
            style={{ backgroundColor: 'hsl(var(--muted-foreground))' }}
          />
          <SquircleAvatar
            size={140}
            src={avatarUrl}
            alt={displayName ?? 'Player avatar'}
            fallback={initials}
            thinRing
            className="w-full h-full relative z-10"
          />
        </div>

        {/* Achievement badge card on the right - with gold shimmer for earned */}
        <div
          style={{
            width: 'min(42vw, 260px)',
            minWidth: '140px',
          }}
          className="flex flex-col items-center gap-2 relative"
        >
          <EliteGameCard
            tier={achievementTier}
            earned={true}
            currentProgress={totalTop100Played}
            title={clubName}
            compact
            hideBorder
            hideCheckmark
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
  const club = getTop100Club(totalTop100Played);
  const hasAchievement = totalTop100Played >= 5;
  
  // Map threshold to EliteCardTier
  const achievementTier = club.threshold?.toString() as EliteCardTier || '5';
  
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
    <motion.section 
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Hero: centered avatar OR avatar + milestone side by side */}
      {hasAchievement ? (
        <HeroWithMilestoneRow
          avatarUrl={avatarUrl}
          displayName={displayName}
          achievementTier={achievementTier}
          totalTop100Played={totalTop100Played}
          clubName={club.tierName || 'Top 100 Club'}
        />
      ) : (
        <CenteredHeroAvatar
          avatarUrl={avatarUrl}
          displayName={displayName}
        />
      )}

      {/* Primary summary line - DOMINANT number (A2) */}
      <p className="text-center text-foreground px-4">
        <span className="text-base font-medium">
          {isOwnProfile ? "You've played " : `${displayName} has played `}
        </span>
        <span className="text-3xl font-bold text-foreground tabular-nums">
          {totalTop100Played}
        </span>
        <span className="text-base font-medium">
          {' '}Top 100 course{totalTop100Played === 1 ? '' : 's'}
        </span>
      </p>

      {/* Secondary summary line - human-friendly date with calendar icon (A3) */}
      {formattedDate && (
        <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Last logged: {formattedDate}
        </p>
      )}

      {/* Nudge banner */}
      {nudge && isOwnProfile && (
        <div className="w-full max-w-sm">
          <NudgeBanner nudge={nudge} variant="hero" />
        </div>
      )}
    </motion.section>
  );
}