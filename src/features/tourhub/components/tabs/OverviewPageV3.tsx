/**
 * OverviewPageV3 - World-class Tour Hub Overview
 * Full-bleed immersive hero that extends behind the iOS status bar
 * NO header on this page - fully immersive experience
 * 
 * MODULE ORDER (Updated for Gamified Tour Hub):
 * 1. Hero (full-bleed, absolute positioned from top:0)
 * 2. Live Right Now (if any live tournaments)
 * 3. Power Ladder (NEW - Tiered world rankings)
 * 4. Skill Trees (NEW - RPG-style player attributes)
 * 5. Movers This Week (if any significant movers)
 * 6. Season Leaders
 * 7. World Rankings
 * 8. Season Stats Carousel
 * 9. Player Spotlight
 * 10. Course Intelligence (if courses this week)
 */

import { useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HeroCarousel,
  LiveRightNow,
  MoversThisWeek,
  SeasonLeaders,
  WorldRankingsModule,
  PlayerSpotlight,
  CourseIntelligence,
  SeasonStatsCarousel,
  PowerLadderModule,
  SkillTreeModule,
} from '../overview-v3';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { HERO_HEIGHT, HERO_MIN_HEIGHT, HERO_MAX_HEIGHT } from '../../constants/heroStyles';

export function OverviewPageV3() {
  const { setDimmablePage, setIsLightDimmed } = useCinemaDimContext();

  // Set transparent status bar with WHITE icons for dark hero image
  // style: "dark" = white icons (for dark backgrounds)
  // color: "transparent" = no background
  // overlay: true = content goes under status bar
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
      className="relative min-h-screen bg-[#F8FAFC]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero - Absolutely positioned, bleeds to true top of viewport */}
      <div 
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          height: HERO_HEIGHT,
          minHeight: `${HERO_MIN_HEIGHT}px`,
          maxHeight: `${HERO_MAX_HEIGHT}px`,
        }}
      >
        <HeroCarousel />
      </div>

      {/* Content - Starts below hero with no overlap */}
      <div 
        id="content-below-hero"
        className="relative z-10"
        style={{
          // Push content down to start exactly where hero ends (no overlap)
          paddingTop: `clamp(${HERO_MIN_HEIGHT}px, ${HERO_HEIGHT}, ${HERO_MAX_HEIGHT}px)`,
          minHeight: '100vh',
        }}
      >
        {/* White background container for content */}
        <div className="bg-[#F8FAFC] pt-4">
          {/* 2. Live Right Now - Multi-tour snapshot (hides if no live) */}
          <LiveRightNow />

          {/* 3. Power Ladder - Gamified tiered rankings */}
          <PowerLadderModule />

          {/* 4. Skill Trees - RPG-style player attributes */}
          <SkillTreeModule />

          {/* 5. Movers This Week - World ranking changes (hides if no movers) */}
          <MoversThisWeek />

          {/* 6. Season Leaders - By tour with tabs */}
          <SeasonLeaders />

          {/* 7. World Rankings - Full OWGR browsable list */}
          <WorldRankingsModule />

          {/* 8. Season Stats Carousel - 2025 PGA Tour Stats (Cinematic Cards) */}
          <SeasonStatsCarousel />

          {/* 9. Player Spotlight - Featured player */}
          <PlayerSpotlight />

          {/* 10. Course Intelligence - This week's venues */}
          <CourseIntelligence />
        </div>
      </div>
    </motion.div>
  );
}
