/**
 * HybridHero — unified Tour Hub Overview hero.
 * Three-band architecture: PhotoBand (310px) + MiddleBand (40-62px) + LeaderboardBand.
 * Replaces EditorialLiveHero / EditorialResultsHero / EditorialUpcomingHero.
 *
 * §2.1 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';

import { PhotoBand } from './HybridHeroBands/PhotoBand';
import { MiddleBand } from './HybridHeroBands/MiddleBand';
import { LeaderboardBand } from './HybridHeroBands/LeaderboardBand';
import { HeroWireTicker } from './HybridHeroBands/HeroWireTicker';
import { setHeroFullBleed } from '../../_shared/heroFullBleedSignal';
import { formatMonthDay } from '@/i18n/format';
import { useAIPredictions } from '../../hooks/useAIPredictions';
import {
  deriveHeroState,
  detectTopTie,
  deriveTickerRows,
  fmtScore,
  todayFromEntry,
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
  const { t } = useTranslation('tourhub');
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

  // Upcoming · far fallback chain  +  Live pre-play fallback (empty leaderboard)
  const isLive = kind === 'live';
  const isLeaderboardEmpty = !Array.isArray(leaderboard) || leaderboard.length === 0;
  const fallbackEnabled = (isUpcoming && !defendingChamp) || (isLive && isLeaderboardEmpty);
  const { data: fieldStrength } = useTournamentFieldStrength(fallbackEnabled ? tournament.id : null);
  const { data: courseStats } = useTournamentCourseStats(isUpcoming && !defendingChamp ? tournament.id : null);


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

    const resolveWinnerAvatarCandidates = (name?: string | null): string[] =>
      resolvePlayerAvatarCandidates({
        name: name ?? '',
        photoUrl: tournament.winnerPhotoUrl ?? top?.player?.photo_url ?? null,
        tourSlug: tournament.tourSlug ?? 'pga',
      });

    if (winnerName) {
      return {
        name: winnerName,
        country: (top?.player?.country_code as string | undefined) ?? undefined,
        score: tournament.winnerScore || (top ? fmtScore(top.score) : '—'),
        avatarUrl: resolveWinnerAvatarCandidates(winnerName)[0] ?? null,
        avatarCandidates: resolveWinnerAvatarCandidates(winnerName),
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
      avatarUrl: resolveWinnerAvatarCandidates(topName)[0] ?? null,
      avatarCandidates: resolveWinnerAvatarCandidates(topName),
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
      teamName: team.abbr_name || team.display_name || t('overview.hybridHero.teamFallback'),
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
      avatarCandidates: resolvePlayerAvatarCandidates({
        name: f.name,
        photoUrl: f.photoUrl ?? null,
        tourSlug: tournament.tourSlug ?? 'pga',
      }),
    }));
  }, [state, lastYearTop4, tournament.tourSlug]);

  const showFirstYearPlaceholder =
    state.kind === 'upcoming' &&
    state.variant === 'far' &&
    !lastYearFinishers &&
    lastYearTop4 === null;

  // CTA navigation
  const onCtaTap = () => {
    if (state.kind === 'results' && state.variant === 'cancelled') {
      navigate('/tourhub');
      return;
    }
    if (state.kind === 'live') {
      navigate(`/tourhub/tournament/${tournament.id}`);
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
      ? `${formatMonthDay(startD).toUpperCase()} \u2013 ${endD.getDate()}`
      : endD
        ? formatMonthDay(endD).toUpperCase()
        : null;
  const isPseudoMajor = tournament.tourSlug === 'major';
  const tourLabel = isPseudoMajor
    ? t('overview.hybridHero.majorChampionship')
    : tournament.tourName || tournament.tourSlug?.toUpperCase() || null;
  // Same-tour majors (Evian on LPGA, Senior PGA on CHAMP, etc.) get a small
  // gold "MAJOR" tag next to the eyebrow — no relocation, cosmetic only.
  const showMajorTag = !isPseudoMajor && tournament.isMajor;

  // v11 composition: PhotoBand + HeroWireTicker for live/results/upcoming.
  // Legacy three-band path (PhotoBand + MiddleBand + LeaderboardBand) is
  // retained only for the cancelled variant.
  const isCancelled = state.kind === 'results' && state.variant === 'cancelled';

  // Signal the surrounding page when this hero is rendering the full-bleed
  // variant. Used by TourHubMainPage to drop chrome padding + engage the
  // transparent-chrome overlay.
  const isFullBleedCinematic = !isCancelled;
  useEffect(() => {
    setHeroFullBleed(isFullBleedCinematic);
    return () => setHeroFullBleed(false);
  }, [isFullBleedCinematic]);

  // AI predictions — shared cache with TIPicksCarousel. Only requested for
  // upcoming / live states; results state renders champion+leaderboard and
  // doesn't consume predictions data.
  const needsPredictions = state.kind === 'upcoming' || state.kind === 'live';
  const { data: aiData } = useAIPredictions(needsPredictions ? tournament.id : null);
  const insight =
    (aiData?.courseAnalysis?.insight && aiData.courseAnalysis.insight.trim()) || null;
  const upcomingContenders = useMemo(() => {
    if (state.kind !== 'upcoming' || !aiData?.topContenders) return [];
    return [...aiData.topContenders]
      .sort((a, b) => (a.worldRanking ?? 999) - (b.worldRanking ?? 999))
      .slice(0, 10)
      .map((c) => ({
        playerName: c.playerName,
        worldRanking: c.worldRanking ?? null,
        country: (c as any).country ?? null,
      }));
  }, [state.kind, aiData]);

  // Derive leader-row data for live state.
  const leaderRow = useMemo(() => {
    if (state.kind !== 'live') return null;
    const top: any = safeLeaderboard[0];
    if (!top) return null;
    const p = top.player;
    const name = p?.full_name || `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || '—';
    const today = todayFromEntry(top);
    const totalScore = typeof top.score === 'number' ? top.score : null;
    const thruRaw = top.thru;
    const thruLabel =
      thruRaw != null && thruRaw !== ''
        ? typeof thruRaw === 'number'
          ? `THRU ${thruRaw}`
          : String(thruRaw)
        : today != null
          ? `${fmtScore(today)} TODAY`
          : null;
    return {
      name,
      score: totalScore != null ? fmtScore(totalScore) : null,
      thru: thruLabel,
      photoUrl: p?.photo_url ?? null,
      tourCode: tournament.tourSlug ?? 'pga',
      tiedCount: tiedLeaders?.count ?? null,
    };
  }, [state.kind, safeLeaderboard, tournament.tourSlug, tiedLeaders]);

  // Compute champion "wonBy" margin from leaderboard.
  const championWithMargin = useMemo(() => {
    if (!champion) return null;
    const first: any = safeLeaderboard[0];
    const second: any = safeLeaderboard[1];
    let wonBy: string | null = null;
    if (
      first &&
      second &&
      typeof first.score === 'number' &&
      typeof second.score === 'number' &&
      !champion.playoffWin
    ) {
      const diff = second.score - first.score;
      if (diff > 0) wonBy = diff === 1 ? '1 shot' : `${diff} shots`;
    }
    return { ...champion, wonBy };
  }, [champion, safeLeaderboard]);

  const defenderRow = useMemo(() => {
    if (state.kind !== 'upcoming' || !defendingChamp) return null;
    return {
      name: defendingChamp.name,
      photoUrl: (defendingChamp as any).photoUrl ?? null,
      year: defendingChamp.year ?? null,
      tourCode: tournament.tourSlug ?? 'pga',
    };
  }, [state.kind, defendingChamp, tournament.tourSlug]);

  if (!isCancelled) {
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
          tourLabel={tourLabel}
          state={state}
          venueName={tournament.venueName}
          venueCity={tournament.venueCity}
          venueImageUrl={venueImageUrl}
          datesString={datesString}
          isMajor={tournament.isMajor}
          isPseudoMajor={isPseudoMajor}
          insight={insight}
          champion={championWithMargin ?? null}
          leader={leaderRow}
          defender={defenderRow}
          onTournamentTap={onCtaTap}
        />
        <HeroWireTicker
          state={state}
          leaderboard={safeLeaderboard}
          upcomingContenders={upcomingContenders}
        />
      </div>
    );
  }

  // Cancelled — legacy three-band path.
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
        tourLabel={tourLabel}
        state={state}
        venueName={tournament.venueName}
        venueCity={tournament.venueCity}
        venueImageUrl={venueImageUrl}
        datesString={datesString}
        isMajor={tournament.isMajor}
        isPseudoMajor={isPseudoMajor}
        onTournamentTap={onCtaTap}
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
