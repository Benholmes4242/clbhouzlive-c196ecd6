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
import { tournamentRoute } from '../../routes';

import { PhotoBand } from './HybridHeroBands/PhotoBand';
import { MiddleBand } from './HybridHeroBands/MiddleBand';
import { LeaderboardBand } from './HybridHeroBands/LeaderboardBand';
import {
  deriveHeroState,
  detectTopTie,
  deriveTickerRows,
  fmtScore,
} from './HybridHero.utils';
import { BG, INK_15 } from './HybridHero.constants';

// ---------- Skeleton -------------------------------------------------------

export function HybridHeroSkeleton() {
  return (
    <div style={{ background: BG, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          height: 310,
          background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
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

// ---------- Tour label helper ----------------------------------------------

const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA TOUR',
  liv: 'LIV GOLF',
  euro: 'DP WORLD',
  lpga: 'LPGA',
  champ: 'CHAMPIONS',
  pgad: 'KORN FERRY',
};

// ---------- Component ------------------------------------------------------

export interface HybridHeroProps {
  slide: HeroSlide;
}

export function HybridHero({ slide }: HybridHeroProps) {
  const { tournament } = slide;
  const navigate = useNavigate();

  // 1-minute clock tick (suspended for live state — Sportradar polling drives those transitions)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (slide.type === 'live') return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [slide.type]);

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

  // Leaderboard (used for live + results states, top 4 + ticker)
  const needsLeaderboard = slide.type !== 'upcoming';
  const { data: leaderboard = [] } = useTourLeaderboard(needsLeaderboard ? tournament.id : '');
  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];

  // Defending champion (Upcoming) + last-year top 4 (Upcoming · far) + tee times (Upcoming · imminent)
  const isUpcoming = slide.type === 'upcoming';
  const { data: defendingChamp } = useTournamentDefendingChamp(isUpcoming ? tournament.id : null);
  const { data: lastYearTop4 } = useTournamentLastYearTop4(isUpcoming ? tournament.id : null);

  const startMs = tournament.startDate ? new Date(tournament.startDate).getTime() : 0;
  const hoursUntilStart = startMs ? (startMs - now.getTime()) / 3_600_000 : Infinity;
  const teeTimesEnabled = isUpcoming && hoursUntilStart <= 48;
  const { data: teeTimes = [] } = useTournamentTeeTimes(tournament.id, teeTimesEnabled);

  // Derive state
  const state = useMemo(
    () => deriveHeroState(tournament, now, { teeTimesAvailable: teeTimes.length > 0 }),
    [tournament, now, teeTimes.length]
  );

  // Ticker + tie detection
  const top10 = useMemo(() => deriveTickerRows(safeLeaderboard), [safeLeaderboard]);
  const tiedLeaders = useMemo(() => detectTopTie(safeLeaderboard), [safeLeaderboard]);

  // Champion data for results
  const champion = useMemo(() => {
    if (state.kind !== 'results') return undefined;
    const winnerName = tournament.winnerName;
    if (winnerName) {
      return {
        name: winnerName,
        country: undefined as string | undefined,
        score: tournament.winnerScore || (safeLeaderboard[0] ? fmtScore(safeLeaderboard[0].score) : '—'),
        avatarUrl: tournament.winnerPhotoUrl ?? null,
        playoffWin: state.variant === 'playoff',
      };
    }
    const top = safeLeaderboard[0];
    if (!top) return undefined;
    return {
      name:
        top.player?.full_name ||
        `${top.player?.first_name ?? ''} ${top.player?.last_name ?? ''}`.trim(),
      country: top.player?.country_code,
      score: fmtScore(top.score),
      avatarUrl: top.player?.photo_url ?? null,
      playoffWin: state.variant === 'playoff',
    };
  }, [state, tournament, safeLeaderboard]);

  // Team winner detection — uses synthesized team data on safeLeaderboard[0]
  // (sr_leaderboards joins sr_teams + sr_team_players for LIV team events).
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

  // Last year top 4 (Upcoming · far). Null → first-year-event placeholder.
  const lastYearFinishers = useMemo(() => {
    if (state.kind !== 'upcoming' || state.variant !== 'far') return undefined;
    if (!lastYearTop4 || lastYearTop4.length === 0) return undefined;
    return lastYearTop4.map(f => ({
      rank: f.rank,
      name: f.name,
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
      navigate('/tour'); // schedule landing
      return;
    }
    const target = tournamentRoute(tournament.id);
    navigate(target.to, { state: target.state });
  };

  // Tour label
  const tourLabel = TOUR_LABELS[tournament.tourSlug] || tournament.tourSlug.toUpperCase();

  return (
    <div
      style={{
        background: BG,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <PhotoBand
        title={tournament.name}
        venueName={tournament.venueName}
        venueCity={tournament.venueCity}
        venueImageUrl={venueImageUrl}
        state={state}
        tourLabel={tourLabel}
      />
      <MiddleBand
        state={state}
        top10={top10}
        champion={champion}
        tiedLeaders={tiedLeaders}
        defendingChamp={defendingChamp}
        teamWinner={teamWinner}
      />
      <LeaderboardBand
        state={state}
        leaderboard={safeLeaderboard}
        tiedLeaders={tiedLeaders}
        champion={champion}
        teeTimes={teeTimes}
        lastYearFinishers={lastYearFinishers}
        firstYearEvent={showFirstYearPlaceholder}
        onCtaTap={onCtaTap}
      />
    </div>
  );
}
