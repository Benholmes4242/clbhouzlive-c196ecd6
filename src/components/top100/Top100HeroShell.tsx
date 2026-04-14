import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
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
        className="relative overflow-hidden bg-background"
        style={{
          height: '45dvh',
          marginTop: 0,
        }}
      >
          {/* Background image with gradient overlay for text legibility */}
          {hero?.cover_image_url ? (
            <>
              {/* Blur placeholder while loading */}
              <div 
                className={`absolute inset-0 bg-foreground/70 transition-opacity duration-500 ${
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
              {/* Single consolidated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30 pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-foreground/70 to-foreground" />
          )}
          
          {/* Glass back button removed — text link below hero */}
          
          {/* Title at bottom of hero */}
          <motion.div 
            className="absolute bottom-3 left-4 right-4 z-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h1 className="text-white text-[22px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" style={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
              {displayLabel}
            </h1>
          </motion.div>
      </div>

      {/* ← Back text link below hero, above progress */}
      <div className="px-4 pt-3 pb-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground active:opacity-70 transition-opacity"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>

      {/* PROGRESS SECTION - on page background with semantic text */}
      {showProgress && (
        <div className="w-full px-4 py-4">
          {/* Top row: X / total (primary) + % complete (secondary) */}
          <div className="flex items-baseline justify-between gap-4">
            <div className="flex items-baseline">
              <span style={{ color: theme.ringColor, fontWeight: 900 }}>
                <AnimatedNumber 
                  value={playedCount}
                  minCh={1}
                  className="text-[34px] leading-none tabular-nums"
                />
              </span>
              <span className="text-muted-foreground/60 text-base ml-0.5 font-normal">/{totalCount}</span>
            </div>

            <div className="flex items-baseline gap-1.5 text-foreground">
              <AnimatedNumber 
                value={Math.round(percent)}
                suffix="%"
                minCh={1}
                delay={0.1}
                className="text-lg font-semibold tabular-nums"
              />
              <span className="text-[11px] text-muted-foreground font-medium">
                complete
              </span>
            </div>
          </div>

          {/* Progress bar - uses regional accent color with glow */}
          <div className="mt-2.5">
            <div 
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ background: 'rgba(15,23,42,0.08)' }}
              role="progressbar"
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${playedCount} of ${totalCount} courses complete`}
            >
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