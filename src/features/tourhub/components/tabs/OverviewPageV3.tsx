/**
 * OverviewPageV3 - World-class Tour Hub Overview
 * Full-bleed immersive hero that extends behind the iOS status bar
 * NO header on this page - fully immersive experience
 * 
 * MODULE ORDER (Updated):
 * 1. Hero Carousel (Featured/Latest Tournaments)
 * 2. Live Right Now (Conditional - only shows when live action)
 * 3. Tournament Schedule (Moved up for user priority)
 * 4. Tournament Insights (AI Predictions - differentiator)
 * 5. Unified World Rankings (Movers + OWGR Table combined)
 * 6. Season Leaderboards (Statistical category leaders)
 * 7. College Golf Rankings (NEW - preview of college leaderboard)
 */

import { useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  HeroCarousel,
  LiveRightNow,
  UnifiedWorldRankings,
} from '../overview-v3';
import { WhatsComing } from '../overview-v3/WhatsComing';
import { CollegeRankingsPreview } from '../overview-v3/CollegeRankingsPreview';
import { SeasonLeaderboards } from '../overview-v3/SeasonLeaderboards';
import { TournamentInsights } from '../tournament-insights';
import { LazySection } from '../overview-v3/LazySection';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { usePreventOverscroll } from '@/hooks/usePreventOverscroll';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { HERO_STYLES } from '../../constants/heroStyles';
import { WifiOff, Menu } from 'lucide-react';
import { openTourNav } from '../../contexts/TourNavContext';

export function OverviewPageV3() {
  const { isOnline } = useNetworkStatus();

  // Prevent pull-down overscroll bounce on this immersive page
  usePreventOverscroll();

  // Parallax scale + fade on hero as user scrolls past
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 120], [1, 0.85]);
  const heroScale = useTransform(scrollY, [0, 120], [1, 0.97]);

  // Set transparent status bar with WHITE icons for dark hero image
  useMedianStatusBar("dark", "transparent", true, false);

  return (
    <>
      {/* Burger menu — portaled outside motion.div so fixed positioning
           is relative to the viewport, not a transform-containing parent. */}
      <button
        className="fixed z-30 flex items-center justify-center"
        style={{
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
          left: '16px',
          width: '44px',
          height: '44px',
        }}
        onClick={() => openTourNav()}
        aria-label="Open tour menu"
      >
        <Menu
          className="w-[22px] h-[22px]"
          strokeWidth={2}
          style={{ color: '#FFFFFF', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
        />
      </button>

      <motion.div
        className="min-h-screen bg-background"
        style={{ 
          marginTop: 0,
          paddingTop: 0,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* FIX 09: Offline banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4 bg-muted/95 backdrop-blur-sm border-b border-border"
              style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
            >
              <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                You're offline. Some data may be outdated.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Hero Carousel - using containerNoHeader since Overview has no header */}
        <motion.div 
        className="relative w-full z-0"
        style={{ ...HERO_STYLES.containerNoHeader, opacity: heroOpacity, scale: heroScale }}
      >
        <HeroCarousel hasHeader={false} />
      </motion.div>

      {/* Content sections — consistent 40px vertical rhythm between major sections */}
      <div 
        id="content-below-hero"
        className="relative z-10"
      >
        <div className="bg-background pt-4 space-y-section" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
          {/* 2. Live Right Now (conditional - hides if no live) */}
          <LiveRightNow />

          {/* 3. What's Coming - upcoming tournaments across all tours */}
          <WhatsComing />

          {/* 4. Tournament Insights - AI Predictions (Tournament Intelligence) */}
          <LazySection minHeight={250}>
            <TournamentInsights />
          </LazySection>

          {/* 5. Unified World Rankings (Movers + OWGR Table) */}
          <LazySection minHeight={400}>
            <UnifiedWorldRankings />
          </LazySection>

          {/* 6. Season Leaderboards */}
          <LazySection minHeight={300}>
            <SeasonLeaderboards />
          </LazySection>

          {/* 7. College Golf Rankings */}
          <LazySection minHeight={350}>
            <CollegeRankingsPreview />
          </LazySection>

        </div>
      </div>
    </motion.div>
    </>
  );
}