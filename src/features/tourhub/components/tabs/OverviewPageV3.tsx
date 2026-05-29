/**
 * OverviewPageV3 - World-class Tour Hub Overview
 * Compact header (clbhouz logo + search + identity) sits above the hero.
 * Hero starts below the header; no safe-area bleed.
 *
 * MODULE ORDER (unchanged):
 * 1. Hero Carousel (Featured/Latest Tournaments)
 * 2. Live Right Now (Conditional)
 * 3. Tournament Schedule
 * 4. Tournament Insights
 * 5. Unified World Rankings
 * 6. Season Leaderboards
 * 7. College Golf Rankings
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeroCarousel,
  LiveRightNow,
} from '../overview-v3';
import { ComingUpCalendar } from '../ComingUpCalendar';
import { CollegeRivalry } from '../CollegeRivalry';
import { LazySection } from '../overview-v3/LazySection';

import { IntelligenceHero } from '../IntelligenceHero';
import { WorldRankingsHero } from '../WorldRankingsHero';
import { StatOfTheWeek } from '../StatOfTheWeek';
import { HomeCourseOfWeekModule } from '../home/HomeCourseOfWeekModule';
import { HomeWatchRail } from '../home/HomeWatchRail';
import { HomeConnectHandicapModule } from '../home/HomeConnectHandicapModule';
import { DispatchModule } from '../overview-v3/DispatchModule';
import { AcrossTheToursModule } from '../overview-v3/AcrossTheToursModule';
import { useAllToursTickerData } from '../../hooks/useOverviewModules';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { HERO_STYLES } from '../../constants/heroStyles';
import { TOTAL_HERO_HEIGHT_TARGET } from '../overview-v3/HybridHero.constants';
import { WifiOff } from 'lucide-react';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';


export function OverviewPageV3() {
  const { isOnline } = useNetworkStatus();

  // Parallax removed (May 2026): scroll-driven opacity/scale on the hero created a
  // console-silent feedback flash in WebView (scale transform nudged layout → scrollY
  // → transform re-ran). Hero is now static; fade-in on the page wrapper is retained.


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

  const heroContainerStyle = HERO_STYLES.containerBelowHeader;

  // Pass 6: derive the active tour's slug so AcrossTheToursModule can exclude it.
  const { data: tickerData } = useAllToursTickerData();
  const activeTourSlug = useMemo(() => {
    if (!activeTournamentId || !tickerData) return null;
    const all = [...tickerData.live, ...tickerData.completed, ...tickerData.upcoming];
    return all.find(c => c.id === activeTournamentId)?.tourSlug ?? null;
  }, [activeTournamentId, tickerData]);

  // ── Default to PGA on landing (deterministic) — only when no ?tour= is set ──
  // Was random per-load, which raced the hero mount-emit and made the landing tour
  // change every visit. Now always PGA; the only thing that changes the active tour
  // afterwards is an explicit user selection (switcher sheet or swipe).
  const defaultTournamentId = useMemo(() => {
    if (tourParam) return null;   // explicit selection; skip default
    if (!tickerData) return null; // wait for data
    const pickPga = (arr: typeof tickerData.live) =>
      arr.find((c) => c.tourSlug === 'pga')?.id ?? null;
    return (
      pickPga(tickerData.live) ??
      pickPga(tickerData.completed) ??
      tickerData.live[0]?.id ??
      tickerData.completed[0]?.id ??
      null
    );
  }, [tourParam, tickerData]);

  const defaultAppliedRef = useRef(false);
  useEffect(() => {
    if (defaultAppliedRef.current) return;     // seed exactly once
    if (activeTournamentId) return;            // something already pinned
    if (!defaultTournamentId) return;          // wait for data
    defaultAppliedRef.current = true;
    setActiveTournamentId(defaultTournamentId);
    setAutoRotate(false); // PIN — locked default
  }, [defaultTournamentId, activeTournamentId]);

  const lastAppliedRandomRef = useRef<string | null>(null);
  useEffect(() => {
    if (!randomTournamentId) return;
    if (lastAppliedRandomRef.current === randomTournamentId) return;
    // Don't apply if param effect already pinned something
    if (activeTournamentId) return;
    lastAppliedRandomRef.current = randomTournamentId;
    setActiveTournamentId(randomTournamentId);
    setAutoRotate(false); // PIN — locked decision
  }, [randomTournamentId, activeTournamentId]);


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
          // HeroCarousel's root is h-full and its descendants use position: absolute;
          // inset: 0. CSS percentage-height resolution requires this parent to have a
          // definite height — min-height alone does not qualify, regardless of flex
          // context. Definite height it is. Read from TOTAL_HERO_HEIGHT_TARGET
          // (currently 528: 506 base + 22px slack for the optional ChampionStrip
          // narrative line per Pass 5.5). This is a hard ceiling: Upcoming state
          // should fit, but if it ever clips, raise as a separate task and we'll
          // either lift this number or refactor the position chain.
          style={{
            ...heroContainerStyle,
            maxWidth: 960,
            height: TOTAL_HERO_HEIGHT_TARGET,
          }}
        >
          <HeroCarousel
            hasHeader={true}
            mode="overview"
            activeTournamentId={activeTournamentId}
            onActiveChange={handleHeroActiveChange}
            onTourSelect={handleTickerSelect}
            autoRotate={autoRotate}
          />
        </motion.div>


        {/* Editorial content tier — sits directly below the hero CTA. */}
        <AcrossTheToursModule activeTourSlug={activeTourSlug} />
        <DispatchModule />

        {/* Content sections */}
        <div 
          id="content-below-hero"
          className="relative z-10"
        >
          <div className="bg-background" style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingTop: 40, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
            <LazySection minHeight={160}>
              <HomeConnectHandicapModule />
            </LazySection>
            <LazySection minHeight={500}>
              <IntelligenceHero />
            </LazySection>
            <LazySection minHeight={400}>
              <ComingUpCalendar />
            </LazySection>
            <LazySection minHeight={260}>
              <HomeCourseOfWeekModule />
            </LazySection>
            <LazySection minHeight={240}>
              <HomeWatchRail />
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