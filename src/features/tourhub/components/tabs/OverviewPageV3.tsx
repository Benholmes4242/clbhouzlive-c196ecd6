/**
 * OverviewPageV3 - World-class Tour Hub Overview
 * Full-screen cinematic hero with scrollable content below
 * Header is permanently faded/transparent for cinematic immersion
 * 
 * MODULE ORDER:
 * 1. Hero (unchanged)
 * 2. Live Right Now (if any live tournaments)
 * 3. Coming Up Next
 * 4. Movers This Week (if any significant movers)
 * 5. Season Leaders
 * 6. Season Stats Carousel
 * 7. World Rankings
 * 8. Player Spotlight
 * 9. Course Intelligence (if courses this week)
 */

import { useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HeroCarousel,
  LiveRightNow,
  ComingUpNext,
  MoversThisWeek,
  SeasonLeaders,
  WorldRankingsModule,
  PlayerSpotlight,
  CourseIntelligence,
  SeasonStatsCarousel,
} from '../overview-v3';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';

export function OverviewPageV3() {
  const { setDimmablePage, setIsLightDimmed } = useCinemaDimContext();

  // Set transparent status bar with white icons for cinematic hero bleed
  useMedianStatusBar("dark", "transparent", true, false);

  // Register as dimmable page with IMMEDIATE dimming (no 4-second delay)
  useLayoutEffect(() => {
    setDimmablePage('tourhub-overview');
    setIsLightDimmed(true); // Immediately set to dimmed state
    
    return () => {
      setDimmablePage(null);
      setIsLightDimmed(false);
    };
  }, [setDimmablePage, setIsLightDimmed]);

  return (
    <motion.div
      className="flex flex-col bg-[#F8FAFC]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* 1. Hero Carousel - Full-screen cinematic, flush to header */}
      <HeroCarousel />

      {/* Content below hero - scroll target */}
      <div id="content-below-hero">
        {/* 2. Live Right Now - Multi-tour snapshot (hides if no live) */}
        <LiveRightNow />

        {/* 3. Coming Up Next - Next 7 days */}
        <ComingUpNext />

        {/* 4. Movers This Week - World ranking changes (hides if no movers) */}
        <MoversThisWeek />

        {/* 5. Season Leaders - By tour with tabs */}
        <SeasonLeaders />

        {/* 6. Season Stats Carousel - 2025 PGA Tour Stats (Cinematic Cards) */}
        <SeasonStatsCarousel />

        {/* 7. World Rankings - Full OWGR browsable list */}
        <WorldRankingsModule />

        {/* 8. Player Spotlight - Featured player */}
        <PlayerSpotlight />

        {/* 9. Course Intelligence - This week's venues */}
        <CourseIntelligence />
      </div>
    </motion.div>
  );
}
