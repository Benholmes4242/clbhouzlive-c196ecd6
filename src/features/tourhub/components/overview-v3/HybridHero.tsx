import { overviewQueryReady, useOverviewBandReady, OverviewReadinessBand } from './overviewShells';
/** Tour Overview's photographic hero. Renders the HeroState it is GIVEN (OverviewHero derives it once).
 *  BUILD_TOUR_BUTTONS_UNDER_HERO §3: the "Full board ›" kicker link is gone in
 *  EVERY state — the Full leaderboard button under the board (OverviewHero)
 *  does the navigation. The champion block no longer renders here either: it
 *  follows the tour chip row (OverviewChampionBlock, useOverviewChampion.ts).
 *  This component still needs the champion itself: the closing round feeds
 *  the photo sentence and showChampion drops it. */
import { useMemo } from 'react';
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
import { earliestTeeTime, fieldHasStarted } from '../../overview/boardStarted';
import { useTeeTimesAll } from '../../tournament-v2/data/useTeeTimesAll';
import { useOverviewChampion } from './useOverviewChampion';
import {useUpcomingOverview} from './useUpcomingOverview';
import {upcomingSentence} from './upcomingOverviewRules';
import { startWeekday } from '../../tournament-v2/data/tournamentRules';

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
  const notStarted = state.kind === 'live' && !fieldHasStarted(rows);
  const currentTeesQuery = useTeeTimesAll(tournament.id, state.kind === 'live' ? state.round : 1, { enabled: notStarted });
  const currentTees = currentTeesQuery.data;
  useOverviewBandReady('photo', overviewQueryReady(currentTeesQuery, notStarted));
  const firstTeeTime = notStarted ? earliestTeeTime(currentTees) : null;

  const leader = isInPlayState(state) ? buildLeaderTrio(rows, needsInitials, tournament.tourSlug, t) : null;

  const dates = tournament.startDate ? formatOverviewDateRange(tournament.startDate, tournament.endDate) : null;

  // Merged Airy: the photo owns the one sentence in every state. The
  // champion strip retains its identity/score, never a duplicate narrative.
  const upcoming = useUpcomingOverview(state.kind === 'upcoming' ? tournament.id : null);
  const situation = state.kind === 'upcoming' ? upcomingSentence(upcoming.last, upcoming.field, upcoming.first, upcoming.zone) : situationSegments({
        state,
        entries: rows,
        scheduledRounds: roundsFromSchedule(tournament.startDate, tournament.endDate),
        headline: tournamentHeadlineSegments({ tournament, state, leaderboard: rows, t, firstTeeTime, closingRound: champion?.closingRound }),
        t,
      });
  const situationNote = visibleSituationNote(tournament.situationNote, state, tournament.endDate, now);

  // ONE ZONE: the overview's full weekday resolves in the FIRST TEE cell's zone.
  const startDay = startWeekday(tournament.startDate, upcoming.zone);

  return (
    <PhotoBand
      title={tournament.name}
      venueName={tournament.venueName}
      datesString={dates}
      venueImageUrl={venueImageUrl}
      state={state}
      tourLabel={tournament.tourName || tournament.tourSlug?.toUpperCase() || null}
      leader={leader}
      countdown={state.kind === 'upcoming' ? getOverviewCountdown(tournament.startDate, now) : []}
      startDay={startDay}
      heightPx={OVERVIEW_PHOTO_BAND_HEIGHT}
      onOpen={onOpenTournament}
      /* A finished event with a champion drops the sentence — the champion
         block (below the tour chip row) tells the story. */
      segments={showChampion ? [] : situation}
      note={situationNote}
    />
  );
}

export default HybridHero;
