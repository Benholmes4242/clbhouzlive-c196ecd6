/**
 * OverviewHero — Hero River. The carousel crosses ALL tours in the
 * editorial order returned by useHeroCarouselData (LIVE→majors→rest).
 * Swipe / chevrons change the tournament AND the tour. The picker becomes a
 * jump-to shortcut via selectionNonce. Display reporting is debounced 250ms
 * so a rapid multi-slide swipe doesn't fan out pulse/OTC/TI fetches per
 * intermediate slide.
 *
 * Strict one-way flows preserved: hero never reads viewing* back into its own
 * index. All hooks run unconditionally before any early return (React #310).
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';


import { useNavigate } from 'react-router-dom';

import { useHeroCarouselData, type HeroSlide } from '../../hooks/useHeroCarouselData';
import { useTourLeaderboard } from '../../hooks/useTourHubData';
import { HeroBoardSection } from './HybridHeroBands/HeroBoardBand';
import { tournamentRoute } from '../../routes';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HybridHero } from './HybridHero';
import { PHOTO_BAND_HEIGHT } from './HybridHero.constants';
import { useTourSelection } from '../../context/TourSelectionContext';
import { INK_TINT_06 } from '../../_shared/tokens';

const NOOP = () => {};

interface OverviewHeroProps {
  height?: number | string;
}

/**
 * Canonical PHOTO BAND height — matches the Courses Discover hero
 * (`CoursesPageHero`) and the Course Details cinematic hero
 * (`CinematicHeroFullBleed`). The wire ticker (36px) sits BELOW this,
 * so the full overview hero container is `OVERVIEW_HERO_TOTAL_HEIGHT`.
 */
export const OVERVIEW_HERO_HEIGHT =
  `calc(${PHOTO_BAND_HEIGHT}px + env(safe-area-inset-top, 0px))`;

/** Wire-ticker band height (kept in sync with HeroWireTicker). */
export const OVERVIEW_HERO_TICKER_HEIGHT = 36;

/** Full hero container height = photo band + wire ticker. */
export const OVERVIEW_HERO_TOTAL_HEIGHT =
  `calc(${OVERVIEW_HERO_HEIGHT} + ${OVERVIEW_HERO_TICKER_HEIGHT}px)`;

export function OverviewHero({ height = OVERVIEW_HERO_TOTAL_HEIGHT }: OverviewHeroProps) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data: rawSlides = [], isLoading } = useHeroCarouselData();


  const {
    selectedTourSlug,
    selectedTournamentId,
    selectionNonce,
    applyLandingSelection,
    setViewingTourSlug,
    setViewingTournamentId,
    setViewingIsLive,
  } = useTourSelection();


  // Hero River: trust the hook's editorial order. No per-tour filter, no shuffle.
  const slides = rawSlides;
  const count = slides.length;

  const idSignature = useMemo(
    () => slides.map((s) => s.tournament.id).join('|'),
    [slides],
  );

  // Land-time live-first: as soon as slides resolve, tell the context which
  // tours are live so it can override the stored/default tour once. The
  // context guards against re-runs after user interaction.
  const liveTourSignature = useMemo(() => {
    const set = new Set<string>();
    for (const s of slides) if (s.type === 'live') set.add(s.tournament.tourSlug);
    return Array.from(set).sort().join('|');
  }, [slides]);
  useEffect(() => {
    if (count === 0) return;
    applyLandingSelection(liveTourSignature ? liveTourSignature.split('|') : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, liveTourSignature]);

  const [activeIndex, setActiveIndex] = useState(0);

  // Track the currently-viewed tournament id so we can restore position
  // across background data refreshes. The restore effect runs FIRST (declared
  // first) so it reads the pre-refresh id before the updater overwrites it.
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (count === 0) return;
    const prevId = prevIdRef.current;
    const nextIdx = prevId ? slides.findIndex((s) => s.tournament.id === prevId) : -1;
    setActiveIndex(nextIdx >= 0 ? nextIdx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSignature]);

  useEffect(() => {
    const id = slides[activeIndex]?.tournament.id;
    if (id) prevIdRef.current = id;
  }, [activeIndex, slides]);

  // COMMAND jump: picker → hero. Find the tournament in the river; else the
  // first LIVE slide of the selected tour; else the first slide of that tour;
  // else index 0.
  useEffect(() => {
    if (count === 0) return;
    let idx = -1;
    if (selectedTournamentId) {
      idx = slides.findIndex((s) => s.tournament.id === selectedTournamentId);
    }
    if (idx < 0 && selectedTourSlug) {
      idx = slides.findIndex(
        (s) => s.tournament.tourSlug === selectedTourSlug && s.type === 'live',
      );
      if (idx < 0) {
        idx = slides.findIndex((s) => s.tournament.tourSlug === selectedTourSlug);
      }
    }
    if (idx < 0) idx = 0;
    setActiveIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionNonce]);

  const touchStartRef = useRef(0);
  const touchDeltaRef = useRef(0);

  const activeSlide = count > 0 ? slides[Math.min(activeIndex, count - 1)] : undefined;
  const viewingSlug = activeSlide?.tournament.tourSlug;
  const viewingTid = activeSlide?.tournament.id ?? null;
  const viewingLive = activeSlide?.type === 'live';

  /**
   * The board below the hero reads the ACTIVE SLIDE directly — not the debounced
   * viewing* context — so the photo on screen and the board under it can never
   * belong to different tournaments. The leaderboard query key is shared with
   * HybridHero, so this costs no extra network.
   */
  const boardTournamentId = viewingLive ? viewingTid : null;
  const { data: boardLeaderboard } = useTourLeaderboard(boardTournamentId ?? '');
  const boardEntries = boardTournamentId ? (boardLeaderboard ?? []) : [];
  const boardRound = viewingLive ? (activeSlide?.tournament.currentRound ?? null) : null;

  // DEBOUNCED display reporting (4G guard). One trailing-edge write 250ms after
  // the last swipe/jump — rapid multi-slide sweeps no longer fire pulse/OTC/TI
  // fetches per intermediate slide.
  useEffect(() => {
    const t = setTimeout(() => {
      if (viewingSlug) setViewingTourSlug(viewingSlug);
      setViewingTournamentId(viewingTid);
      setViewingIsLive(viewingLive);
    }, 250);
    return () => clearTimeout(t);
  }, [viewingSlug, viewingTid, viewingLive, setViewingTourSlug, setViewingTournamentId, setViewingIsLive]);


  const goPrev = useCallback(() => {
    if (count > 1) setActiveIndex((p) => (p - 1 + count) % count);
  }, [count]);
  const goNext = useCallback(() => {
    if (count > 1) setActiveIndex((p) => (p + 1) % count);
  }, [count]);

  const onTouchStart = (e: React.TouchEvent) => {
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
  };

  if (isLoading || count === 0) {
    return (
      <div
        style={{
          height,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${INK_TINT_06}, rgba(15,23,42,0.02))`,
        }}
        aria-busy={isLoading}
      />
    );
  }

  const active = slides[Math.min(activeIndex, count - 1)];
  const showCounter = count > 8;

  // Chevron UI removed per micro-brief; swipe is the sole gesture and dots
  // remain the affordance that more slides exist. goPrev/goNext are retained
  // for keyboard/a11y and COMMAND-jump paths.
  void goPrev;
  void goNext;


  return (
    <>
    <div
      style={{ position: 'relative', width: '100%', height }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >

      <AnimatePresence mode="wait">
        <motion.div
          key={active.tournament.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ height: '100%' }}
        >
          <HybridHero
            slide={active}
            activeTournamentId={active.tournament.id}
            onSelectTour={NOOP}
          />
        </motion.div>
      </AnimatePresence>



      {/* The live board EXTENDS the hero downward. It tracks the active slide and
          cross-fades in place on swipe; on a results or upcoming slide it renders
          nothing at all and the page below moves up. No collapse control. */}

    </div>

    {/* The live board EXTENDS the hero downward. It tracks the active slide and
        cross-fades in place on swipe; on a results or upcoming slide it renders
        nothing at all and the page below moves up. No collapse control. */}
    <AnimatePresence mode="wait" initial={false}>
      {boardTournamentId && boardRound != null && boardEntries.length > 0 && (
        <motion.div
          key={boardTournamentId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <HeroBoardSection
            tournamentId={boardTournamentId}
            entries={boardEntries as any[]}
            currentRound={boardRound}
            onFullLeaderboard={() => {
              const target = tournamentRoute(boardTournamentId, { kind: 'overview' });
              navigate(target.to, { state: target.state });
            }}
            onRowTap={(playerId) =>
              analyticsEvents.track('hero_board_row_tap', {
                tournament_id: boardTournamentId,
                round: boardRound,
                player_id: playerId,
              })
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );

}

export default OverviewHero;
