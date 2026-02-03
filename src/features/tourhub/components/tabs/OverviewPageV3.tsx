/**
 * OverviewPageV3 - World-class Tour Hub Overview
 * Full-bleed immersive hero that extends behind the iOS status bar
 * NO header on this page - fully immersive experience
 * 
 * MODULE ORDER (Updated):
 * 1. Hero Carousel (Featured/Latest Tournaments)
 * 2. Live Right Now (Conditional - only shows when live action)
 * 3. Tournament Insights (AI Predictions - differentiator)
 * 4. Tournament Schedule (Moved up for user priority)
 * 5. Movers This Week (Who's climbing the rankings)
 * 6. World Rankings (Official OWGR standings)
 * 7. Season Leaderboards (Statistical category leaders)
 */

import { useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HeroCarousel,
  LiveRightNow,
  MoversThisWeek,
  WorldRankingsModule,
  
  ScheduleModule,
} from '../overview-v3';
import { SeasonLeaderboards } from '../overview-v3/SeasonLeaderboards';
import { TournamentInsights } from '../tournament-insights';
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
      {/* 1. Hero Carousel - using containerNoHeader since Overview has no header */}
      <div 
        className="relative w-full z-0"
        style={HERO_STYLES.containerNoHeader}
      >
        <HeroCarousel hasHeader={false} />
      </div>

      {/* Content sections */}
      <div 
        id="content-below-hero"
        className="relative z-10"
      >
        <div className="bg-[#F8FAFC] pt-4">
          {/* 2. Live Right Now (conditional - hides if no live) */}
          <LiveRightNow />

          {/* 3. Tournament Insights - AI Predictions */}
          <TournamentInsights />

          {/* 4. Tournament Schedule - MOVED UP */}
          <ScheduleModule />

          {/* 5. Movers This Week */}
          <MoversThisWeek />

          {/* 6. World Rankings */}
          <WorldRankingsModule />

          {/* 7. Season Leaderboards */}
          <SeasonLeaderboards />

        </div>
      </div>
    </motion.div>
  );
}