/**
 * TrophyRoomHero - Cinematic hero section for Quest page
 * Phase 2: Spotlight layout with ProgressRing, large badge, and dynamic messaging
 * Trophy Room aesthetic with animated background, tier chip, Continue Journey CTA
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, ChevronDown, Award } from 'lucide-react';
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
import grandSlam400Image from '@/assets/achievements/grand-slam-400.png';

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
  400: grandSlam400Image,
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
      className="relative text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Phase 2: Tier chip with achievement status */}
      <motion.div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
        style={{
          background: `${tierColor}12`,
          border: `1px solid ${tierColor}30`,
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Award className="w-4 h-4" style={{ color: tierColor }} />
        <span 
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: tierColor }}
        >
          {heroTitle}
        </span>
      </motion.div>

      {/* Phase 2: Spotlight layout - Badge on left, ProgressRing on right */}
      <motion.div 
        className="flex items-center justify-center gap-8 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Large badge spotlight - 120px with subtle parallax effect */}
        {currentBadgeImage ? (
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          >
            {/* Glow behind badge */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(circle, ${tierColor}30 0%, transparent 70%)`,
                filter: 'blur(20px)',
                transform: 'scale(1.3)',
              }}
              animate={hasPremiumAccent ? {
                opacity: [0.6, 1, 0.6],
                scale: [1.3, 1.5, 1.3],
              } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            {/* Badge image */}
            <img
              src={currentBadgeImage}
              alt={tierName}
              className="relative w-[100px] h-[120px] object-contain drop-shadow-lg"
            />
            
            {/* Sparkle for premium users */}
            {hasPremiumAccent && (
              <Sparkles 
                className="absolute -top-2 -right-2 w-6 h-6" 
                style={{ color: '#D2B461' }} 
              />
            )}
          </motion.div>
        ) : (
          /* Fallback trophy icon for newcomers */
          <motion.div 
            className="relative flex justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          >
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${tierColor}18 0%, ${tierColor}08 100%)`,
                border: `1.5px solid ${tierColor}35`,
                boxShadow: `0 6px 24px ${tierColor}20`,
              }}
            >
              <Trophy className="w-10 h-10" style={{ color: tierColor }} />
            </div>
          </motion.div>
        )}

        {/* Progress Ring - Phase 2: Circular progress showing next milestone */}
        {nextMilestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ProgressRing
              current={totalPlayed}
              target={nextThreshold}
              label={`to ${nextMilestone.shortLabel}`}
              color={tierColor}
              size={100}
              strokeWidth={8}
              animated={true}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Main count display */}
      <motion.div 
        className="flex items-baseline justify-center gap-2 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <span
          className="text-7xl font-bold tracking-tight"
          style={{ 
            color: 'var(--quest-text-primary)',
            textShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          {totalPlayed}
        </span>
        <span
          className="text-2xl font-medium"
          style={{ color: 'var(--quest-text-tertiary)' }}
        >
          / {target}
        </span>
      </motion.div>

      {/* Label */}
      <motion.p
        className="text-sm font-medium mb-5"
        style={{ color: 'var(--quest-text-secondary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Top 100 Courses Played
      </motion.p>

      {/* Progress bar → next milestone text: mt-3 */}
      <motion.div 
        className="max-w-[220px] mx-auto"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ 
            background: 'var(--quest-track)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isComplete 
                ? 'linear-gradient(90deg, #D2B461 0%, #E8C96A 100%)'
                : `linear-gradient(90deg, ${tierColor} 0%, ${tierColor}CC 100%)`,
              boxShadow: `0 0 10px ${isComplete ? 'rgba(210, 180, 97, 0.5)' : `${tierColor}40`}`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Next milestone teaser - mt-3 from progress bar */}
      {nextMilestone && (
        <motion.p
          className="text-xs mt-3"
          style={{ color: 'var(--quest-text-tertiary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Next milestone: <span className="font-semibold" style={{ color: 'var(--quest-text-secondary)' }}>{nextMilestone.threshold} Club</span> ({remaining} to go)
        </motion.p>
      )}


      {/* Continue Journey CTA - mt-4 from next milestone text */}
      <motion.button
        onClick={onContinueJourney}
        className="relative inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all overflow-hidden mt-4"
        style={{
          background: 'var(--surface-slate)',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(58, 63, 70, 0.25)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        <span className="relative z-10">Continue Journey</span>
        <ChevronDown className="w-4 h-4 relative z-10" />
      </motion.button>
    </motion.section>
  );
};

export default TrophyRoomHero;
