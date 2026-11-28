import { isSkinsGame } from '../../skins/skinsRules';
import { useSkinsGame } from '../../skins/useSkinsGame';
import { skinsBand } from '../../skins/skinsHero';
import { overviewQueryReady, useOverviewBandReady, OverviewReadinessBand } from './overviewShells';
/** Tour Overview's photographic hero. Renders the HeroState it is GIVEN (OverviewHero derives it once).
 *  BUILD_TOUR_BUTTONS_UNDER_HERO §3: the "Full board ›" kicker link is gone in
 *  EVERY state — the Full leaderboard button under the board (OverviewHero)
 *  does the navigation. The champion block no longer renders here either: it
 *  follows the tour chip row (OverviewChampionBlock, useOverviewChampion.ts).
 *  This component still needs the champion itself: the closing round feeds
 *  the photo sentence and showChampion drops it. */
import { useMemo, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/hybrid-hero.css';

import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { PhotoBand, type HeroLeaderTrio, type OverviewCountdownUnit } from './HybridHeroBands/PhotoBand';
import { countInWords } from './overviewTokens';
import { isInPlayState, type HeroState } from './HybridHero.utils';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { OVERVIEW_PHOTO_BAND_HEIGHT } from './HybridHero.constants';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { resolveBoardEntity } from '../../_shared/boardEntity';
import { situationSegments, visibleSituationNote } from '../../overview/situationCopy';
import { roundsFromSchedule } from './HybridHero.utils';
import { tournamentHeadlineSegments } from '../../overview/magazineCopy';
import { useOverviewChampion } from './useOverviewChampion';
import {useUpcomingOverview} from './useUpcomingOverview';
import {upcomingSentence, venueTee} from './upcomingOverviewRules';
import { useOverviewRoundState } from './useOverviewRoundState';
import { effectiveCurrentRound } from './liveStateRules';
import { formatTimeHm24 } from '@/i18n/format';
import { startDayForm } from '../../tournament-v2/data/tournamentRules';
import { OverviewHybridPhoto, overviewSkinsCard } from './OverviewHybridPhoto';
import { HybridGlassCard, HybridPhotoFrame } from './HybridPhotoFrame';

export interface HybridHeroProps {
  slide: HeroSlide;
  /** The ONE state decision for this slide, derived in OverviewHero. */
  state: HeroState;
  /** Clock the state was derived against; drives the countdown. */
  now: Date;
  activeTournamentId: string | null;
  onSelectTour: (tournamentId: string) => void;
  onOpenTournament: () => void;
}

export function getOverviewCountdown(startDate: string, now = new Date()): OverviewCountdownUnit[] {
  const start = new Date(startDate).getTime();
  if (!Number.isFinite(start)) return [];
  const minutes = Math.max(0, Math.floor((start - now.getTime()) / 60_000));
  if (minutes < 60) return [{ value: minutes, label: 'minutes' }];
  if (minutes < 1_440) return [{ value: Math.floor(minutes / 60), label: 'hours' }];
  return [{ value: Math.floor(minutes / 1_440), label: 'days' }];
}

export function formatOverviewDateRange(startDate: string, endDate?: string | null): string | null {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  const day = (date: Date) => new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date);
  const month = (date: Date) => new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
  if (!endDate) return `${day(start)} ${month(start)}`;
  // Brief 47: a one-day event reads "27 Nov", never "27–27 Nov".
  if (startDate.slice(0, 10) === endDate.slice(0, 10)) return `${day(start)} ${month(start)}`;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return `${day(start)} ${month(start)}`;
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${day(start)}–${day(end)} ${month(end)}`;
  }
  return [
    `${day(start)} ${month(start)}`,
    `${day(end)} ${month(end)}`,
  ].join(' – ');
}

/**
 * A.2 THE LEADER TRIO: faces (at most three), the score, one caps line.
 * The caps line states the TRUE count of a tie, however many faces show.
 * Null unless the board has a sole or shared first with a score.
 */
export function buildLeaderTrio(
  rows: BoardEntry[],
  needsInitials: boolean,
  tourSlug: string | null | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string,
): HeroLeaderTrio | null {
  const top = rows[0];
  if (top?.position !== 1 || top.score == null) return null;
  const leaders = rows.filter((entry) => entry.position === 1);
  return {
    score: top.score,
    faces: leaders.slice(0, 3).map((entry) => {
      const name = entry.team
        ? resolveBoardEntity(entry, needsInitials).prose || ''
        : entry.player?.full_name?.trim() || '';
      return {
        key: entry.id,
        name,
        candidates: entry.team ? [] : resolvePlayerAvatarCandidates({ name, photoUrl: entry.player?.photo_url ?? null, tourSlug }),
      };
    }),
    caps: leaders.length > 1
      ? t('overview.hero.tiedCaps', { words: countInWords(leaders.length, t) })
      : top.team
        ? resolveBoardEntity(top, needsInitials).prose || null
        : top.player?.full_name?.trim().split(/\s+/).slice(-1)[0] ?? null,
  };
}

export function HybridHero({ slide, state, now, onOpenTournament }: HybridHeroProps) {
  const { tournament } = slide;
  const { t } = useTranslation('tourhub');

  // CB55: the ONE Tour course-photo resolver, keyed by tournament id — the
  // same resolution Tournament Detail gets for this tournament. The venue
  // fields feed the live catalogue search for unlinked, unsaved venues.
  const venueAdapter = useMemo(
    () => tournament.id ? [{
      id: tournament.id,
      venue_name: tournament.venueName,
      venue_course_name: tournament.venueCourseName,
      venue_city: tournament.venueCity,
      venue_state: tournament.venueState,
      venue_country: tournament.venueCountry,
    }] : [],
    [tournament.id, tournament.venueName, tournament.venueCourseName, tournament.venueCity, tournament.venueState, tournament.venueCountry],
  );
  const { data: imageMap } = useBatchCourseImages(venueAdapter);
  const venueImageUrl = tournament.id ? imageMap?.get(tournament.id) ?? null : null;

  /* The shared champion derivation (useOverviewChampion.ts) owns the board
     read; the same rows feed the leader trio and the situation sentence. */
  const { rows, needsInitials, champion, showChampion } = useOverviewChampion(slide, state);

  // Live before anyone tees off: the situation names the first tee time, read
  // from the same tee-time source LeadersGroup uses.
  // One round for every label: the provider's round capped by the scores.
  const roundState: HeroState = useMemo(() => state.kind === 'live' || state.kind === 'suspended'
    ? { ...state, round: effectiveCurrentRound(state.round, rows) } : state, [state, rows]);
  const shared = useOverviewRoundState(tournament, roundState, rows, now);
  const { notStarted = false, afterRound = null, delayedRound = null, firstTeeTime = null } = shared.result ?? {};
  const zone = shared.meta?.course_timezone ?? shared.meta?.timezone ?? null;
  useOverviewBandReady('photo', overviewQueryReady(shared.teeQuery, shared.result?.wantTees ?? false));

  const leader = isInPlayState(roundState) && !notStarted ? buildLeaderTrio(rows, needsInitials, tournament.tourSlug, t) : null;
  /* Live states: AFTER ROUND n between rounds; the first tee in the leader slot before anyone starts. */
  const firstTee = firstTeeTime ? venueTee(firstTeeTime, zone)?.time ?? formatTimeHm24(firstTeeTime) : null;

  const dates = tournament.startDate ? formatOverviewDateRange(tournament.startDate, tournament.endDate) : null;

  // Merged Airy: the photo owns the one sentence in every state. The
  // champion strip retains its identity/score, never a duplicate narrative.
  const upcoming = useUpcomingOverview(state.kind === 'upcoming' ? tournament.id : null);
  const situation = state.kind === 'upcoming' ? upcomingSentence(upcoming.last, upcoming.field, upcoming.first, upcoming.zone) : situationSegments({
        state: roundState,
        entries: rows,
        scheduledRounds: roundsFromSchedule(tournament.startDate, tournament.endDate),
        headline: tournamentHeadlineSegments({ tournament, state: roundState, leaderboard: rows, t, firstTeeTime, closingRound: champion?.closingRound }),
        t,
      });
  const situationNote = visibleSituationNote(tournament.situationNote, state, tournament.endDate, now);

  /* Brief 47: a featured skins game, live or finished, swaps in its skins hero. */
  const skinsOn = isSkinsGame(tournament.name) && state.kind !== 'upcoming';
  const skinsDone = state.kind === 'results';
  const tourLabel = tournament.tourName || tournament.tourSlug?.toUpperCase() || null;

  // ONE ZONE: the kicker and FIRST TEE share the six-day start decision.
  const startDay = startDayForm(tournament.startDate, upcoming.zone, now).text || null;

  const bandProps = {
      title: tournament.name,
      venueName: tournament.venueName,
      datesString: dates,
      venueImageUrl,
      state: roundState,
      tourLabel: tournament.tourName || tournament.tourSlug?.toUpperCase() || null,
      leader,
      countdown: state.kind === 'upcoming' ? getOverviewCountdown(tournament.startDate, now) : [],
      startDay,
      heightPx: OVERVIEW_PHOTO_BAND_HEIGHT,
      onOpen: onOpenTournament,
      segments: showChampion ? [] : situation,
      note: situationNote,
      afterRound,
      delayedRound,
      firstTee,
      pauseSpine: true,
  };
  /* Brief 47 fix: only a skins game mounts the skins read, so standard heroes never call it. */
  if (skinsOn) return <SkinsPhotoBand bandProps={bandProps} tournamentId={tournament.id} rows={rows} finished={skinsDone} championId={tournament.winnerId ?? null} tourLabel={tourLabel} tourSlug={tournament.tourSlug} />;

  return (
    <OverviewHybridPhoto tournament={tournament} state={roundState} rows={rows} image={venueImageUrl} dates={dates} startDay={startDay} roundState={shared.result ?? null} first={upcoming.first} zone={zone ?? upcoming.zone} fieldSize={state.kind === 'upcoming' ? upcoming.field.length : rows.length} countdown={state.kind === 'upcoming' ? getOverviewCountdown(tournament.startDate, now) : []} onOpen={onOpenTournament} />
  );
}

/** Brief 47: the skins-only hero wrapper; owns the skins read. */
function SkinsPhotoBand({ bandProps, tournamentId, rows, finished, championId, tourLabel, tourSlug }: { bandProps: ComponentProps<typeof PhotoBand>; tournamentId: string; rows: Parameters<typeof useSkinsGame>[1]; finished: boolean; championId: string | null; tourLabel: string | null; tourSlug: string | null | undefined }) {
  const skins = useSkinsGame(tournamentId, rows, true, 0, { finished, championId });
  return <SkinsHybridPhoto bandProps={bandProps} rows={rows} result={skins.result} finished={finished} championId={championId} tourSlug={tourSlug ?? 'pga'} />;
}

function SkinsHybridPhoto({ bandProps, rows, result, finished, championId, tourSlug }: { bandProps: ComponentProps<typeof PhotoBand>; rows: BoardEntry[]; result: ReturnType<typeof useSkinsGame>['result']; finished: boolean; championId: string | null; tourSlug: string }) {
  const card = result ? overviewSkinsCard(result, rows, tourSlug, finished, championId) : null;
  return <HybridPhotoFrame title={bandProps.title} kicker={`${bandProps.tourLabel ?? ''} · ${finished ? 'FINAL' : 'SKINS GAME · LIVE'}`} tone={finished ? 'dim' : bandProps.state.kind === 'suspended' ? 'suspended' : 'live'} image={bandProps.venueImageUrl} venue={[bandProps.venueName, bandProps.datesString].filter(Boolean).join(' · ')} card={card ? <HybridGlassCard card={card} /> : null} onOpen={bandProps.onOpen ?? (() => {})} stateKey={bandProps.state.kind} />;
}

export default HybridHero;
