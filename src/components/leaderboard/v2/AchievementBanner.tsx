/**
 * AchievementBanner - Inline achievement callouts
 * Subtle, emotionally rewarding feedback for leaderboard progress
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type AchievementType = 
  | 'overtook_rival'
  | 'new_pb_rank'
  | 'entered_top_100'
  | 'entered_top_50'
  | 'entered_top_25'
  | 'entered_top_10'
  | 'fast_climber';

interface Achievement {
  type: AchievementType;
  message: string;
  emoji: string;
}

const ACHIEVEMENT_CONFIG: Record<AchievementType, { message: string; emoji: string }> = {
  overtook_rival: { message: 'You overtook a rival', emoji: '⬆️' },
  new_pb_rank: { message: 'New personal best rank', emoji: '🏆' },
  entered_top_100: { message: 'Entered the Global Top 100', emoji: '🎯' },
  entered_top_50: { message: 'Entered the Global Top 50', emoji: '🎯' },
  entered_top_25: { message: 'Entered the Global Top 25', emoji: '🎯' },
  entered_top_10: { message: 'Entered the Global Top 10', emoji: '🎯' },
  fast_climber: { message: 'Fast climber this month', emoji: '⚡' },
};

interface AchievementBannerProps {
  achievements: AchievementType[];
  onDismiss?: () => void;
  className?: string;
}

export function AchievementBanner({
  achievements,
  onDismiss,
  className,
}: AchievementBannerProps) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (achievements.length === 0) return;
    
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 8000);

    return () => clearTimeout(timer);
  }, [achievements, onDismiss]);

  if (achievements.length === 0 || !visible) return null;

  // Show only the first (most significant) achievement
  const achievement = achievements[0];
  const config = ACHIEVEMENT_CONFIG[achievement];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'mx-4 mt-3 px-3 py-2 rounded-lg',
            'bg-emerald-500/10 border border-emerald-500/20',
            className
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-base">{config.emoji}</span>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {config.message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to detect achievements based on rank changes
export function useAchievementDetection({
  currentRank,
  previousRank,
  bestRankAllTime,
  timeRange,
}: {
  currentRank: number | null;
  previousRank: number | null;
  bestRankAllTime: number | null;
  timeRange: 'all_time' | 'this_year' | 'this_month';
}): AchievementType[] {
  const [achievements, setAchievements] = useState<AchievementType[]>([]);
  const [sessionAchievements, setSessionAchievements] = useState<Set<AchievementType>>(new Set());

  useEffect(() => {
    if (!currentRank || !previousRank) return;
    
    const newAchievements: AchievementType[] = [];

    // Check for rank improvement (overtook rival)
    if (currentRank < previousRank && !sessionAchievements.has('overtook_rival')) {
      newAchievements.push('overtook_rival');
    }

    // Check for new personal best (only for all_time)
    if (
      timeRange === 'all_time' &&
      bestRankAllTime &&
      currentRank < bestRankAllTime &&
      !sessionAchievements.has('new_pb_rank')
    ) {
      newAchievements.push('new_pb_rank');
    }

    // Check for milestone bands (only for all_time)
    if (timeRange === 'all_time') {
      const milestones: { threshold: number; type: AchievementType }[] = [
        { threshold: 10, type: 'entered_top_10' },
        { threshold: 25, type: 'entered_top_25' },
        { threshold: 50, type: 'entered_top_50' },
        { threshold: 100, type: 'entered_top_100' },
      ];

      for (const { threshold, type } of milestones) {
        if (
          currentRank <= threshold &&
          previousRank > threshold &&
          !sessionAchievements.has(type)
        ) {
          newAchievements.push(type);
          break; // Only show highest milestone reached
        }
      }
    }

    if (newAchievements.length > 0) {
      setAchievements(newAchievements);
      setSessionAchievements(prev => {
        const updated = new Set(prev);
        newAchievements.forEach(a => updated.add(a));
        return updated;
      });
    }
  }, [currentRank, previousRank, bestRankAllTime, timeRange, sessionAchievements]);

  return achievements;
}
