import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { getRegionTheme } from '@/lib/regionTheme';
import { AnimatedNumber } from '@/components/ui/motion';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';

interface Top100HeroShellProps {
  list: Top100ListSummary;
  playedCount: number;
  totalCount: number;
  listDisplayName: string;
  showProgress?: boolean;
}

/**
 * Top100HeroShell - Unified hero image + full-bleed attached progress slab
 * Uses regional color theming for progress bar.
 * Full-bleed immersive: hero extends behind notch, back button below safe area.
 */
export const Top100HeroShell: React.FC<Top100HeroShellProps> = ({
  list,
  playedCount,
  totalCount,
  showProgress = true,
}) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const hero = list.hero_course;
  const topRank = hero?.rank_in_list ?? null;
  const listSlug = list.slug as 'global' | 'gb-i' | 'usa' | 'europe';
  
  // Get regional theme for progress bar color
  const theme = getRegionTheme(listSlug);
  
  // Progress calculation
  const percent = totalCount > 0 ? (playedCount / totalCount) * 100 : 0;
  
  // Map short labels to full display names for hero title
  const getDisplayLabel = (shortLabel: string, slug: string) => {
    if (slug === 'global' || shortLabel === 'Global') return 'Global Top 100';
    if (shortLabel === 'GB&I') return 'GB&I Top 100';
    if (shortLabel === 'Europe') return 'Europe Top 100';
    if (shortLabel === 'USA') return 'USA Top 100';
    return `${shortLabel} Top 100`;
  };

  const displayLabel = getDisplayLabel(list.short_label || list.name, list.slug);

  return (
    <>
      {/* HERO IMAGE SECTION - full-bleed immersive, extends behind notch */}
      <div 
        className="relative overflow-hidden bg-slate-50"
        style={{
          height: 'calc(16rem + 55px + max(env(safe-area-inset-top, 0px), 47px))',
          marginTop: 'calc(-55px - max(env(safe-area-inset-top, 0px), 47px))',
        }}
      >
          {/* Background image with gradient overlay for text legibility */}
          {hero?.cover_image_url ? (
            <>
              {/* Blur placeholder while loading */}
              <div 
                className={`absolute inset-0 bg-slate-700 transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <motion.img
                src={hero.cover_image_url}
                alt={hero.name}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                onLoad={(e) => {
                  setImageLoaded(true);
                  e.currentTarget.classList.add('loaded');
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoaded ? 1 : 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              {/* Top gradient for header area */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
              {/* Bottom gradient for title */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
          )}
          
          {/* Glass back button - positioned below safe area */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors z-10"
            style={{ top: 'calc(1rem + max(env(safe-area-inset-top, 0px), 47px))' }}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          
          {/* Title at bottom of hero */}
          <motion.div 
            className="absolute bottom-3 left-4 right-4 z-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h1 className="text-white text-2xl font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
              {displayLabel}
            </h1>
          </motion.div>
      </div>

      {/* PROGRESS SECTION - on page background with slate text */}
      {showProgress && (
        <div className="w-full px-4 py-4 bg-slate-50">
          {/* Top row: X / total (primary) + % complete (secondary) */}
          <div className="flex items-baseline justify-between gap-4">
            <div className="text-slate-800">
              <AnimatedNumber 
                value={playedCount}
                minCh={1}
                className="text-3xl font-semibold leading-none tabular-nums"
              />
              <span className="text-slate-500 text-lg ml-0.5 font-light">/{totalCount}</span>
            </div>

            <div className="flex items-baseline gap-1.5 text-slate-800">
              <AnimatedNumber 
                value={Math.round(percent)}
                suffix="%"
                minCh={1}
                delay={0.1}
                className="text-lg font-semibold tabular-nums"
              />
              <span className="text-[11px] text-slate-500 font-medium">
                complete
              </span>
            </div>
          </div>

          {/* Progress bar - uses regional accent color with glow */}
          <div className="mt-2.5">
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                style={{ 
                  backgroundColor: theme.ringColor,
                  boxShadow: percent > 0 ? `0 0 12px ${theme.ringColor}, 0 0 4px ${theme.ringColor}` : 'none',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};