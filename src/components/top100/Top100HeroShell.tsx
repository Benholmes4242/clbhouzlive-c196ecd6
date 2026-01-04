import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Top100RankBadge } from './Top100RankBadge';
import { getRegionTheme } from '@/lib/regionTheme';
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
 * Uses regional color theming for progress bar.
 */
export const Top100HeroShell: React.FC<Top100HeroShellProps> = ({
  list,
  playedCount,
  totalCount,
  onBack,
  showProgress = true,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const hero = list.hero_course;
  const topRank = hero?.rank_in_list ?? null;
  const listSlug = list.slug as 'global' | 'gb-i' | 'usa' | 'europe';
  
  // Get regional theme for progress bar color
  const theme = getRegionTheme(listSlug);
  
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
        
        {/* HERO IMAGE SECTION - consistent height across all lists */}
        <div className="relative h-[220px]">
          {/* Background image with gradient overlay for text legibility */}
          {hero?.cover_image_url ? (
            <>
              <img
                src={hero.cover_image_url}
                alt={hero.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {/* Top gradient for back button */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
              {/* Bottom gradient for title */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
          )}
          
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-3 left-3 z-20 h-9 w-9 bg-black/30 backdrop-blur-sm rounded-sq-sm flex items-center justify-center hover:bg-black/50 transition-colors focus:outline-none"
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
          <div className="absolute bottom-3 left-4 right-4 z-10">
            <h1 className="text-white text-2xl font-semibold drop-shadow-lg">
              {displayLabel}
            </h1>
          </div>
        </div>

        {/* FULL-BLEED PROGRESS SLAB - uses regional color for bar */}
        {showProgress && (
          <div 
            className="w-full px-4 py-3"
            style={{ 
              background: 'linear-gradient(to bottom, #4a5568 0%, #64748b 50%, #94a3b8 100%)',
            }}
          >
            {/* Top row: X / total (primary) + % complete (secondary) */}
            <div className="flex items-baseline justify-between gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-white"
              >
                <span className="text-3xl font-semibold leading-none drop-shadow-sm">
                  {playedCount}
                </span>
                <span className="text-white/70 text-lg ml-0.5">/{totalCount}</span>
              </motion.div>

              <div className="flex items-baseline gap-1.5 text-white">
                <span className="text-lg font-semibold drop-shadow-sm">
                  {Math.round(percent)}%
                </span>
                <span className="text-[11px] text-white/70">
                  complete
                </span>
              </div>
            </div>

            {/* Progress bar - uses regional accent color */}
            <div className="mt-2.5">
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-2 rounded-full shadow-sm"
                  style={{ backgroundColor: theme.ringColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${animatedProgress}%` }}
                  transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
