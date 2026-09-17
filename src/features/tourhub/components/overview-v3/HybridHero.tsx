/** Tour Overview's single 300px, three-state photographic hero. */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/hybrid-hero.css';

import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import { useTourLeaderboard, type TourTournament } from '../../hooks/useTourHubData';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { PhotoBand, type OverviewCountdownUnit } from './HybridHeroBands/PhotoBand';
import { deriveHeroState, detectTopTie } from './HybridHero.utils';
import { setHeroFullBleed } from '../../_shared/heroFullBleedSignal';
import { formatMonthDay } from '@/i18n/format';
import { OVERVIEW_PHOTO_BAND_HEIGHT } from './HybridHero.constants';

export interface HybridHeroProps {
  slide: HeroSlide;
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
  return [
    { value: Math.floor(minutes / 1_440), label: 'days' },
    { value: Math.floor((minutes % 1_440) / 60), label: 'hours' },
  ];
}

export function HybridHero({ slide, onOpenTournament }: HybridHeroProps) {
  const { tournament } = slide;
  const { t } = useTranslation('tourhub');
  const [now, setNow] = useState(() => new Date());
  const state = useMemo(() => deriveHeroState(tournament, now), [tournament, now]);

  useEffect(() => {
    if (state.kind === 'live') return;
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [state.kind]);

  useEffect(() => {
    setHeroFullBleed(true);
    return () => setHeroFullBleed(false);
  }, []);

  const venueAdapter: TourTournament[] = useMemo(
    () => tournament.venueName ? [{ venue_name: tournament.venueName } as TourTournament] : [],
    [tournament.venueName],
  );
  const { data: imageMap } = useBatchCourseImages(venueAdapter);
  const venueImageUrl = tournament.venueName ? imageMap?.get(tournament.venueName) ?? null : null;
  const { data: leaderboard = [] } = useTourLeaderboard(state.kind === 'upcoming' ? '' : tournament.id);
  const rows = Array.isArray(leaderboard) ? leaderboard : [];
  const top = rows[0];
  const topPosition = top?.position;
  const tiedCount = topPosition === 1
    ? rows.filter((entry) => entry.position === 1).length
    : 0;
  const tied = tiedCount > 1 ? { count: tiedCount } : null;

  const leader = state.kind === 'live' && topPosition === 1 && top?.score != null
    ? {
        score: top.score,
        name: tied
          ? t('overview.leaderRow.tiedAtTop', { count: tied.count })
          : top.player?.full_name?.trim().split(/\s+/).slice(-1)[0] ?? null,
      }
    : null;

  const champion = useMemo(() => {
    if (state.kind !== 'results' || !tournament.winnerName || top?.score == null) return null;
    const runner = rows[1];
    const margin = runner?.score != null ? runner.score - top.score : null;
    const tiedAtTop = detectTopTie(rows);
    return {
      name: tournament.winnerName,
      score: top.score,
      margin: tiedAtTop ? null : margin != null && margin > 0 ? margin : null,
      playoff: Boolean(tiedAtTop),
    };
  }, [rows, state.kind, top?.score, tournament.winnerName]);

  const dates = tournament.startDate && tournament.endDate
    ? `${formatMonthDay(new Date(tournament.startDate)).toUpperCase()} - ${formatMonthDay(new Date(tournament.endDate)).toUpperCase()}`
    : tournament.startDate
      ? formatMonthDay(new Date(tournament.startDate)).toUpperCase()
      : null;

  const startDay = tournament.startDate
    ? new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date(tournament.startDate))
    : null;

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
      champion={champion}
      heightPx={OVERVIEW_PHOTO_BAND_HEIGHT}
      onOpen={onOpenTournament}
    />
  );
}

export default HybridHero;
