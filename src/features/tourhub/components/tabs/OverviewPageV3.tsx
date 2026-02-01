/**
 * OverviewPageV3 - World-class Tour Hub Overview
 * Full-bleed immersive hero that extends behind the iOS status bar
 * NO header on this page - fully immersive experience
 * 
 * MODULE ORDER (Updated for Gamified Tour Hub):
 * 1. Hero (full-bleed, absolute positioned from top:0)
 * 2. Live Right Now (if any live tournaments)
 * 3. Predictions - "Who's Taking This?" (NEW - AI-powered winner predictions)
 * 4. Power Ladder (Tiered world rankings)
 * 5. Skill Trees (RPG-style player attributes)
 * 6. Movers This Week (if any significant movers)
 * 7. Season Leaders
 * 8. World Rankings
 * 9. Season Stats Carousel
 * 10. Player Spotlight
 * 11. Course Intelligence (if courses this week)
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
  PredictionsModule,
  ScheduleModule,
} from '../overview-v3';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { usePreventOverscroll } from '@/hooks/usePreventOverscroll';
import { HERO_STYLES } from '../../constants/heroStyles';

export function OverviewPageV3() {
  const { setDimmablePage, setIsLightDimmed } = useCinemaDimContext();

  // Prevent pull-down overscroll bounce on this immersive page
  usePreventOverscroll();

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
      className="min-h-screen bg-[#F8FAFC]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero - Relative positioned with negative marginTop to bleed behind header + safe area */}
      <div 
        className="relative w-full z-0"
        style={HERO_STYLES.container}
      >
        <HeroCarousel />
      </div>

      {/* Content - Flows naturally after the relative hero */}
      <div 
        id="content-below-hero"
        className="relative z-10"
      >
        {/* White background container for content */}
        <div className="bg-[#F8FAFC] pt-4">
          {/* 2. Live Right Now - Multi-tour snapshot (hides if no live) */}
          <LiveRightNow />

          {/* 3. Who's Taking This? - AI Predictions (NEW) */}
          <PredictionsModule />

          {/* 4. Power Ladder - Gamified tiered rankings */}
          <PowerLadderModule />

          {/* 5. Skill Trees - RPG-style player attributes */}
          <SkillTreeModule />

          {/* 5. Movers This Week - World ranking changes (hides if no movers) */}
          <MoversThisWeek />

          {/* 6. Season Leaders - By tour with tabs */}
          <SeasonLeaders />

          {/* 7. World Rankings - Full OWGR browsable list */}
          <WorldRankingsModule />

          {/* 8. Tournament Schedule - Upcoming events carousel */}
          <ScheduleModule />

          {/* 9. Season Stats Carousel - 2025 PGA Tour Stats (Cinematic Cards) */}
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
