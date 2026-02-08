/**
 * SimplifiedMilestoneLadder - Shows only 2 badges:
 * 1. Most recent earned badge (full color)
 * 2. Next badge to unlock (greyed/locked)
 * 
 * Designed to sit directly on page background (#F8FAFC)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MILESTONE_TIER_META } from '@/config/achievements';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';

// Import badge images
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';
import grandslamBadgeImage from '@/assets/badges/grandslam-badge.png';

// Badge image mapping
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

// Club names for each threshold
const CLUB_NAMES: Record<number, string> = {
  5: 'Rookie Club',
  10: 'Fairway Club',
  20: 'Founders Club',
  50: 'Heritage Club',
  100: 'Century Club',
  200: 'Elite Club',
  300: 'Legendary Club',
  400: 'Grand Slam Club',
};

interface SimplifiedMilestoneLadderProps {
  totalPlayed: number;
  onMilestoneClick?: (threshold: number) => void;
}

interface MilestoneData {
  threshold: number;
  name: string;
  isUnlocked: boolean;
}

export const SimplifiedMilestoneLadder: React.FC<SimplifiedMilestoneLadderProps> = ({
  totalPlayed,
  onMilestoneClick,
}) => {
  // Build the 2 badges to show: most recent earned + next to unlock
  const { earnedBadge, nextBadge } = useMemo(() => {
    const thresholds = MILESTONE_TIER_META.map(m => m.threshold);
    
    // Find earned badges (all where totalPlayed >= threshold)
    const earned = thresholds.filter(t => totalPlayed >= t);
    // Find locked badges
    const locked = thresholds.filter(t => totalPlayed < t);
    
    // Most recent earned (highest threshold achieved)
    const mostRecentEarned = earned.length > 0 ? earned[earned.length - 1] : null;
    // Next to unlock (lowest locked threshold)
    const nextToUnlock = locked.length > 0 ? locked[0] : null;
    
    const earnedData: MilestoneData | null = mostRecentEarned ? {
      threshold: mostRecentEarned,
      name: CLUB_NAMES[mostRecentEarned],
      isUnlocked: true,
    } : null;
    
    const nextData: MilestoneData | null = nextToUnlock ? {
      threshold: nextToUnlock,
      name: CLUB_NAMES[nextToUnlock],
      isUnlocked: false,
    } : null;
    
    return { earnedBadge: earnedData, nextBadge: nextData };
  }, [totalPlayed]);

  // If user has no progress yet, just show the first milestone as next
  if (!earnedBadge && nextBadge) {
    return (
      <div>
        <MilestoneRow
          milestone={nextBadge}
          totalPlayed={totalPlayed}
          isCurrent
          isLast
          onClick={() => onMilestoneClick?.(nextBadge.threshold)}
        />
      </div>
    );
  }

  // If user has completed everything
  if (earnedBadge && !nextBadge) {
    return (
      <div>
        <MilestoneRow
          milestone={earnedBadge}
          totalPlayed={totalPlayed}
          isCurrent={false}
          isLast
          onClick={() => onMilestoneClick?.(earnedBadge.threshold)}
        />
      </div>
    );
  }

  // Normal case: show earned + next
  return (
    <div>
      {earnedBadge && (
        <MilestoneRow
          milestone={earnedBadge}
          totalPlayed={totalPlayed}
          isCurrent={false}
          isLast={!nextBadge}
          onClick={() => onMilestoneClick?.(earnedBadge.threshold)}
        />
      )}
      {nextBadge && (
        <MilestoneRow
          milestone={nextBadge}
          totalPlayed={totalPlayed}
          isCurrent
          isLast
          onClick={() => onMilestoneClick?.(nextBadge.threshold)}
        />
      )}
    </div>
  );
};

// Individual milestone row
interface MilestoneRowProps {
  milestone: MilestoneData;
  totalPlayed: number;
  isCurrent: boolean;
  isLast: boolean;
  onClick?: () => void;
}

const MilestoneRow: React.FC<MilestoneRowProps> = ({
  milestone,
  totalPlayed,
  isCurrent,
  isLast,
  onClick,
}) => {
  const tierColor = getRingColorForThreshold(milestone.threshold);
  const badgeImage = BADGE_IMAGES[milestone.threshold];
  const remaining = milestone.threshold - totalPlayed;
  const progressPercent = totalPlayed >= milestone.threshold 
    ? 100 
    : (totalPlayed / milestone.threshold) * 100;

  return (
    <motion.div 
      className="relative flex items-start gap-5 py-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Connecting line between badges */}
      {!isLast && (
        <div
          className="absolute w-0.5 z-0"
          style={{
            left: '40px', // Center of 80px badge
            top: '96px', // Badge bottom
            height: '12px',
            backgroundColor: 'hsl(var(--border))',
          }}
        />
      )}

      {/* Badge image (80px) */}
      <button
        onClick={onClick}
        className="relative z-10 flex-shrink-0"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src={badgeImage}
            alt={milestone.name}
            className={cn(
              "w-20 h-[100px] object-contain",
              !milestone.isUnlocked && "opacity-40 grayscale-[60%]"
            )}
          />
        </motion.div>
      </button>

      {/* Text content */}
      <button
        className="flex-1 min-w-0 text-left pt-1"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Club name */}
            <h3 className={cn(
              "font-bold text-base",
              milestone.isUnlocked ? "text-foreground" : "text-muted-foreground"
            )}>
              {milestone.name}
            </h3>
            
            {/* Description */}
            <p className={cn(
              "text-sm mt-0.5",
              milestone.isUnlocked ? "text-muted-foreground" : "text-muted-foreground/40"
            )}>
              {`${milestone.threshold} Top 100 courses played`}
            </p>
            
            {/* Progress bar for current target */}
            {isCurrent && !milestone.isUnlocked && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: tierColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {totalPlayed}/{milestone.threshold}
                </span>
              </div>
            )}
          </div>
          
          {/* Status badge */}
          <div className="flex-shrink-0 pt-0.5">
            {milestone.isUnlocked ? (
              <span 
                className="text-sm font-semibold"
                style={{ color: tierColor }}
              >
                Earned
              </span>
            ) : isCurrent ? (
              <span 
                className="text-sm font-semibold"
                style={{ color: tierColor }}
              >
                {remaining} to go
              </span>
            ) : null}
          </div>
        </div>
      </button>
    </motion.div>
  );
};

export default SimplifiedMilestoneLadder;
