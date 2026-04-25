import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { getRegionTheme } from '@/lib/regionTheme';
import { AnimatedNumber } from '@/components/ui/motion';
import { FlagChip } from '@/components/courses/FlagChip';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';

// Local slug → full proper-name map for the eyebrow.
// Intentionally NOT reusing REGION_DISPLAY_NAMES from Top100List.tsx —
// keeps concerns local. Consolidation brief will deduplicate later.
const REGION_FULL_NAMES: Record<string, string> = {
  global: 'Worldwide',
  'gb-i': 'Great Britain & Ireland',
  usa: 'United States',
  europe: 'Continental Europe',
};

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
  const regionFullName = REGION_FULL_NAMES[listSlug] || 'Worldwide';

  return (
    <>
      {/* HERO IMAGE SECTION - full-bleed immersive, extends behind notch. Compressed to 200px (Phase A). */}
      <div
        className="relative overflow-hidden bg-background"
        style={{
          height: '200px',
          marginTop: 0,
        }}
      >
          {/* Floating glass back button — single-state dark glass, scrolls away with hero (Phase A) */}
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label="Back"
            style={{
              position: 'absolute',
              top: 'max(env(safe-area-inset-top, 0px), 47px)',
              left: 16,
              zIndex: 11,
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'rgba(15,23,42,0.55)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '0.5px solid rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            className="active:scale-[0.95] transition-transform"
          >
            <ChevronLeft size={20} color="#ffffff" />
          </button>

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

          {/* Eyebrow + headline at bottom of hero */}
          <motion.div
            className="absolute bottom-3 left-4 right-4 z-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div
              className="flex items-center gap-1.5 mb-1"
              style={{ opacity: 0.92 }}
            >
              <FlagChip slug={listSlug} size={14} />
              <span
                className="text-white"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {regionFullName}
              </span>
            </div>
            <h1
              className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
              style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05 }}
            >
              {displayLabel}
            </h1>
          </motion.div>
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