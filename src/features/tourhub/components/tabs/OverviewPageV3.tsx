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

import { useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HeroCarousel,
  LiveRightNow,
  UnifiedWorldRankings,
  ScheduleModule,
} from '../overview-v3';
import { CollegeRankingsPreview } from '../overview-v3/CollegeRankingsPreview';
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
      className="min-h-screen bg-background"
      style={{ 
        marginTop: 0,
        paddingTop: 0,
      }}
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

      {/* Content sections — consistent 40px vertical rhythm between major sections */}
      <div 
        id="content-below-hero"
        className="relative z-10"
      >
        <div className="bg-background pt-4" style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }}>
          {/* 2. Live Right Now (conditional - hides if no live) */}
          <LiveRightNow />

          {/* 3. Tournament Schedule - moved up for user priority */}
          <ScheduleModule />

          {/* 4. Tournament Insights - AI Predictions (CLBHOUZ Intelligence) */}
          <TournamentInsights />

          {/* 5. Unified World Rankings (Movers + OWGR Table) */}
          <UnifiedWorldRankings />

          {/* 6. Season Leaderboards */}
          <SeasonLeaderboards />

          {/* 7. College Golf Rankings (NEW) */}
          <CollegeRankingsPreview />

        </div>
      </div>
    </motion.div>
  );
}