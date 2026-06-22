/**
 * HybridHero — unified Tour Hub Overview hero.
 * Three-band architecture: PhotoBand (310px) + MiddleBand (40-62px) + LeaderboardBand.
 * Replaces EditorialLiveHero / EditorialResultsHero / EditorialUpcomingHero.
 *
 * §2.1 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/styles/hybrid-hero.css';

import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import { useTourLeaderboard, type TourTournament } from '../../hooks/useTourHubData';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { useTournamentDefendingChamp } from '../../hooks/useTournamentDefendingChamp';
import { useTournamentLastYearTop4 } from '../../hooks/useTournamentLastYearTop4';
import { useTournamentTeeTimes } from '../../hooks/useTournamentTeeTimes';
import { useTournamentFieldStrength } from '../../hooks/useTournamentFieldStrength';

import { useTournamentCourseStats } from '../../hooks/useTournamentCourseStats';
import { tournamentRoute } from '../../routes';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';

import { PhotoBand } from './HybridHeroBands/PhotoBand';
import { MiddleBand } from './HybridHeroBands/MiddleBand';
import { LeaderboardBand } from './HybridHeroBands/LeaderboardBand';
import { CinematicFrame } from './HybridHeroBands/CinematicFrame';
import { format } from 'date-fns';
import {
  deriveHeroState,
  detectTopTie,
  deriveTickerRows,
  fmtScore,
} from './HybridHero.utils';
import { BG, INK_15 } from './HybridHero.constants';


import { SLATE_700, SLATE_800 } from '../../_shared/tokens';

// ---------- Skeleton -------------------------------------------------------

export function HybridHeroSkeleton() {
  return (
    <div style={{ background: BG, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          height: 310,
          background: `linear-gradient(180deg, ${SLATE_800} 0%, ${SLATE_700} 100%)`,
          opacity: 0.6,
        }}
      />
      <div style={{ height: 56, background: '#0F172A', opacity: 0.85 }} />
      <div style={{ flex: 1, background: BG }}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              height: i === 0 ? 64 : 48,
              borderBottom: `0.5px solid ${INK_15}`,
              background: 'linear-gradient(90deg, rgba(15,23,42,0.04) 0%, rgba(15,23,42,0.08) 50%, rgba(15,23,42,0.04) 100%)',
            }}
          />
        ))}
      </div>
    </div>
  );
}


// ---------- Component ------------------------------------------------------

export interface HybridHeroProps {
  slide: HeroSlide;
  // Pass 5
  activeTournamentId: string | null;
  onSelectTour: (tournamentId: string) => void;
}

export function HybridHero({ slide, activeTournamentId, onSelectTour }: HybridHeroProps) {
  const { tournament } = slide;
  const navigate = useNavigate();

  // 1-minute clock tick (suspended for live state — Sportradar polling drives those transitions)
  const [now, setNow] = useState(() => new Date());

  // Preliminary state derive — drives data-fetch gating and tick cadence by
  // the *visual* state (state.kind), NOT the carousel bucket (slide.type).
  // This is the fix for the "UPCOMING badge over results card" bug: one
  // source of truth (deriveHeroState) for everything visible.
  const preliminaryState = useMemo(
    () => deriveHeroState(tournament, now),
    [tournament, now]
  );
  const kind = preliminaryState.kind;

  useEffect(() => {
    if (kind === 'live') return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [kind]);

  // Course image
  const venueAdapter: TourTournament[] = useMemo(
    () =>
      tournament.venueName
        ? ([{ venue_name: tournament.venueName } as unknown as TourTournament])
        : [],
    [tournament.venueName]
  );
  const { data: imageMap } = useBatchCourseImages(venueAdapter);
  const venueImageUrl = tournament.venueName
    ? imageMap?.get(tournament.venueName) ?? null
    : null;

  // Leaderboard (live + results states, top 4 + ticker)
  const needsLeaderboard = kind !== 'upcoming';
  const { data: leaderboard = [] } = useTourLeaderboard(needsLeaderboard ? tournament.id : '');
  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];

  // Defending champion (Upcoming) + last-year top 4 + tee times
  const isUpcoming = kind === 'upcoming';
  const { data: defendingChamp } = useTournamentDefendingChamp(isUpcoming ? tournament.id : null);
  const { data: lastYearTop4 } = useTournamentLastYearTop4(isUpcoming ? tournament.id : null);

  const startMs = tournament.startDate ? new Date(tournament.startDate).getTime() : 0;
  const hoursUntilStart = startMs ? (startMs - now.getTime()) / 3_600_000 : Infinity;
  const teeTimesEnabled = isUpcoming && hoursUntilStart <= 48;
  const { data: teeTimes = [] } = useTournamentTeeTimes(tournament.id, teeTimesEnabled);

  // Upcoming · far fallback chain
  const fallbackEnabled = isUpcoming && !defendingChamp;
  const { data: fieldStrength } = useTournamentFieldStrength(fallbackEnabled ? tournament.id : null);
  const { data: courseStats } = useTournamentCourseStats(fallbackEnabled ? tournament.id : null);

  // Completed-state tournament scoring grid (champion's eagles / birdies / pars / bogeys+)
  const isResultsKind = kind === 'results';
  const winnerPlayerId = (safeLeaderboard?.[0] as any)?.player_id ?? null;
  const { data: tournamentScoring } = useTournamentScoring(tournament.id, winnerPlayerId, isResultsKind);

  // Refined state (now we know whether teeTimes are available)
  const baseState = useMemo(
    () => deriveHeroState(tournament, now, { teeTimesAvailable: teeTimes.length > 0 }),
    [tournament, now, teeTimes.length]
  );

  // Detect team event from leaderboard shape — promote results.standard → results.team
  const isTeamEvent = !!(safeLeaderboard[0] as any)?.team;
  const state = useMemo(() => {
    if (
      baseState.kind === 'results' &&
      isTeamEvent &&
      baseState.variant !== 'cancelled' &&
      baseState.variant !== 'awaiting-playoff'
    ) {
      return { ...baseState, variant: 'team' as const };
    }
    return baseState;
  }, [baseState, isTeamEvent]);

  // Ticker + tie detection
  const top10 = useMemo(() => deriveTickerRows(safeLeaderboard), [safeLeaderboard]);
  const tiedLeaders = useMemo(() => {
    // Once a tournament is decided (winner known), never show a "tied for the lead"
    // summary — a playoff/scorecard playoff has already broken the 72-hole tie.
    if (state.kind === 'results' && tournament.winnerName) return null;
    return detectTopTie(safeLeaderboard);
  }, [safeLeaderboard, state.kind, tournament.winnerName]);

  // A playoff happened if the winner's score was tied at the top of regulation.
  const wasPlayoff = useMemo(() => {
    if (state.kind !== 'results' || !tournament.winnerName) return false;
    const tie = detectTopTie(safeLeaderboard);
    return tie != null && tie.count >= 2;
  }, [state.kind, tournament.winnerName, safeLeaderboard]);

  // Champion data for results
  const champion = useMemo(() => {
    if (state.kind !== 'results') return undefined;
    const top: any = safeLeaderboard[0];
    const winnerName = tournament.winnerName;

    const resolveWinnerAvatar = (name?: string | null): string | null => {
      if (tournament.winnerPhotoUrl) return tournament.winnerPhotoUrl;
      if (top?.player?.photo_url) return top.player.photo_url;
      if (name && tournament.tourSlug) {
        try {
          return getPlayerHeadshotUrl(name, tournament.tourSlug);
        } catch { return null; }
      }
      return null;
    };

    if (winnerName) {
      return {
        name: winnerName,
        country: (top?.player?.country_code as string | undefined) ?? undefined,
        score: tournament.winnerScore || (top ? fmtScore(top.score) : '—'),
        avatarUrl: resolveWinnerAvatar(winnerName),
        playoffWin: wasPlayoff,
      };
    }
    if (!top) return undefined;
    const topName =
      top.player?.full_name ||
      `${top.player?.first_name ?? ''} ${top.player?.last_name ?? ''}`.trim();
    return {
      name: topName,
      country: top.player?.country_code,
      score: fmtScore(top.score),
      avatarUrl: resolveWinnerAvatar(topName),
      playoffWin: wasPlayoff,
    };
  }, [state, tournament, safeLeaderboard, wasPlayoff]);

  // Team winner detection
  const teamWinner = useMemo(() => {
    if (state.kind !== 'results') return null;
    const top: any = safeLeaderboard[0];
    const team = top?.team;
    if (!team) return null;
    const members = (team.members || [])
      .filter((m: any) => m.player)
      .sort((a: any, b: any) => (a.position_in_team ?? 0) - (b.position_in_team ?? 0))
      .map((m: any) => ({
        fullName:
          m.player.full_name ||
          `${m.player.first_name ?? ''} ${m.player.last_name ?? ''}`.trim(),
        photoUrl: m.player.photo_url ?? null,
      }));
    return {
      teamName: team.abbr_name || team.display_name || 'Team',
      members,
      score: fmtScore(top.score),
    };
  }, [state, safeLeaderboard]);

  // Last year top 4 — kept for cancelled fallback path
  const lastYearFinishers = useMemo(() => {
    if (state.kind !== 'upcoming' || state.variant !== 'far') return undefined;
    if (!lastYearTop4 || lastYearTop4.length === 0) return undefined;
    return lastYearTop4.map(f => ({
      rank: f.rank,
      name: f.name,
      country: f.country,
      score: f.score,
      year: f.year,
      avatarUrl: f.photoUrl,
    }));
  }, [state, lastYearTop4]);

  const showFirstYearPlaceholder =
    state.kind === 'upcoming' &&
    state.variant === 'far' &&
    !lastYearFinishers &&
    lastYearTop4 === null;

  // CTA navigation
  const onCtaTap = () => {
    if (state.kind === 'results' && state.variant === 'cancelled') {
      navigate('/tour');
      return;
    }
    const target = tournamentRoute(tournament.id);
    navigate(target.to, { state: target.state });
  };

  // Dates string for legacy three-band path
  const startD = tournament.startDate ? new Date(tournament.startDate) : null;
  const endD = tournament.endDate ? new Date(tournament.endDate) : null;
  const datesString =
    startD && endD
      ? `${format(startD, 'MMM d').toUpperCase()} – ${format(endD, 'd').toUpperCase()}`
      : endD
        ? format(endD, 'MMM d').toUpperCase()
        : null;
  const tourLabel = tournament.tourName || tournament.tourSlug?.toUpperCase() || null;

  // Direction A: CinematicFrame is the single hero surface for all three states.
  // Legacy three-band path is retained only for the cancelled variant.
  const useCinematicFrame =
    state.kind === 'live' ||
    state.kind === 'results' ||
    state.kind === 'upcoming';

  if (useCinematicFrame && !(state.kind === 'results' && state.variant === 'cancelled')) {
    return (
      <div
        style={{
          background: BG,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CinematicFrame
          title={tournament.name}
          venueName={tournament.venueName}
          venueCity={tournament.venueCity}
          venueImageUrl={venueImageUrl}
          state={state}
          tourLabel={tourLabel}
          isMajor={tournament.isMajor}
          isSignature={tournament.isSignature}
          startDate={tournament.startDate}
          endDate={tournament.endDate}
          leaderboard={safeLeaderboard}
          tiedLeaders={tiedLeaders}
          fieldSize={safeLeaderboard.length}
          top10={top10}
          tourSlug={tournament.tourSlug}
          defendingChamp={defendingChamp ?? null}
          fieldStrength={fieldStrength ?? null}
          tournamentScoring={tournamentScoring ?? null}
          venuePar={tournament.venuePar}
          venueYardage={tournament.venueYardage}
          purse={tournament.purse}
          winningShare={tournament.winningShare}
          onCtaTap={onCtaTap}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        background: BG,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PhotoBand
        title={tournament.name}
        venueName={tournament.venueName}
        venueCity={tournament.venueCity}
        venueImageUrl={venueImageUrl}
        state={state}
        tourLabel={tourLabel}
        winnerName={tournament.winnerName}
        isMajor={tournament.isMajor}
        isSignature={tournament.isSignature}
        datesString={datesString}
      />

      <MiddleBand
        state={state}
        top10={top10}
        champion={champion}
        tiedLeaders={tiedLeaders}
        defendingChamp={defendingChamp}
        fieldStrength={fieldStrength}
        courseStats={courseStats}
        teamWinner={teamWinner}
        par={tournament.venuePar ?? undefined}
        championNarrative={tournament.championNarrative}
      />
      <LeaderboardBand
        state={state}
        leaderboard={safeLeaderboard}
        tiedLeaders={tiedLeaders}
        champion={champion}
        teeTimes={teeTimes}
        lastYearFinishers={lastYearFinishers}
        firstYearEvent={showFirstYearPlaceholder}
        tourSlug={tournament.tourSlug}
        par={tournament.venuePar ?? undefined}
        defendingChampion={tournament.defendingChampion ?? null}
        fieldSize={safeLeaderboard.length}
        onCtaTap={onCtaTap}
      />
    </div>
  );
}
