/**
 * CompactProgressHero - Unified horizontal strip for Quest page
 * Merges badge + count + ring into one tight module
 * 40% height reduction from previous TrophyRoomHero
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Award } from 'lucide-react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';
import { ProgressRing } from '@/components/quest/ProgressRing';

// Import badge images
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';
import grandSlam400Image from '@/assets/achievements/grand-slam-400.png';

interface CompactProgressHeroProps {
  totalPlayed: number;
  target?: number;
  onContinueJourney?: () => void;
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
  400: grandSlam400Image,
};

export const CompactProgressHero: React.FC<CompactProgressHeroProps> = ({
  totalPlayed,
  target = 100,
  onContinueJourney,
}) => {
  // Determine current tier
  const currentTier = CLUB_STEPS.filter(s => totalPlayed >= s.threshold).pop();
  const nextMilestone = CLUB_STEPS.find(s => totalPlayed < s.threshold);
  const tierName = currentTier?.tierName || 'Newcomer';
  const tierThreshold = currentTier?.threshold;
  const tierColor = tierThreshold ? getRingColorForThreshold(tierThreshold) : '#6e9277';
  
  // Next milestone info
  const nextThreshold = nextMilestone?.threshold || target;
  const remaining = nextThreshold - totalPlayed;
  const progressPercent = Math.min((totalPlayed / target) * 100, 100);
  
  // Get current badge image
  const currentBadgeImage = tierThreshold ? BADGE_IMAGES[tierThreshold] : undefined;

  return (
    <motion.section 
      className="relative"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Tier chip - compact */}
      <motion.div
        className="flex justify-center mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: `${tierColor}10`,
            border: `1px solid ${tierColor}25`,
          }}
        >
          <Award className="w-3 h-3" style={{ color: tierColor }} />
          <span 
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: tierColor }}
          >
            {currentTier ? `${tierName} Achieved` : 'Begin Your Journey'}
          </span>
        </div>
      </motion.div>

      {/* Unified horizontal strip: Badge | Count | Ring */}
      <motion.div 
        className="flex items-center justify-center gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Badge - 15% smaller */}
        {currentBadgeImage && (
          <motion.div
            className="relative flex-shrink-0"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}
          >
            <img
              src={currentBadgeImage}
              alt={tierName}
              className="w-[68px] h-[82px] object-contain drop-shadow-md"
            />
          </motion.div>
        )}

        {/* Center: Main count display */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1.5">
            <span
              className="text-5xl font-bold tracking-tight"
              style={{ color: 'var(--quest-text-primary)' }}
            >
              {totalPlayed}
            </span>
            <span
              className="text-xl font-medium"
              style={{ color: 'var(--quest-text-tertiary)' }}
            >
              / {target}
            </span>
          </div>
          <p
            className="text-xs font-medium mt-0.5"
            style={{ color: 'var(--quest-text-secondary)', opacity: 0.7 }}
          >
            Top 100 Courses Played
          </p>
        </div>

        {/* Progress Ring - smaller */}
        {nextMilestone && (
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ProgressRing
              current={totalPlayed}
              target={nextThreshold}
              label={`${nextMilestone.shortLabel}`}
              color={tierColor}
              size={72}
              strokeWidth={6}
              animated={true}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Progress bar - directly beneath strip */}
      <motion.div 
        className="max-w-[260px] mx-auto mt-3"
        initial={{ opacity: 0, scaleX: 0.9 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.35 }}
      >
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ 
            background: 'var(--quest-track)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${tierColor} 0%, ${tierColor}CC 100%)`,
              boxShadow: `0 0 8px ${tierColor}30`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Next milestone text - reduced opacity */}
      {nextMilestone && (
        <motion.p
          className="text-[11px] mt-2 text-center"
          style={{ color: 'var(--quest-text-tertiary)', opacity: 0.65 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          transition={{ delay: 0.45 }}
        >
          {remaining} to go → <span className="font-medium">{nextMilestone.tierName}</span>
        </motion.p>
      )}

      {/* Continue Journey CTA - compact */}
      <motion.button
        onClick={onContinueJourney}
        className="flex items-center justify-center gap-1.5 mx-auto mt-3 px-4 py-2 rounded-full font-medium text-xs transition-all"
        style={{
          background: 'var(--surface-slate)',
          color: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(58, 63, 70, 0.2)',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>Continue Journey</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </motion.button>
    </motion.section>
  );
};

export default CompactProgressHero;
