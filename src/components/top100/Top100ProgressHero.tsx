import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import type { Top100TierId } from '@/lib/top100Club';
import { getTop100Club } from '@/lib/top100Club';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';

// Import badge images for overlay
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';
import grandslamBadgeImage from '@/assets/badges/grandslam-badge.png';

const BADGE_IMAGES: Record<number, string> = {
  5: rookieBadgeImage,
  10: fairwayBadgeImage,
  20: foundersBadgeImage,
  50: heritageBadgeImage,
  100: centuryBadgeImage,
  200: eliteBadgeImage,
  300: legendaryBadgeImage,
  400: grandslamBadgeImage,
};

const SEASON_COLOR = '#F7931E';

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
  const badgeImage = club.threshold ? BADGE_IMAGES[club.threshold] : null;

  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // Human-friendly date format
  const formattedDate = lastRoundAt
    ? format(new Date(lastRoundAt), 'd MMM yyyy')
    : null;

  return (
    <motion.section
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Avatar centered with badge overlay */}
      <div className="relative mb-2">
        {/* Subtle glow behind avatar */}
        <div
          className="absolute inset-2 rounded-sq-md blur-xl opacity-15"
          style={{ backgroundColor: 'hsl(var(--muted-foreground))' }}
        />
        <div className="relative z-10" style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.08))' }}>
          <SquircleAvatar
            size={120}
            src={avatarUrl}
            alt={displayName ?? 'Player avatar'}
            fallback={initials}
            thinRing
            ringColor={SEASON_COLOR}
          />
        </div>

        {/* Badge overlay - bottom right of avatar */}
        {hasAchievement && badgeImage && (
          <motion.div
            className="absolute -bottom-2 -right-3 z-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            <img
              src={badgeImage}
              alt={club.tierName || 'Achievement badge'}
              className="w-16 h-[78px] object-contain drop-shadow-md"
            />
          </motion.div>
        )}
      </div>

      {/* Primary stat - jumbo number */}
      <p className="text-center text-foreground px-4">
        <span className="text-base font-medium">
          {isOwnProfile ? "You've played " : `${displayName} has played `}
        </span>
        <span
          className="text-4xl font-extrabold tabular-nums"
          style={{ color: SEASON_COLOR }}
        >
          {totalTop100Played}
        </span>
        <span className="text-base font-medium text-muted-foreground">
          {' '}of 100
        </span>
      </p>

      {/* Last logged - quiet metadata */}
      {formattedDate && (
        <p className="text-[13px] text-muted-foreground inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Last logged: {formattedDate}
        </p>
      )}
    </motion.section>
  );
}
