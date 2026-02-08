/**
 * TrophyRoomHero - Cinematic hero section for Quest page
 * Phase 2: Spotlight layout with ProgressRing, large badge, and dynamic messaging
 * Trophy Room aesthetic with animated background, tier chip, Continue Journey CTA
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, Award } from 'lucide-react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';
import { ProgressRing } from '@/components/quest/ProgressRing';

// Import badge images for spotlight
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';
import grandslamBadgeImage from '@/assets/badges/grandslam-badge.png';

interface RegionProgress {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

interface TrophyRoomHeroProps {
  totalPlayed: number;
  target?: number;
  hasPremiumAccent?: boolean;
  onContinueJourney?: () => void;
  regionProgress?: RegionProgress[];
}

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

export const TrophyRoomHero: React.FC<TrophyRoomHeroProps> = ({
  totalPlayed,
  target = 100,
  hasPremiumAccent = false,
  onContinueJourney,
  regionProgress = [],
}) => {
  const progressPercent = Math.min((totalPlayed / target) * 100, 100);
  const isComplete = totalPlayed >= target;

  // Determine current tier
  const currentTier = CLUB_STEPS.filter(s => totalPlayed >= s.threshold).pop();
  const nextMilestone = CLUB_STEPS.find(s => totalPlayed < s.threshold);
  const tierName = currentTier?.tierName || 'Newcomer';
  const tierThreshold = currentTier?.threshold;
  const tierColor = tierThreshold ? getRingColorForThreshold(tierThreshold) : '#6e9277';
  
  // Next milestone info
  const nextThreshold = nextMilestone?.threshold || 0;
  const remaining = nextThreshold - totalPlayed;
  
  // Get current badge image for spotlight display
  const currentBadgeImage = tierThreshold ? BADGE_IMAGES[tierThreshold] : undefined;
  
  // Dynamic hero title based on state
  const heroTitle = useMemo(() => {
    if (isComplete && !nextMilestone) return 'Grand Slam Achieved';
    if (currentTier) return `${tierName} Achieved`;
    return 'Begin Your Journey';
  }, [isComplete, nextMilestone, currentTier, tierName]);
  return (
    <motion.section 
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Phase 2: Tier chip with achievement status - centered */}
      <motion.div
        className="flex justify-center mb-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: `${tierColor}12`,
            border: `1px solid ${tierColor}30`,
          }}
        >
          <Award className="w-3.5 h-3.5" style={{ color: tierColor }} />
          <span 
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: tierColor }}
          >
            {heroTitle}
          </span>
        </div>
      </motion.div>

      {/* HORIZONTAL LAYOUT: Badge | Ring | Stats */}
      <motion.div 
        className="flex items-center justify-between bg-card rounded-2xl p-4 border border-border mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Left: Badge Image */}
        <div className="flex-shrink-0 flex flex-col items-center">
          {currentBadgeImage ? (
            <div className="relative">
              {/* Subtle glow */}
              <div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `radial-gradient(circle, ${tierColor}20 0%, transparent 70%)`,
                  filter: 'blur(12px)',
                  transform: 'scale(1.2)',
                }}
              />
              <img
                src={currentBadgeImage}
                alt={tierName}
                decoding="async"
                className="relative w-16 h-20 object-contain"
              />
            </div>
          ) : (
            <div
              className="relative w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${tierColor}18 0%, ${tierColor}08 100%)`,
                border: `1.5px solid ${tierColor}35`,
              }}
            >
              <Trophy className="w-7 h-7" style={{ color: tierColor }} />
            </div>
          )}
          <span 
            className="text-[10px] font-semibold uppercase mt-1 tracking-wide"
            style={{ color: tierColor }}
          >
            {tierName}
          </span>
        </div>

        {/* Center: Progress Ring to next milestone */}
        {nextMilestone ? (
          <div className="flex flex-col items-center">
            <ProgressRing
              current={totalPlayed}
              target={nextThreshold}
              label=""
              color={tierColor}
              size={72}
              strokeWidth={6}
              animated={true}
            />
            <span className="text-xs text-muted-foreground mt-1">
              to {nextMilestone.shortLabel}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div 
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
              style={{ background: `${tierColor}15` }}
            >
              <Sparkles className="w-8 h-8" style={{ color: tierColor }} />
            </div>
            <span className="text-xs text-muted-foreground mt-1">Complete!</span>
          </div>
        )}

        {/* Right: Count */}
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-0.5">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {totalPlayed}
            </span>
            <span className="text-lg font-medium text-muted-foreground/60">
              /{target}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Courses Played
          </p>
        </div>
      </motion.div>

      {/* Progress bar + next milestone - compact single row */}
      <motion.div 
        className="mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="h-2 rounded-full overflow-hidden bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isComplete 
                ? 'linear-gradient(90deg, #D2B461 0%, #E8C96A 100%)'
                : `linear-gradient(90deg, ${tierColor} 0%, ${tierColor}CC 100%)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        {nextMilestone && (
          <p className="text-xs text-muted-foreground mt-1.5 text-center">
            <span className="font-medium text-foreground">{nextMilestone.threshold} Club</span> ({remaining} to go)
          </p>
        )}
      </motion.div>
    </motion.section>
  );
};

export default TrophyRoomHero;