/**
 * OverviewHero — self-contained hero carousel for the Tour Hub Overview tab.
 *
 * REBUILD (May 2026): replaces the old HeroCarousel/HybridHero stack, which
 * coupled the active tournament to parent state (OverviewPageV3) via a
 * bidirectional emit/receive effect pair. That two-way sync was the root of
 * every render-loop / tour-switch deadlock we hit.
 *
 * Design contract for this rebuild — DO NOT reintroduce parent sync:
 *  - This component owns its index INTERNALLY (`activeIndex`). Nothing flows
 *    upward; there is no `activeTournamentId`, no `onActiveChange`, no
 *    `?tour=` coupling, and no external tour selector. One owner = no loop.
 *  - All three states (live / completed / upcoming) are eligible to be the
 *    landing slide. On every mount the slide order is shuffled once, so the
 *    user lands on a different tournament each visit.
 *  - Visuals are reused from ScheduleHeroCard (live leader rows, winner
 *    spotlight, upcoming countdown) so the look matches the rest of Tour Hub.
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeroCarouselData, type HeroSlide } from '../../hooks/useHeroCarouselData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import { ScheduleHeroCard } from '../schedule/ScheduleHeroCard';
import type { TourTournament } from '../../hooks/useTourHubData';
import '@/styles/hero-glass.css';

type CardType = 'live' | 'upcoming' | 'recent';

interface OverviewHeroSlide {
  id: string;
  type: CardType;
  tournament: TourTournament;
}

// HeroSlide.type ('completed') → ScheduleHeroCard type ('recent').
function mapType(t: HeroSlide['type']): CardType {
  return t === 'completed' ? 'recent' : t;
}

// Adapt the camelCase HeroTournament to the snake_case TourTournament shape
// that ScheduleHeroCard reads.
function adaptTournament(h: HeroSlide['tournament']): TourTournament {
  return {
    id: h.id,
    sr_id: h.id,
    season_id: '',
    name: h.name,
    status: h.status,
    start_date: h.startDate,
    end_date: h.endDate,
    purse: h.purse,
    currency: h.currency,
    venue_name: h.venueName,
    venue_city: h.venueCity,
    venue_state: null,
    venue_country: h.venueCountry,
    venue_course_name: h.venueName,
    venue_par: h.venuePar,
    venue_yardage: h.venueYardage,
    defending_champion: h.defendingChampion,
    timezone: null,
    tour_code: h.tourSlug,
    tour_full_name: h.tourName,
    winner_score: h.winnerScore,
    current_round: h.currentRound,
    cutline: null,
    projected_cutline: null,
    winner_id: h.winnerId,
    champion_narrative: h.championNarrative,
  } as TourTournament;
}

// Fisher–Yates shuffle (pure; returns a new array).
function shuffle<T>(input: T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface OverviewHeroProps {
  /** Carousel height in px — keep in sync with the page's reserved hero slot. */
  height?: number;
}

export function OverviewHero({ height = 528 }: OverviewHeroProps) {
  const { data: rawSlides = [], isLoading } = useHeroCarouselData();

  // Re-shuffle only when the set of tournament ids changes, so the order is
  // stable across unrelated re-renders but still randomises on a fresh load.
  const idSignature = useMemo(
    () => (Array.isArray(rawSlides) ? rawSlides.map((s) => s.tournament.id).join('|') : ''),
    [rawSlides],
  );

  const slides = useMemo<OverviewHeroSlide[]>(() => {
    if (!Array.isArray(rawSlides) || rawSlides.length === 0) return [];
    const adapted = rawSlides.map((s) => ({
      id: s.tournament.id,
      type: mapType(s.type),
      tournament: adaptTournament(s.tournament),
    }));
    return shuffle(adapted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSignature]);

  // Leaders/winners for live + completed slides.
  const leaderIds = useMemo(
    () => slides.filter((s) => s.type === 'live' || s.type === 'recent').map((s) => s.id),
    [slides],
  );
  const { data: leadersMap } = useTournamentLeadersWinners(leaderIds);

  // ── Internal index state (single owner — no parent coupling) ──
  const [activeIndex, setActiveIndex] = useState(0);
  const count = slides.length;

  const touchStartRef = useRef(0);
  const touchDeltaRef = useRef(0);
  const pausedRef = useRef(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Reset index when the slide set changes (lands on the shuffled first slide).
  useEffect(() => {
    setActiveIndex(0);
  }, [idSignature]);

  // Auto-advance (7s), paused when document is hidden or user is touching.
  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    if (count <= 1) return;
    autoRef.current = setInterval(() => {
      if (!pausedRef.current) setActiveIndex((p) => (p + 1) % count);
    }, 7000);
  }, [count]);

  useEffect(() => {
    startAuto();
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [startAuto]);

  useEffect(() => {
    const onVis = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const goTo = useCallback((i: number) => {
    setActiveIndex(i);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
    touchStartRef.current = e.touches[0].clientX;
    touchDeltaRef.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current;
  };
  const onTouchEnd = () => {
    const d = touchDeltaRef.current;
    if (Math.abs(d) > 50 && count > 1) {
      setActiveIndex((p) => (d < 0 ? (p + 1) % count : (p - 1 + count) % count));
    }
    window.setTimeout(() => {
      pausedRef.current = document.hidden;
    }, 5000);
  };

  if (isLoading || count === 0) {
    return (
      <div
        style={{ height, width: '100%' }}
        className="bg-muted/30 animate-pulse"
        aria-busy="true"
      />
    );
  }

  const safeIndex = Math.min(activeIndex, count - 1);
  const active = slides[safeIndex];
  const leaderWinner = leadersMap?.[active.id];

  return (
    <div
      style={{ height, width: '100%', position: 'relative', overflow: 'hidden' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ height: '100%', width: '100%' }}
        >
          <ScheduleHeroCard
            tournament={active.tournament}
            type={active.type}
            leaderWinner={leaderWinner}
            currentIndex={safeIndex}
            totalSlides={count}
            onDotClick={goTo}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default OverviewHero;
