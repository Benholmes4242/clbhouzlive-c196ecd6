/**
 * HybridHero — unified Tour Hub Overview hero (Lower-Third + Wire Ticker).
 *
 * Composition (all non-cancelled states):
 *   1. PhotoBand         — full-bleed venue image with bottom-anchored
 *                          editorial lower-third (state pill, insight line,
 *                          title, venue, moment chip, TOURNAMENT CTA).
 *   2. HeroWireTicker    — dark 36px marquee showing the top-10 (or T-1 tie).
 *
 * The legacy three-band path (PhotoBand + MiddleBand + LeaderboardBand) and
 * the CinematicHeroFullBleed / CinematicFrame surfaces are retained only for
 * the cancelled variant, which still wants the flat editorial column.
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
import { useAIPredictions } from '../../hooks/useAIPredictions';

import { useTournamentCourseStats } from '../../hooks/useTournamentCourseStats';
import { tournamentRoute } from '../../routes';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';

import { PhotoBand } from './HybridHeroBands/PhotoBand';
import { MiddleBand } from './HybridHeroBands/MiddleBand';
import { LeaderboardBand } from './HybridHeroBands/LeaderboardBand';
import { HeroWireTicker, type TickerFact } from './HybridHeroBands/HeroWireTicker';
import { HeroBoardBand } from './HybridHeroBands/HeroBoardBand';
import { trackEvent } from '@/lib/analytics';
import { setHeroFullBleed } from '../../_shared/heroFullBleedSignal';
import { formatMonthDay } from '@/i18n/format';
import {
  deriveHeroState,
  detectTopTie,
  deriveTickerRows,
  fmtScore,
} from './HybridHero.utils';
import { BG, INK_15 } from './HybridHero.constants';


import { SLATE_700, SLATE_800 } from '../../_shared/tokens';

/**
 * Session-lifted board preference. A member who expands the hero board once
 * finds it expanded on the next live tournament they open — until the app is
 * restarted. Deliberately module state, NOT storage: this is a preference about
 * right now, not a setting.
 */
let heroBoardExpandedSession = false;

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

  // NEW composition (Lower-Third + Wire Ticker) — used for live/results/upcoming.
  // Cancelled falls back to the legacy three-band editorial column below.
  const isCancelled = state.kind === 'results' && state.variant === 'cancelled';

  // Signal full-bleed chrome for any non-cancelled state.
  const isFullBleedCinematic = !isCancelled;
  useEffect(() => {
    setHeroFullBleed(isFullBleedCinematic);
    return () => setHeroFullBleed(false);
  }, [isFullBleedCinematic]);

  // AI insight — pulled quote surfaced in the lower-third.
  const { data: aiPredictions } = useAIPredictions(tournament.id);
  const aiInsight = aiPredictions?.courseAnalysis?.insight?.trim() || null;

  // Compute insight line by state.
  const insightLine: string | null = useMemo(() => {
    if (state.kind === 'live') {
      // Live: prefer AI insight; fall back to null (state pill already carries round label).
      return aiInsight;
    }
    if (state.kind === 'results') {
      // Results: derive the line from the actual leaderboard to avoid stale
      // editorial strings contradicting the real outcome.
      return buildResultLine() ?? aiInsight;
    }
    // Upcoming: AI course insight is the strongest tell.
    return aiInsight;

    function buildResultLine(): string | null {
      if (!champion || isTeamEvent) return null;
      const leader: any = safeLeaderboard[0];
      if (!leader) return null;
      const runner: any = safeLeaderboard[1];
      const margin =
        runner && leader && typeof runner.score === 'number' && typeof leader.score === 'number'
          ? runner.score - leader.score
          : null;
      const name = champion.name;
      const score = champion.score;
      const runnerUp =
        runner?.player?.full_name ||
        `${runner?.player?.first_name ?? ''} ${runner?.player?.last_name ?? ''}`.trim() ||
        null;

      if (wasPlayoff) {
        return t('overview.photoBand.resultPlayoff', { name, score });
      }
      if (margin !== null && margin >= 1) {
        if (runnerUp) {
          return t('overview.photoBand.resultWonBy', {
            name,
            score,
            runnerUp,
            count: margin,
          });
        }
        return t('overview.photoBand.resultClosedAt', { name, score });
      }
      return t('overview.photoBand.resultClosedAt', { name, score });
    }
  }, [state, aiInsight, champion, isTeamEvent, safeLeaderboard, wasPlayoff, t]);

  // Moment row content — hero name/score chip.
  const moment: { label: string; name: string; score: string | null } | null = useMemo(() => {
    if (state.kind === 'live') {
      const top: any = safeLeaderboard[0];
      if (!top) return null;
      const name =
        top.player?.full_name ||
        `${top.player?.first_name ?? ''} ${top.player?.last_name ?? ''}`.trim();
      if (!name) return null;
      return {
        label: t('overview.photoBand.leaderLabel'),
        name: tiedLeaders ? t('overview.leaderRow.tiedAtTop', { count: tiedLeaders.count }) : name,
        score: tiedLeaders ? tiedLeaders.score : fmtScore(top.score),
      };
    }
    if (state.kind === 'results' && champion) {
      return {
        label: t('overview.photoBand.championLabel'),
        name: champion.name,
        score: champion.score,
      };
    }
    if (state.kind === 'upcoming' && defendingChamp) {
      return {
        label: t('overview.photoBand.defendingLabel'),
        name: defendingChamp.name,
        score: defendingChamp.score || null,
      };
    }
    return null;
  }, [state, safeLeaderboard, tiedLeaders, champion, defendingChamp, t]);

  // "Awaiting the field" empty-state facts for the HeroWireTicker (Upcoming
  // only, when no field/prediction rows are available yet). Each entry is
  // optional; the wire only renders facts that exist. Zero facts ⇒ band absent.
  const emptyStateFacts: TickerFact[] | undefined = useMemo(() => {
    if (state.kind !== 'upcoming') return undefined;
    if (top10.length > 0) return undefined;
    const facts: TickerFact[] = [];
    if (datesString) facts.push({ label: t('overview.hero.teesOff'), value: datesString });
    if (tournament.venueName) facts.push({ label: t('overview.hero.venueLabel'), value: tournament.venueName });
    if (defendingChamp?.name) {
      facts.push({ label: t('overview.hero.defendsLabel'), value: defendingChamp.name, labelGold: true });
      if (defendingChamp.score && defendingChamp.year) {
        const surname = defendingChamp.name.trim().split(/\s+/).slice(-1)[0];
        facts.push({
          label: t('overview.hero.prevWinner', { year: defendingChamp.year }),
          value: surname ? `${defendingChamp.score} · ${surname}` : defendingChamp.score,
        });
      }
    }
    if (typeof tournament.purse === 'number' && tournament.purse > 0) {
      const m = tournament.purse / 1_000_000;
      const purseStr = m >= 10 ? `$${Math.round(m)}M` : `$${m.toFixed(1)}M`;
      facts.push({ label: t('overview.hero.purse'), value: purseStr });
    }
    facts.push({
      label: t('overview.leaderboardBand.fieldEyebrow').toUpperCase(),
      value: t('overview.hero.fieldAnnouncedSoon'),
      pulseLabel: true,
    });
    return facts;
  }, [state.kind, top10.length, datesString, tournament.venueName, tournament.purse, defendingChamp, t]);

  // ---- Hero board (live only) --------------------------------------------
  const [boardExpanded, setBoardExpanded] = useState(heroBoardExpandedSession);
  useEffect(() => {
    setBoardExpanded(heroBoardExpandedSession);
  }, [tournament.id]);

  // currentRound comes from the live HeroState (deriveHeroState reads
  // tournament.currentRound). No live state ⇒ no board ⇒ todayFromEntry is
  // never reached without it.
  const liveRound = state.kind === 'live' ? state.round : null;
  const boardAvailable = state.kind === 'live' && liveRound != null && safeLeaderboard.length > 0;
  const showBoard = boardAvailable && boardExpanded;

  const toggleBoard = () => {
    const next = !boardExpanded;
    heroBoardExpandedSession = next;
    setBoardExpanded(next);
    if (next) {
      trackEvent('hero_board_expanded', { tournament_id: tournament.id, round: liveRound });
    }
  };

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
        {showBoard ? (
          <HeroBoardBand
            tournamentId={tournament.id}
            entries={safeLeaderboard}
            currentRound={liveRound as number}
            onFullLeaderboard={onCtaTap}
            onRowTap={(playerId) =>
              trackEvent('hero_board_row_tap', {
                tournament_id: tournament.id,
                round: liveRound,
                player_id: playerId,
              })
            }
          />
        ) : (
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
          insight={insightLine}
          insightKind={insightLine && insightLine === aiInsight ? 'course' : 'result'}
          momentLabel={moment?.label ?? null}
          momentName={moment?.name ?? null}
          momentScore={moment?.score ?? null}
          onCtaTap={onCtaTap}
          venueCourseName={tournament.venueCourseName}
          venueState={tournament.venueState}
          venueCountry={tournament.venueCountry}
          venuePar={tournament.venuePar}
          venueYardage={tournament.venueYardage}
          purse={tournament.purse}
        />
        )}
        <HeroWireTicker
          rows={top10}
          emptyStateFacts={emptyStateFacts}
          expandable={boardAvailable}
          expanded={showBoard}
          onToggleExpanded={toggleBoard}
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
