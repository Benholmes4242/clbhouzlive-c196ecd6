import React, { useEffect, useState } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTop100Club } from '@/lib/top100Club';

interface Top100ListProgressHeroProps {
  playedCount: number;
  totalCount: number;
  listName: string;
  listSlug?: string;
}

/**
 * Premium hero progress module for Top 100 list pages.
 * Shows large numeric progress, animated bar, and milestone info.
 */
export const Top100ListProgressHero: React.FC<Top100ListProgressHeroProps> = ({
  playedCount,
  totalCount,
  listName,
  listSlug,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const percent = totalCount > 0 ? (playedCount / totalCount) * 100 : 0;
  
  // Get current and next milestone
  const currentClub = getTop100Club(playedCount);
  const milestones = [5, 10, 20, 50, 100];
  const nextMilestone = milestones.find(m => m > playedCount) || 100;
  const nextClubName = `${nextMilestone} Club`;
  const toNext = Math.max(0, nextMilestone - playedCount);
  
  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(percent);
    }, 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="px-4 py-5 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Large numeric progress */}
        <div className="flex items-baseline gap-1">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-5xl font-bold text-white tracking-tight"
          >
            {playedCount}
          </motion.span>
          <span className="text-2xl text-white/50 font-medium">/ {totalCount}</span>
        </div>

        {/* Right: Milestone info */}
        <div className="text-right">
          {/* Current club */}
          <div className="flex items-center justify-end gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">
              {currentClub?.shortLabel || 'Rookie'}
            </span>
          </div>
          
          {/* Next milestone */}
          {toNext > 0 && (
            <div className="flex items-center justify-end gap-1.5">
              <Lock className="w-3 h-3 text-white/40" />
              <span className="text-xs text-white/60">
                {toNext} to <span className="font-medium text-white/80">{nextClubName}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="mt-4 h-2.5 rounded-full bg-white/15 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${animatedProgress}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>

      {/* Progress label */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-white/50">
          {listName} progress
        </span>
        <span className="text-xs font-medium text-white/70">
          {Math.round(percent)}% complete
        </span>
      </div>
    </div>
  );
};
