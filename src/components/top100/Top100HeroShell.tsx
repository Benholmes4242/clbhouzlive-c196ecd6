import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
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
  /** @deprecated unused after Phase B; kept on type only if future consumers need them */
  playedCount?: number;
  totalCount?: number;
  listDisplayName?: string;
}

/**
 * Top100HeroShell - Compressed full-bleed hero (200px) with eyebrow + headline + glass back button.
 * Progress is now rendered as a separate compact strip in Top100List.tsx (Phase B).
 * Full-bleed immersive: hero extends behind notch, back button below safe area.
 */
export const Top100HeroShell: React.FC<Top100HeroShellProps> = ({
  list,
}) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const hero = list.hero_course;
  const listSlug = list.slug as 'global' | 'gb-i' | 'usa' | 'europe';

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

    </>
  );
};
