import React, { useMemo, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
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
 * Top100HeroShell - Unified hero image + full-bleed attached progress slab
 * No floating card look - hero and progress are visually connected edge-to-edge.
 * Uses "Global – 25/50/75/100 Complete" milestone system, no club naming.
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
  
  // Map short labels to full display names for hero title
  const getDisplayLabel = (shortLabel: string, slug: string) => {
    if (slug === 'global' || shortLabel === 'Global') return 'Worldwide Top 100';
    if (shortLabel === 'GB&I') return 'Great Britain & Ireland Top 100';
    if (shortLabel === 'Europe') return 'Continental Europe Top 100';
    if (shortLabel === 'USA') return 'USA Top 100';
    return `${shortLabel} Top 100`;
  };

  const displayLabel = getDisplayLabel(list.short_label || list.name, list.slug);

  // Milestone system: Global – 25/50/75/100 Complete
  // Regional lists use same pattern with region name
  const getMilestoneInfo = useMemo(() => {
    const milestoneThresholds = [25, 50, 75, 100];
    
    // Get region prefix for milestone naming
    const getRegionPrefix = () => {
      switch (listSlug) {
        case 'global': return 'Global';
        case 'gb-i': return 'GB&I';
        case 'usa': return 'USA';
        case 'europe': return 'Europe';
        default: return listDisplayName;
      }
    };
    
    const regionPrefix = getRegionPrefix();
    
    // Find next milestone
    const nextMilestone = milestoneThresholds.find(t => t > playedCount);
    const toNextMilestone = nextMilestone ? nextMilestone - playedCount : 0;
    
    // Build milestone label
    const nextMilestoneLabel = nextMilestone 
      ? `${regionPrefix} – ${nextMilestone} Complete`
      : `${regionPrefix} – 100 Complete`;
    
    return {
      nextMilestone,
      toNextMilestone,
      nextMilestoneLabel,
      isComplete: playedCount >= 100,
    };
  }, [playedCount, listSlug, listDisplayName]);
  
  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(percent);
    }, 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="w-full">
      {/* Full-bleed container - no rounded corners, no gap */}
      <div className="overflow-hidden">
        
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

        {/* FULL-BLEED PROGRESS SLAB - attached to hero, no rounded corners */}
        {showProgress && (
          <div 
            className="w-full px-4 py-4"
            style={{ background: '#2f3a4a' }}
          >
            {/* Top row: big count left, milestone info right */}
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

              {/* Right side: percentage + next milestone */}
              <div className="text-right text-white">
                <div className="text-sm font-semibold">
                  {Math.round(percent)}% complete
                </div>
                {getMilestoneInfo.toNextMilestone > 0 && !getMilestoneInfo.isComplete && (
                  <div className="text-xs text-white/70 mt-0.5">
                    {getMilestoneInfo.toNextMilestone} to {getMilestoneInfo.nextMilestoneLabel}
                  </div>
                )}
                {getMilestoneInfo.isComplete && (
                  <div className="text-xs text-white/70 mt-0.5">
                    {getMilestoneInfo.nextMilestoneLabel} ✓
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
                <span>Next milestone: {getMilestoneInfo.nextMilestone || 100}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
