/**
 * OverviewPageV3 - World-class Tour Hub Overview
 * Full-screen cinematic hero with scrollable content below
 * Header is permanently faded/transparent for cinematic immersion
 * 
 * NEW MODULE ORDER:
 * 1. Hero (unchanged)
 * 2. Live Right Now (if any live tournaments)
 * 3. Coming Up Next
 * 4. Movers This Week (if any significant movers)
 * 5. Season Leaders
 * 6. Player Spotlight
 * 7. Course Intelligence (if courses this week)
 * 8. Live Golf Pulse
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
  LiveGolfPulse,
  SeasonStatsCarousel,
} from '../overview-v3';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';

export function OverviewPageV3() {
  const { setDimmablePage, setIsLightDimmed } = useCinemaDimContext();

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

        {/* 8. Course Intelligence - This week's venues */}
        <CourseIntelligence />

        {/* 9. Live Golf Pulse - Real-time stats */}
        <LiveGolfPulse />
      </div>
    </motion.div>
  );
}
