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

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  HeroCarousel,
  LiveRightNow,
} from '../overview-v3';
import { ComingUpCalendar } from '../ComingUpCalendar';
import { CollegeRivalry } from '../CollegeRivalry';
import { LazySection } from '../overview-v3/LazySection';
import { AllToursTicker } from '../AllToursTicker';
import { useAllToursTickerData } from '../../hooks/useOverviewModules';
import { IntelligenceHero } from '../IntelligenceHero';
import { WorldRankingsHero } from '../WorldRankingsHero';
import { StatOfTheWeek } from '../StatOfTheWeek';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { usePreventOverscroll } from '@/hooks/usePreventOverscroll';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { HERO_STYLES } from '../../constants/heroStyles';
import { WifiOff } from 'lucide-react';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

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

  // ── Phase A: Hero ↔ Ticker shared active-tournament state ──
  // SINGLE SOURCE OF TRUTH: HeroCarousel emits its current slide id upward via
  // onActiveChange (fires on mount + every auto-rotate / swipe). The parent
  // never seeds activeTournamentId — that prevents the two-source ping-pong
  // loop that crashed the page (>100 history.pushState in 10s).
  // Initial state is null; Ticker treats null as "no active card" cleanly.
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Ticker tap: swap Hero + terminally pause auto-rotation (no resume)
  const handleTickerSelect = useCallback((tournamentId: string) => {
    setActiveTournamentId(tournamentId);
    setAutoRotate(false);
  }, []);

  // Hero auto-rotate / swipe: keep Ticker "NOW SHOWING" in sync (do NOT touch autoRotate)
  const handleHeroActiveChange = useCallback((tournamentId: string) => {
    setActiveTournamentId(tournamentId);
  }, []);

  const { data: tickerData } = useAllToursTickerData();
  const activeStatus = activeTournamentId
    ? (tickerData?.live.find(c => c.id === activeTournamentId) ? 'live'
      : tickerData?.completed.find(c => c.id === activeTournamentId) ? 'completed'
      : tickerData?.upcoming.find(c => c.id === activeTournamentId) ? 'upcoming'
      : null)
    : null;
  const heroContainerStyle = activeStatus === 'live' || activeStatus === 'completed'
    ? HERO_STYLES.containerEditorial
    : HERO_STYLES.containerNoHeader;


  return (
    <>
      {/* ── FIXED OVERLAYS — outside motion.div so CSS transforms don't break position:fixed ── */}
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

      {/* ── PAGE CONTENT — motion.div for fade-in only ── */}
      <motion.div
        className="min-h-screen bg-background"
        style={{ marginTop: 0, paddingTop: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* 1. Hero Carousel — capped at 960px on wide screens, full-bleed on mobile */}
        <motion.div 
          className="relative w-full z-0 mx-auto"
          style={{ ...heroContainerStyle, maxWidth: 960, opacity: heroOpacity, scale: heroScale }}
        >
          <HeroCarousel
            hasHeader={false}
            mode="overview"
            activeTournamentId={activeTournamentId}
            onActiveChange={handleHeroActiveChange}
            autoRotate={autoRotate}
          />
        </motion.div>

        {/* All Tours Ticker — flush below the hero, no top gap. Now drives the Hero (tap to switch). */}
        <div style={{ zoom: 0.9 }}>
          <AllToursTicker
            activeId={activeTournamentId}
            onSelect={handleTickerSelect}
          />
        </div>

        {/* Content sections */}
        <div 
          id="content-below-hero"
          className="relative z-10"
        >
          <div className="bg-background" style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingTop: 40, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
            <LazySection minHeight={500}>
              <IntelligenceHero />
            </LazySection>
            <LazySection minHeight={400}>
              <ComingUpCalendar />
            </LazySection>
            <LazySection minHeight={400}>
              <WorldRankingsHero />
            </LazySection>
            <LazySection minHeight={400}>
              <StatOfTheWeek />
            </LazySection>
            <LazySection minHeight={350}>
              <CollegeRivalry />
            </LazySection>
          </div>
        </div>
        <ScrollToTopGlass />
      </motion.div>
    </>
  );
}