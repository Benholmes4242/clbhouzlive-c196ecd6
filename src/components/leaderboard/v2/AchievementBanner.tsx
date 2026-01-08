/**
 * AchievementBanner - Inline achievement callouts
 * Subtle, emotionally rewarding feedback for leaderboard progress
 * 
 * Priority order:
 * 1. New Personal Best Rank
 * 2. Tier Entry (Top 100/50/25/10)
 * 3. Fast Climber
 * 4. Top Percentile
 * 5. Overtook Rival
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Zap, Flame, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AchievementType = 
  | 'overtook_rival'
  | 'new_pb_rank'
  | 'entered_top_100'
  | 'entered_top_50'
  | 'entered_top_25'
  | 'entered_top_10'
  | 'top_percentile_10'
  | 'top_percentile_5'
  | 'fast_climber';

// Priority order (lower = higher priority)
const ACHIEVEMENT_PRIORITY: Record<AchievementType, number> = {
  new_pb_rank: 1,
  entered_top_10: 2,
  entered_top_25: 3,
  entered_top_50: 4,
  entered_top_100: 5,
  fast_climber: 6,
  top_percentile_5: 7,
  top_percentile_10: 8,
  overtook_rival: 9,
};

interface AchievementConfig {
  message: string;
  secondary?: string;
  icon: React.ElementType;
  iconColor: string;
  textColor: string;
  bgColor: string;
  borderColor?: string;
}

const ACHIEVEMENT_CONFIG: Record<AchievementType, AchievementConfig> = {
  overtook_rival: { 
    message: 'You overtook a rival',
    secondary: 'Keep the momentum going',
    icon: ArrowUp,
    iconColor: 'text-slate-500',
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-transparent',
  },
  new_pb_rank: { 
    message: 'New personal best rank',
    secondary: 'Your best position so far',
    icon: Trophy,
    iconColor: 'text-amber-600',
    textColor: 'text-slate-800 dark:text-slate-200',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-l-2 border-amber-500',
  },
  entered_top_100: { 
    message: 'Entered the Global Top 100',
    secondary: "You're closing in on the elite",
    icon: Target,
    iconColor: 'text-primary',
    textColor: 'text-slate-800 dark:text-slate-200',
    bgColor: 'bg-primary/8',
    borderColor: 'border-l-2 border-primary',
  },
  entered_top_50: { 
    message: 'Entered the Global Top 50',
    secondary: "You're closing in on the elite",
    icon: Target,
    iconColor: 'text-primary',
    textColor: 'text-slate-800 dark:text-slate-200',
    bgColor: 'bg-primary/8',
    borderColor: 'border-l-2 border-primary',
  },
  entered_top_25: { 
    message: 'Entered the Global Top 25',
    secondary: "You're closing in on the elite",
    icon: Target,
    iconColor: 'text-primary',
    textColor: 'text-slate-800 dark:text-slate-200',
    bgColor: 'bg-primary/8',
    borderColor: 'border-l-2 border-primary',
  },
  entered_top_10: { 
    message: 'Entered the Global Top 10',
    secondary: "You're closing in on the elite",
    icon: Target,
    iconColor: 'text-primary',
    textColor: 'text-slate-800 dark:text-slate-200',
    bgColor: 'bg-primary/8',
    borderColor: 'border-l-2 border-primary',
  },
  top_percentile_10: {
    message: 'Top 10% this month',
    icon: Flame,
    iconColor: 'text-primary',
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-primary/5',
  },
  top_percentile_5: {
    message: 'Top 5% this year',
    icon: Flame,
    iconColor: 'text-primary',
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-primary/5',
  },
  fast_climber: { 
    message: 'Fast climber this month',
    secondary: 'One of the biggest movers right now',
    icon: Zap,
    iconColor: 'text-slate-500',
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-transparent',
    borderColor: 'border-l-2 border-dashed border-primary/40',
  },
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

  // Sort by priority and show only the highest priority achievement
  const sortedAchievements = [...achievements].sort(
    (a, b) => ACHIEVEMENT_PRIORITY[a] - ACHIEVEMENT_PRIORITY[b]
  );

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (sortedAchievements.length === 0) return;
    
    const timer = setTimeout(handleDismiss, 8000);
    return () => clearTimeout(timer);
  }, [sortedAchievements]);

  // Dismiss on scroll
  useEffect(() => {
    if (sortedAchievements.length === 0 || !visible) return;

    const handleScroll = () => handleDismiss();
    
    window.addEventListener('scroll', handleScroll, { passive: true, once: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sortedAchievements, visible]);

  if (sortedAchievements.length === 0 || !visible) return null;

  // Show only the highest priority achievement
  const achievement = sortedAchievements[0];
  const config = ACHIEVEMENT_CONFIG[achievement];
  const Icon = config.icon;

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
            config.bgColor,
            config.borderColor,
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className={cn('w-4 h-4 flex-shrink-0', config.iconColor)} />
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-medium', config.textColor)}>
                {config.message}
              </p>
              {config.secondary && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {config.secondary}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Fast climber thresholds by time range
const FAST_CLIMBER_THRESHOLDS = {
  this_month: 10, // ≥10 ranks gained
  this_year: 15,  // ≥15 ranks gained
  all_time: null, // Disabled for all-time
};

// Hook to detect achievements based on rank changes
export function useAchievementDetection({
  currentRank,
  previousRank,
  bestRankAllTime,
  timeRange,
  coursesLoggedInPeriod = 0,
  leaderboardSize = 100,
}: {
  currentRank: number | null;
  previousRank: number | null;
  bestRankAllTime: number | null;
  timeRange: 'all_time' | 'this_year' | 'this_month';
  coursesLoggedInPeriod?: number;
  leaderboardSize?: number;
}): AchievementType[] {
  const [achievements, setAchievements] = useState<AchievementType[]>([]);
  const [sessionAchievements, setSessionAchievements] = useState<Set<AchievementType>>(new Set());

  useEffect(() => {
    if (!currentRank || !previousRank) return;
    
    const newAchievements: AchievementType[] = [];
    const rankGain = previousRank - currentRank;

    // Check for rank improvement (overtook rival)
    if (rankGain > 0 && !sessionAchievements.has('overtook_rival')) {
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

    // Check for milestone bands
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

    // Check for Fast Climber (not for all_time)
    if (timeRange !== 'all_time' && !sessionAchievements.has('fast_climber')) {
      const threshold = FAST_CLIMBER_THRESHOLDS[timeRange];
      const relativeImprovement = (rankGain / leaderboardSize) * 100;
      
      if (
        threshold &&
        (rankGain >= threshold || relativeImprovement >= 15) &&
        coursesLoggedInPeriod >= 2
      ) {
        newAchievements.push('fast_climber');
      }
    }

    // Check for top percentile
    if (timeRange !== 'all_time') {
      const percentile = (currentRank / leaderboardSize) * 100;
      if (percentile <= 5 && !sessionAchievements.has('top_percentile_5')) {
        newAchievements.push('top_percentile_5');
      } else if (percentile <= 10 && !sessionAchievements.has('top_percentile_10')) {
        newAchievements.push('top_percentile_10');
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
  }, [currentRank, previousRank, bestRankAllTime, timeRange, coursesLoggedInPeriod, leaderboardSize, sessionAchievements]);

  return achievements;
}
