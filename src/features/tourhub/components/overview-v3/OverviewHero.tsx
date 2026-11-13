import { OverviewReadinessBand, overviewQueryReady } from './overviewShells';
/**
 * OverviewHero — Hero River. The carousel crosses ALL tours in the
 * editorial order returned by useHeroCarouselData (LIVE→majors→rest).
 * Swipe changes the tournament AND the tour. The picker becomes a
  * jump-to shortcut via selectionNonce. The hero never changes the selected
  * lens. Display reporting is debounced 250ms
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
import { RailChips } from '@/components/ui/RailChips';
import { OVERVIEW_TOUR_ORDER, TOUR_LABEL, shortTournamentToken } from '../../_shared/tourOrder';
import type { TourId } from '../../hooks/useOverviewData';
import { OverviewChampionBlock } from './useOverviewChampion';
import { useOverviewFallbackSlides } from './useOverviewFallbackSlides';
import { HeroBoardSection } from './HybridHeroBands/HeroBoardBand';
import { tournamentRoute } from '../../routes';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HybridHero } from './HybridHero';
import { PHOTO_BAND_HEIGHT, OVERVIEW_PHOTO_BAND_HEIGHT } from './HybridHero.constants';
import { useTourSelection } from '../../context/TourSelectionContext';
import { OVERVIEW_HERO_LOADING_BG } from '../../_shared/tokens';
import { resolveChampionEntry } from '../../_shared/boardEntity';
import { deriveHeroState, isChampionResolvable, isInPlayState } from './HybridHero.utils';
import { boardPhaseFor, shouldShowOverviewBoard } from './HybridHeroBands/HeroBoardBand';
import { useLeaderboardRealtime } from '../../hooks/useLeaderboardRealtime';
import { useHeroFullBoard } from './useHeroFullBoard';
import { FullBoardSheet } from '../../tournament-v2/sections/FullBoardSheet';
import { hasStrokeBoard } from '../../_shared/eventFormat';
import { useOverviewRecaps, useSeasonRecap, type OverviewRecapCandidate } from './useSeasonRecap';
import { isBetweenSeasons } from './seasonRecapRules';
import { RecapPhotoBand, SeasonRecapBody } from './SeasonRecapSections';

const NOOP = () => {};

interface OverviewHeroProps {
  height?: number | string;
}

/**
 * Legacy shared news-hero height. The Tour Overview itself uses the separate
 * `OVERVIEW_HERO_TOTAL_HEIGHT`; the two news surfaces remain at 340px.
 */
export const OVERVIEW_HERO_HEIGHT = `${PHOTO_BAND_HEIGHT}px`;

/** Minimum floor for the overview hero frame (the photo band). Never the frame height: the frame follows its content. Also sizes the loading skeleton. */
export const OVERVIEW_HERO_TOTAL_HEIGHT = `${OVERVIEW_PHOTO_BAND_HEIGHT}px`;

export function OverviewHero({ height }: OverviewHeroProps) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const carouselQuery = useHeroCarouselData();
  const { data: carouselSlides = [], isLoading: carouselLoading } = carouselQuery;
  /* URGENT_FIX §3: every overview tour always has a slide. The fallback only
     fills tours the carousel lacks; useHeroCarouselData itself is unchanged. */
  const fallbackQuery = useOverviewFallbackSlides(carouselSlides, !carouselLoading);
  const { data: fallbackSlides = [], isLoading: fallbackLoading } = fallbackQuery;
  const mergedSlides = useMemo(() => [...carouselSlides, ...fallbackSlides], [carouselSlides, fallbackSlides]);
  /* SEASON RECAP (seasonRecapRules.ts): a tour between seasons shows ONE
     recap slide built from its last completed event, replacing its stale
     finished slide or a far-off upcoming slide. A live slide always wins. */
  const recapsQuery = useOverviewRecaps(!carouselLoading);
  const { data: recapCandidates } = recapsQuery;
  const recaps = useMemo(() => {
    const out = new Map<string, OverviewRecapCandidate>();
    if (!recapCandidates) return out;
    const now = new Date();
    for (const [tour, candidate] of recapCandidates) {
      const own = mergedSlides.filter((s) => s.tournament.tourSlug === tour);
      if (own.some((s) => s.type === 'live')) continue;
      const nextStart = own
        .filter((s) => s.type === 'upcoming' && s.tournament.startDate && new Date(s.tournament.startDate).getTime() >= now.getTime() - 86_400_000)
        .map((s) => s.tournament.startDate)
        .sort()[0] ?? null;
      if (isBetweenSeasons({ lastEnd: candidate.last.endDate ?? null, seasonYear: candidate.last.seasonYear ?? null, nextStart, raceFinal: candidate.raceFinal, now })) out.set(tour, candidate);
    }
    return out;
  }, [recapCandidates, mergedSlides]);
  const rawSlides = useMemo(() => {
    if (recaps.size === 0) return mergedSlides;
    const kept = mergedSlides.filter((s) => !recaps.has(s.tournament.tourSlug));
    return [...kept, ...[...recaps.values()].map((c): HeroSlide => ({ tournament: c.last, type: 'completed' }))];
  }, [mergedSlides, recaps]);
  const isLoading = carouselLoading || (fallbackLoading && carouselSlides.length === 0);


  const {
    selectedTourSlug,
    selectedTournamentId,
    selectionNonce,
    setViewingTourSlug,
    setViewingTournamentId,
    setViewingIsLive,
  } = useTourSelection();


  /**
   * THE OVERVIEW'S OWN SLIDE ORDER (BUILD_TOUR_BUTTONS_UNDER_HERO §2). The
   * carousel and the chip row under it run in OVERVIEW_TOUR_ORDER
   * (PGA → LPGA → DP World → Champions → Korn Ferry), same-tour slides live
   * first then by start date, so swiping and the buttons always agree.
   * useHeroCarouselData's own editorial order is untouched — Also this week,
   * the tournament page and news read it. Tours with no chip (LIV, the
   * pseudo-'major' slide, anything else) are DROPPED from the carousel here
   * so a swipe never lands where no chip is selected; they stay reachable
   * from the top-left island tile exactly as before.
   */
  const slides = useMemo(() => {
    const allowed = rawSlides.filter((s) =>
      (OVERVIEW_TOUR_ORDER as string[]).includes(s.tournament.tourSlug),
    );
    const rank = (s: HeroSlide) => OVERVIEW_TOUR_ORDER.indexOf(s.tournament.tourSlug as TourId);
    return [...allowed].sort((a, b) => {
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      const aLive = a.type === 'live' ? 0 : 1;
      const bLive = b.type === 'live' ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return new Date(a.tournament.startDate).getTime() - new Date(b.tournament.startDate).getTime();
    });
  }, [rawSlides]);
  const count = slides.length;

  const idSignature = useMemo(
    () => slides.map((s) => s.tournament.id).join('|'),
    [slides],
  );

  const [activeIndex, setActiveIndex] = useState(0);

  // Track the currently-viewed tournament id so we can restore position
  // across background data refreshes. The restore effect runs FIRST (declared
  // first) so it reads the pre-refresh id before the updater overwrites it.
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (count === 0) return;
    const prevId = prevIdRef.current;
    const nextIdx = prevId ? slides.findIndex((s) => s.tournament.id === prevId) : -1;
    if (nextIdx >= 0) {
      setActiveIndex(nextIdx);
      return;
    }
    if (selectedTourSlug && selectedTourSlug !== 'all') {
      const liveIdx = slides.findIndex(
        (s) => s.tournament.tourSlug === selectedTourSlug && s.type === 'live',
      );
      const tourIdx = slides.findIndex((s) => s.tournament.tourSlug === selectedTourSlug);
      setActiveIndex(liveIdx >= 0 ? liveIdx : tourIdx >= 0 ? tourIdx : 0);
      return;
    }
    setActiveIndex(0);
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
  const activeRecap = activeSlide && recaps.get(activeSlide.tournament.tourSlug)?.last.id === activeSlide.tournament.id
    ? recaps.get(activeSlide.tournament.tourSlug)!
    : null;
  const recapQuery = useSeasonRecap(
    activeRecap ? (activeRecap.last.tourSlug as TourId) : null,
    activeRecap?.seasonId ?? null,
    activeRecap?.last.seasonYear ?? null,
    activeRecap?.last.endDate ?? null,
  );

  /**
   * ONE SOURCE OF TRUTH FOR THE SLIDE'S STATE. deriveHeroState is the only
   * decision about what the on-screen slide IS; the result flows DOWN to both
   * HybridHero (photo, champion) and HeroBoardSection (board, picks).
   * `slide.type` is never consulted for this — see the bucketing note in
   * useHeroCarouselData.
   */
  const recapData = recapQuery.data;
  const [now, setNow] = useState(() => new Date());
  const heroState = useMemo(
    () => (activeSlide ? deriveHeroState(activeSlide.tournament, now) : null),
    [activeSlide, now],
  );
  const heroKind = heroState?.kind;
  useEffect(() => {
    if (!heroKind || heroKind === 'live' || heroKind === 'suspended') return;
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [heroKind]);

  const viewingLive = heroState ? isInPlayState(heroState) : false;

  /**
   * LIVE SCORES UPDATE LIVE. One server-filtered channel on sr_leaderboards for
   * the active slide's tournament, only while it is live or suspended. It
   * invalidates ['tourhub','leaderboard',tid] — the exact key the board and
   * the photo's leader read via useTourLeaderboard. Chosen over
   * useMultiLeaderboardRealtime, whose unfiltered channel would deliver every
   * leaderboard row change in the database to filter client-side, for a
   * carousel that only ever shows one slide at a time.
   */
  // Leaderboard key ONLY: see LeaderboardRealtimeOptions for the fan-out.
/* ARCHITECTURE RULE (moved from AGENTS.md): The overview hero calls useLeaderboardRealtime with invalidate: 'leaderboard', while TournamentPage keeps the default full set, because live sync rewrites every row of the field on each pass and the full set would rebuild the carousel once per row. */
  useLeaderboardRealtime(viewingLive ? viewingTid : null, { invalidate: 'leaderboard' });

  /**
   * The board below the hero reads the ACTIVE SLIDE directly — not the debounced
   * viewing* context — so the photo on screen and the board under it can never
   * belong to different tournaments. The leaderboard query key is shared with
   * HybridHero, so this costs no extra network.
   */
  // Fetch entries for LIVE and COMPLETED because the picks row resolves finishing
  // positions from them. The board also renders on completed slides (final
  // positions); boardRound is null there, so no TODAY. Same query
  // key as HybridHero.tsx, so a completed slide is a cache hit.
  const boardTournamentId = !heroState || heroState.kind === 'upcoming' || activeRecap ? null : viewingTid;
  const boardQuery = useTourLeaderboard(boardTournamentId ?? '');
  const { data: boardLeaderboard, isLoading: boardLeaderboardLoading, dataUpdatedAt: boardUpdatedAt } = boardQuery;
  const boardEntries = boardTournamentId ? (boardLeaderboard ?? []) : [];
  const boardRound = heroState && isInPlayState(heroState) ? heroState.round : null;

  /**
   * BRIEF_HERO_PICKS_ROW §1 — THE BAND MUST SURVIVE AN UPCOMING TOURNAMENT.
   * The old gate (board id + round + entries) deleted Tournament Intelligence
   * on upcoming slides, which is the phase where the picks matter most. The
   * band now mounts for ANY slide and decides for itself: with no board it
   * renders the picks row alone, and with neither a board nor picks it returns
   * null — no placeholder, no reserved height (HeroBoardBand).
   */
  const bandTournamentId = viewingTid;
  const bandPhase = heroState ? boardPhaseFor(heroState) : 'upcoming';
  const championGate = heroState ? isChampionResolvable(heroState) : false;
  const fullBoardAvailable = !!boardTournamentId && hasStrokeBoard(activeSlide?.tournament.eventType ?? null) && shouldShowOverviewBoard(boardEntries);
  const fullBoard = useHeroFullBoard(boardTournamentId, !!heroState && isInPlayState(heroState), fullBoardAvailable);


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

  const openTournament = useCallback(() => {
    if (!viewingTid || Math.abs(touchDeltaRef.current) > 10) return;
    const target = tournamentRoute(viewingTid, { kind: 'overview' });
    navigate(target.to, { state: target.state });
  }, [navigate, viewingTid]);

  /**
   * THE TOUR CHIP ROW (BUILD_TOUR_BUTTONS_UNDER_HERO §1). One canonical
   * RailChips chip per slide, in slide order. A tour with two slides in a
   * week labels each "{TOUR} · {shortTournamentToken(name)}" so the pair is
   * distinguishable. Tapping a chip is EXACTLY a swipe to that slide: the
   * same setActiveIndex path, and the debounced display reporting below does
   * the viewing* updates precisely as a swipe does. Tapping the selected chip
   * does nothing.
   */
  const chipOptions = useMemo(() => {
    const perTour = new Map<string, number>();
    slides.forEach((s) => perTour.set(s.tournament.tourSlug, (perTour.get(s.tournament.tourSlug) ?? 0) + 1));
    return slides.map((s) => {
      const base = TOUR_LABEL[s.tournament.tourSlug as TourId] ?? s.tournament.tourName;
      const label = (perTour.get(s.tournament.tourSlug) ?? 0) > 1
        ? `${base} · ${shortTournamentToken(s.tournament.name)}`
        : base;
      return { id: s.tournament.id, label };
    });
  }, [slides]);

  const chipRowRef = useRef<HTMLDivElement>(null);
  const onChipChange = useCallback(
    (id: string) => {
      const idx = slides.findIndex((s) => s.tournament.id === id);
      if (idx >= 0 && idx !== activeIndex) setActiveIndex(idx);
    },
    [slides, activeIndex],
  );

  /* The selected chip ALWAYS follows the active slide — swipe, island jump or
     first load — and scrolls fully into view without moving the page. */
  useEffect(() => {
    const row = chipRowRef.current?.firstElementChild as HTMLElement | null;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !chip) return;
    const left = chip.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < row.scrollLeft) {
      row.scrollTo({ left: left - 20, behavior: 'smooth' });
    } else if (right > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: right - row.clientWidth + 20, behavior: 'smooth' });
    }
  }, [activeIndex, idSignature]);

  const firstPaintReady = overviewQueryReady(carouselQuery) && overviewQueryReady(fallbackQuery, !carouselLoading && OVERVIEW_TOUR_ORDER.some(tour => !carouselSlides.some(slide => slide.tournament.tourSlug === tour))) && overviewQueryReady(recapsQuery, !carouselLoading) && overviewQueryReady(boardQuery, !!boardTournamentId) && overviewQueryReady(recapQuery, !!activeRecap && activeRecap.last.seasonYear != null && !!activeRecap.last.endDate);
  if (isLoading || count === 0 || !heroState) {
    return (
<OverviewReadinessBand id="hero" hero base={firstPaintReady} expect={[]}><div
        style={{
          height,
          borderRadius: 20,
          background: OVERVIEW_HERO_LOADING_BG,
        }}
        aria-busy={isLoading}
      /></OverviewReadinessBand>
    );
  }

  const active = slides[Math.min(activeIndex, count - 1)];
  // Champion gate — same rule as HybridHero's strip and the pick trophy:
  // a genuinely finished state AND an authoritative winner.
  const activeChampionEntry = championGate && !active.tournament.winnerName
    ? resolveChampionEntry(boardEntries, {
        winner_id: active.tournament.winnerId,
        // sr_tournaments.event_type, carried on the slide — never inferred from rows.
        event_type: active.tournament.eventType,
      })
    : null;
  const activeChampionMemberIds = activeChampionEntry?.team?.members
    ?.map((member) => member.player?.id)
    .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0) ?? [];
  // The frame follows its content in every state (URGENT_FIX §1): no floor
  // above the active band's own height, so no canvas gap under the photo.
  // The wait-mode crossfade mounts the entering band as the exiting one
  // leaves, so it needs no floor. An explicit `height` prop still sizes a slot.
  const activeHeroHeight = height ?? 'auto';

  // Chevron UI removed per micro-brief; swipe is the sole gesture. goPrev and
  // goNext are NOT wired to anything today (no keyboard or a11y control).

  void goPrev;
  void goNext;


  return (
<OverviewReadinessBand key={active.tournament.id} id="hero" hero base={firstPaintReady} expect={activeRecap ? ['recapRecord'] : ['photo', 'champion', 'band', ...(heroState.kind === 'upcoming' ? ['upcoming'] : [])]}>
    <div
      data-overview-hero-frame
      style={{
        position: 'relative',
        width: '100%',
        height: activeHeroHeight,
      }}
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
          style={{ height: activeHeroHeight === 'auto' ? 'auto' : '100%' }}
        >
          {activeRecap ? (
            <RecapPhotoBand slide={active} state={heroState} data={recapData} onOpen={openTournament} />
          ) : <HybridHero
            slide={active}
            state={heroState}
            now={now}
            activeTournamentId={active.tournament.id}
            onSelectTour={NOOP}
            onOpenTournament={openTournament}
          />}
        </motion.div>
      </AnimatePresence>



    </div>

    {/* THE TOUR CHIP ROW — directly under the photo band in EVERY state,
        above whatever comes first (movers on live, the champion block on
        finished, the upcoming facts and picks on upcoming). It does NOT
        cross-fade with the slide: it stays put while the content below
        changes. The row scrolls horizontally, never wraps, and runs to the
        screen's right edge so the next chip peeks in. */}
    {/* URGENT_FIX §2: on finished events the champion block sits straight
        off the photo, ABOVE the tour buttons. Renders nothing otherwise. */}
    {activeRecap ? null : <OverviewChampionBlock slide={active} state={heroState} />}

    <div ref={chipRowRef} data-overview-chip-row>
      <RailChips
        options={chipOptions}
        value={active.tournament.id}
        onChange={onChipChange}
        ariaLabel="Tour"
        toggleSemantics
        fill
        className="overview-tour-chips"
      />
    </div>

    {/* The band EXTENDS the hero downward. It tracks the active slide and
        cross-fades in place on swipe. On a live or completed slide it carries
        the board; on an upcoming slide the upcoming facts and picks.
        CB57 removes the action and next-round rows without reserving space. */}
    <AnimatePresence mode="wait" initial={false}>
      {bandTournamentId && activeRecap ? (
        <motion.div key={`recap-${bandTournamentId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <SeasonRecapBody tour={activeRecap.last.tourSlug as TourId} year={activeRecap.last.seasonYear ?? new Date().getUTCFullYear()} data={recapData} />
        </motion.div>
      ) : bandTournamentId && (
        <motion.div
          key={bandTournamentId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <HeroBoardSection
            tournamentId={bandTournamentId}
            eventName={activeSlide?.tournament.name}
            eventTourCode={activeSlide?.tournament.pickTourCode}
            eventSeasonYear={activeSlide?.tournament.seasonYear}
            entries={boardEntries}
            onFullBoard={fullBoardAvailable ? fullBoard.onOpen : undefined}
            boardUpdatedAt={boardUpdatedAt}
            leaderboardLoading={boardLeaderboardLoading}
            eventType={activeSlide?.tournament.eventType ?? null}
            currentRound={boardRound}
            totalRounds={heroState && isInPlayState(heroState) ? heroState.totalRounds : null}
            phase={bandPhase}
            /* The SAME champion the strip crowns: only passed once the winner
               gate has resolved a name, so a pending playoff marks nobody. */
            championSrId={
              championGate && activeSlide?.tournament.winnerName
                ? activeSlide.tournament.winnerId
                : null
            }
            championPlayerIds={championGate ? activeChampionMemberIds : []}
            venuePar={activeSlide?.tournament.venuePar ?? null}
            venueYardage={activeSlide?.tournament.venueYardage ?? null}
            purse={activeSlide?.tournament.purse ?? null}
            onRowTap={(playerId) =>
              analyticsEvents.track('hero_board_row_tap', {
                tournament_id: bandTournamentId,
                round: boardRound ?? 0,
                player_id: playerId,
              })
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
    {fullBoardAvailable && boardTournamentId ? <FullBoardSheet open={fullBoard.open} onClose={fullBoard.onClose} tournamentId={boardTournamentId} meta={fullBoard.meta} entries={boardEntries} /> : null}
    </OverviewReadinessBand>
  );

}

export default OverviewHero;
