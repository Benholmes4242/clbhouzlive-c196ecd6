import React, { useMemo, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTop100Club } from '@/lib/top100Club';
import { Top100RankBadge } from './Top100RankBadge';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';

interface Top100HeroShellProps {
  list: Top100ListSummary;
  playedCount: number;
  totalCount: number;
  listDisplayName: string;
  onBack?: () => void;
  showProgress?: boolean;
}

/**
 * Top100HeroShell - Unified hero image + docked progress panel
 * The hero and progress are siblings inside the same rounded container,
 * creating a "connected" visual effect with no gap or floating card.
 */
export const Top100HeroShell: React.FC<Top100HeroShellProps> = ({
  list,
  playedCount,
  totalCount,
  listDisplayName,
  onBack,
  showProgress = true,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const hero = list.hero_course;
  const topRank = hero?.rank_in_list ?? null;
  const listSlug = list.slug as 'global' | 'gb-i' | 'usa' | 'europe';
  
  // Progress calculation
  const percent = totalCount > 0 ? (playedCount / totalCount) * 100 : 0;
  
  // Get current and next milestone
  const currentClub = getTop100Club(playedCount);
  const milestones = [5, 10, 20, 50, 100];
  const nextMilestone = milestones.find(m => m > playedCount) || 100;
  const nextClubName = `${nextMilestone} Club`;
  const toNext = Math.max(0, nextMilestone - playedCount);
  
  // Map short labels to full display names
  const getDisplayLabel = (shortLabel: string, slug: string) => {
    if (slug === 'global' || shortLabel === 'Global') return 'Worldwide Top 100';
    if (shortLabel === 'GB&I') return 'Great Britain & Ireland Top 100';
    if (shortLabel === 'Europe') return 'Continental Europe Top 100';
    if (shortLabel === 'USA') return 'USA Top 100';
    return `${shortLabel} Top 100`;
  };

  const displayLabel = getDisplayLabel(list.short_label || list.name, list.slug);
  
  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(percent);
    }, 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="px-4 mt-4">
      {/* ONE shared container with rounded corners */}
      <div className="overflow-hidden rounded-2xl">
        
        {/* HERO IMAGE SECTION */}
        <div className="relative h-[240px]">
          {/* Background image */}
          {hero?.cover_image_url ? (
            <img
              src={hero.cover_image_url}
              alt={hero.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-3 left-3 z-20 h-9 w-9 bg-black/20 backdrop-blur-sm rounded-sq-sm flex items-center justify-center hover:bg-black/40 transition-colors focus:outline-none"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
          )}
          
          {/* Top-right rank badge */}
          {topRank && (
            <div className="absolute right-4 top-4 z-10">
              <Top100RankBadge listSlug={listSlug} rank={topRank} />
            </div>
          )}
          
          {/* Title at bottom of hero */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <h1 className="text-white text-3xl font-semibold drop-shadow-lg">
              {displayLabel}
            </h1>
          </div>
        </div>

        {/* DOCKED PROGRESS PANEL - connected to hero, no gap */}
        {showProgress && (
          <div className="bg-slate-800/90 px-4 py-4">
            {/* Top row: big count left, club + range right */}
            <div className="flex items-start justify-between gap-4">
              <div className="text-white">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  className="text-4xl font-semibold leading-none"
                >
                  {playedCount}
                  <span className="text-white/60 text-xl ml-0.5">/{totalCount}</span>
                </motion.div>
              </div>

              <div className="text-right text-white">
                <div className="text-sm font-semibold">
                  {currentClub?.shortLabel || 'Rookie'}
                </div>
                {toNext > 0 && (
                  <div className="text-xs text-white/70">
                    {toNext} to {nextClubName}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar - square ended */}
            <div className="mt-3">
              <div className="h-2 w-full bg-white/15">
                <motion.div
                  className="h-2 bg-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${animatedProgress}%` }}
                  transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>

              {/* Labels below bar */}
              <div className="mt-2 flex items-center justify-between text-xs text-white/70">
                <span>{listDisplayName} progress</span>
                <span>{Math.round(percent)}% complete</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
