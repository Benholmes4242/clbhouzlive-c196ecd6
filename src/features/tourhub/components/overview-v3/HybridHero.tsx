/** Tour Overview's photographic hero. Renders the HeroState it is GIVEN (OverviewHero derives it once). */
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/hybrid-hero.css';

import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import { useTourLeaderboard } from '../../hooks/useTourHubData';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { PhotoBand, type OverviewCountdownUnit } from './HybridHeroBands/PhotoBand';
import { detectTopTie, fmtScore, isChampionResolvable, isInPlayState, type HeroState } from './HybridHero.utils';
import { setHeroFullBleed } from '../../_shared/heroFullBleedSignal';
import { OVERVIEW_PHOTO_BAND_HEIGHT } from './HybridHero.constants';
import { ChampionStrip } from './HybridHeroBands/ChampionStrip';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { resolveBoardEntity, resolveChampionEntry, teamNamesNeedInitials } from '../../_shared/boardEntity';

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
  if (minutes < 1_440) {
    return [
      { value: Math.floor(minutes / 60), label: 'hours' },
      { value: minutes % 60, label: 'minutes' },
    ];
  }
  if (minutes < 2_880) {
    return [
      { value: Math.floor(minutes / 1_440), label: 'days' },
      { value: Math.floor((minutes % 1_440) / 60), label: 'hours' },
    ];
  }
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
 * CORRECTION 1 (BRIEF_TOUR_OVERVIEW_CHAMPION): score and margin are separate
 * registers. `score` is the bare fmtScore figure (coloured by getScoreColor in
 * ChampionStrip); the wonBy/playoff qualifier travels in `scoreLabel` and
 * renders beneath the score in muted caps. formatOverviewChampionScore's
 * single-string "−17 · by 2" form is withdrawn.
 */
export function overviewChampionScoreLabel(
  playoff: boolean,
  margin: number | null,
  t: (key: string, options?: { count: number }) => string,
): string | undefined {
  if (playoff) return t('overview.hero.playoff');
  if (margin != null) return t('overview.hero.wonBy', { count: margin });
  return undefined;
}

export function HybridHero({ slide, state, now, onOpenTournament }: HybridHeroProps) {
  const { tournament } = slide;
  const { t } = useTranslation('tourhub');

  useEffect(() => {
    setHeroFullBleed(true);
    return () => setHeroFullBleed(false);
  }, []);

  const venueAdapter = useMemo(
    () => tournament.id ? [{ id: tournament.id, venue_name: tournament.venueName }] : [],
    [tournament.id, tournament.venueName],
  );
  const { data: imageMap } = useBatchCourseImages(venueAdapter);
  const venueImageUrl = tournament.id ? imageMap?.get(tournament.id) ?? null : null;
  const { data: leaderboard = [] } = useTourLeaderboard(state.kind === 'upcoming' ? '' : tournament.id);
  const rows = Array.isArray(leaderboard) ? leaderboard : [];
  const top = rows[0];
  const topPosition = top?.position;
  const tiedCount = topPosition === 1
    ? rows.filter((entry) => entry.position === 1).length
    : 0;
  const tied = tiedCount > 1 ? { count: tiedCount } : null;
  const needsInitials = useMemo(() => teamNamesNeedInitials(rows), [rows]);

  const leader = isInPlayState(state) && topPosition === 1 && top?.score != null
    ? {
        score: top.score,
        name: tied
          ? t('overview.leaderRow.tiedAtTop', { count: tied.count })
          : top.team
            ? resolveBoardEntity(top, needsInitials).prose || null
            : top.player?.full_name?.trim().split(/\s+/).slice(-1)[0] ?? null,
      }
    : null;

  const champion = useMemo(() => {
    // Champion gate — the SAME rule as the pick trophy in HeroBoardBand: only a
    // genuinely finished event (isChampionResolvable) with an authoritative
    // winner. Never by name or position on a live/suspended/playoff board.
    if (!isChampionResolvable(state) || top?.score == null) return null;
    const championEntry = !tournament.winnerName
      // event_type comes from sr_tournaments via the slide — never inferred
      // from the shape of the top board row.
      ? resolveChampionEntry(rows, { winner_id: tournament.winnerId, event_type: tournament.eventType })
      : null;
    const teamChampion = championEntry ? resolveBoardEntity(championEntry, needsInitials) : null;
    const championName = tournament.winnerName ?? teamChampion?.prose ?? null;
    if (!championName) return null;
    const championScore = championEntry?.score ?? top.score;
    const runner = rows
      .filter((row) => row.id !== championEntry?.id && row.score != null && row.score > championScore)
      .sort((a, b) => (a.score ?? Number.POSITIVE_INFINITY) - (b.score ?? Number.POSITIVE_INFINITY))[0]
      ?? rows.find((row) => row.id !== championEntry?.id && row.score != null);
    const margin = runner?.score != null ? runner.score - championScore : null;
    const tiedAtTop = detectTopTie(rows);
    return {
      name: championName,
      score: championScore,
      margin: tiedAtTop ? null : margin != null && margin > 0 ? margin : null,
      playoff: Boolean(tiedAtTop),
    };
  }, [needsInitials, rows, state, top?.player, top?.score, top?.team, tournament.eventType, tournament.winnerId, tournament.winnerName]);

  const championAvatarUrl = champion
    ? resolvePlayerAvatarCandidates({
        name: champion.name,
        photoUrl: tournament.winnerPhotoUrl,
        tourSlug: tournament.tourSlug,
      })[0] ?? null
    : null;

  const dates = tournament.startDate ? formatOverviewDateRange(tournament.startDate, tournament.endDate) : null;

  const startDay = tournament.startDate
    ? new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date(tournament.startDate))
    : null;

  return (
    <>
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
      />
      {isChampionResolvable(state) && champion ? (
        <ChampionStrip
          name={champion.name}
          score={fmtScore(champion.score)}
          scoreValue={champion.score}
          scoreLabel={overviewChampionScoreLabel(champion.playoff, champion.margin, t)}
          eyebrow={t('overview.hero.champion')}
          avatarUrl={championAvatarUrl}
        />
      ) : null}
    </>
  );
}

export default HybridHero;
