/**
 * OverviewPageV3 - Premium Tour Hub Overview
 * 
 * REDESIGNED: Single flowing premium surface
 * Design Reference: Apple Fitness • YouTube Studio • The Athletic
 * 
 * Hero stays UNCHANGED. Everything below transformed per redesign brief.
 * 
 * MODULE ORDER:
 * 1. Hero (full-bleed, untouched)
 * 2. Schedule Timeline (horizontal)
 * 3. Predictions Section (accordion)
 * 4. Course Fit Section (stat bars)
 * 5. Power Ladder (vertical list)
 * 6. Skill Trees (horizontal tabs)
 * 7. Movers Strip (horizontal delta)
 * 8. World Rankings (editorial table)
 * 9. Season Leaders + Spotlight (merged)
 */

import { useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HeroCarousel,
  LiveRightNow,
  CourseIntelligence,
  // NEW Redesigned Components
  ScheduleTimeline,
  PredictionsSection,
  CourseFitSection,
  PowerLadder,
  SkillTrees,
  MoversStrip,
  WorldRankings,
  SeasonLeadersSpotlight,
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
  useMedianStatusBar("dark", "transparent", true, false);

  // Register as dimmable page with IMMEDIATE dimming
  useLayoutEffect(() => {
    setDimmablePage('tourhub-overview');
    setIsLightDimmed(true);
    
    return () => {
      setDimmablePage(null);
      setIsLightDimmed(false);
    };
  }, [setDimmablePage, setIsLightDimmed]);

  return (
    <motion.div
      className="min-h-screen bg-[#F8FAFC]"
      style={{ overscrollBehaviorY: 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero - UNCHANGED per redesign brief */}
      <div 
        className="relative w-full z-0"
        style={HERO_STYLES.container}
      >
        <HeroCarousel />
      </div>

      {/* Content - One Premium Surface */}
      <div 
        id="content-below-hero"
        className="relative z-10"
      >
        {/* Background */}
        <div className="bg-[#F8FAFC]">
          
          {/* Live Right Now - Shows if any live tournaments */}
          <LiveRightNow />

          {/* 1. Schedule Timeline - Horizontal tournament timeline */}
          <ScheduleTimeline />

          {/* 2. AI Predictions - "Who's Taking This?" */}
          <PredictionsSection />

          {/* 3. Course Fit - "What It Takes To Win Here" */}
          <CourseFitSection />

          {/* 4. Power Ladder - World Rankings by tier */}
          <PowerLadder />

          {/* 5. Skill Trees - Player attributes by category */}
          <SkillTrees />

          {/* 6. Movers This Week - Horizontal delta strip */}
          <MoversStrip />

          {/* 7. World Rankings - Editorial table layout */}
          <WorldRankings />

          {/* 8. Season Leaders + Player Spotlight (merged) */}
          <SeasonLeadersSpotlight />

          {/* 9. Course Intelligence - Venue details (kept from original) */}
          <CourseIntelligence />

        </div>
      </div>
    </motion.div>
  );
}
