/**
 * TrophyRoomHero - Cinematic hero section for Quest page
 * Trophy Room aesthetic with animated background, tier chip, Continue Journey CTA
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, ChevronDown, Award } from 'lucide-react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';

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


  return (
    <motion.section 
      className="relative text-center py-10 px-6 rounded-3xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,250,251,0.95) 100%)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,1)',
        border: '1px solid rgba(31, 36, 40, 0.06)',
      }}
    >
      {/* Animated background shimmer */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(210, 180, 97, 0.08) 0%, transparent 40%), radial-gradient(ellipse at 70% 80%, rgba(110, 146, 119, 0.06) 0%, transparent 40%)',
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Subtle gradient sweep animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Current tier chip */}
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
          {tierName} {tierThreshold ? `• ${tierThreshold} Club` : ''}
        </span>
      </motion.div>

      {/* Trophy icon with premium glow */}
      <motion.div 
        className="relative flex justify-center mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 m-auto w-24 h-24 rounded-2xl"
          style={{
            background: `radial-gradient(circle, ${tierColor}20 0%, transparent 70%)`,
            filter: 'blur(16px)',
          }}
          animate={hasPremiumAccent ? {
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.15, 1],
          } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <div
          className="relative w-18 h-18 rounded-2xl flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            background: `linear-gradient(145deg, ${tierColor}18 0%, ${tierColor}08 100%)`,
            border: `1.5px solid ${tierColor}35`,
            boxShadow: `
              0 6px 24px ${tierColor}20,
              inset 0 1px 2px rgba(255, 255, 255, 0.8),
              inset 0 -1px 2px ${tierColor}10
            `,
          }}
        >
          <Trophy className="w-9 h-9" style={{ color: tierColor }} />
          
          {/* Sparkle for premium users */}
          {hasPremiumAccent && (
            <Sparkles 
              className="absolute -top-1 -right-1 w-5 h-5" 
              style={{ color: '#D2B461' }} 
            />
          )}
        </div>
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

      {/* Progress bar */}
      <motion.div 
        className="max-w-[220px] mx-auto mb-6"
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

      {/* Next milestone teaser */}
      {nextMilestone && (
        <motion.p
          className="text-xs mb-2"
          style={{ color: 'var(--quest-text-tertiary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Next milestone: <span className="font-semibold" style={{ color: 'var(--quest-text-secondary)' }}>{nextMilestone.threshold} Club</span> ({remaining} to go)
        </motion.p>
      )}

      
      {/* Spacer if no next milestone */}
      {!nextMilestone && <div className="mb-4" />}

      {/* Continue Journey CTA - Global Slate with shimmer */}
      <motion.button
        onClick={onContinueJourney}
        className="relative inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all overflow-hidden"
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
