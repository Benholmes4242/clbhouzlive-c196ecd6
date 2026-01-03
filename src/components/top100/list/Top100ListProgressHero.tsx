import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTop100Club } from '@/lib/top100Club';
import { getRegionTheme } from '@/lib/regionTheme';

interface Top100ListProgressHeroProps {
  playedCount: number;
  totalCount: number;
  listName: string;
  listSlug?: string;
}

/**
 * Premium hero progress module for Top 100 list pages.
 * Uses regional color theming for progress bar.
 */
export const Top100ListProgressHero: React.FC<Top100ListProgressHeroProps> = ({
  playedCount,
  totalCount,
  listName,
  listSlug = 'global',
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const percent = totalCount > 0 ? (playedCount / totalCount) * 100 : 0;
  
  // Get regional theme for colored progress bar
  const theme = getRegionTheme(listSlug);
  
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
    <div className="px-4 pt-6 pb-4">
      {/* Single unified journey state container */}
      <div className="p-4 flex gap-4 items-stretch">
        {/* Left: Large numeric tile */}
        <div className="w-[100px] shrink-0 flex flex-col items-center justify-center bg-slate-900 rounded-sq-md p-3">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-4xl font-bold text-white tracking-tight"
          >
            {playedCount}
          </motion.span>
          <span className="text-sm text-white/60 font-medium">/ {totalCount}</span>
        </div>

        {/* Right column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Row 1: Title/Sub + Status pill */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground truncate">
                {currentClub?.shortLabel || 'Rookie'}
              </h3>
              {toNext > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {toNext} to {nextClubName}
                </p>
              )}
            </div>
            
            {/* Status pill - neutral, not colored */}
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-sq-pill">
              <Trophy className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">
                {Math.round(percent)}%
              </span>
            </div>
          </div>

          {/* Progress bar - uses regional color */}
          <div className="mt-3">
            <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                className={`h-2 rounded-full ${theme.barClass}`}
                initial={{ width: 0 }}
                animate={{ width: `${animatedProgress}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {listName} progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
