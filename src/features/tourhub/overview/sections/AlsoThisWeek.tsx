import { useMemo } from 'react';
import { useAlsoWeekData } from './useAlsoWeekData';
import { AlsoWeekEvent } from './AlsoWeekEvent';
import { useTourPlayerFollows } from '../../leaderboard/useTourPlayerFollows';
import './alsoWeek.css';
import { useTranslation } from 'react-i18next';
import { useHeroCarouselData, type HeroSlide } from '../../hooks/useHeroCarouselData';
import { useTourSelection } from '../../context/TourSelectionContext';
import { OverviewSectionHead } from './OverviewSectionHead';

export function statusFor(slide: HeroSlide, now = new Date()): string {
  if (slide.type === 'live') return `Live${slide.tournament.currentRound ? ` · Round ${slide.tournament.currentRound}` : ''}`;
  if (slide.type === 'completed') return 'Final';
  const start = new Date(slide.tournament.startDate);
  if (Number.isNaN(start.getTime())) return '';
  const hoursAway = (start.getTime() - now.getTime()) / 3_600_000;
  const format = hoursAway > 24
    ? new Intl.DateTimeFormat('en', { weekday: 'long' })
    : new Intl.DateTimeFormat('en', { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false });
  return `Starts ${format.format(start)}`;
}

export function isAlsoThisWeek(slide: HeroSlide, now = new Date()): boolean {
  if (slide.type === 'live') return true;
  if (slide.type === 'completed') {
    const end = new Date(slide.tournament.endDate);
    const age = now.getTime() - end.getTime();
    return Number.isFinite(age) && age >= 0 && age < 3 * 86_400_000;
  }
  if (slide.type !== 'upcoming') return false;
  const start = new Date(slide.tournament.startDate);
  if (Number.isNaN(start.getTime()) || start.getTime() < now.getTime()) return false;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  sunday.setHours(23, 59, 59, 999);
  return start.getTime() <= sunday.getTime();
}

export function shouldShowAlsoThisWeekFigures(slide: Pick<HeroSlide, 'type' | 'tournament'>): boolean {
  return slide.type !== 'upcoming' && slide.tournament.leaderScore != null && Boolean(slide.tournament.leaderName?.trim());
}

export function AlsoThisWeek() {
  const { t } = useTranslation('tourhub');
  const { data: slides = [] } = useHeroCarouselData();
  const { viewingTournamentId } = useTourSelection();
  const others = useMemo(
    () => slides.filter((slide) => slide.tournament.id !== viewingTournamentId && isAlsoThisWeek(slide)).slice(0, 4),
    [slides, viewingTournamentId],
  );
  const data = useAlsoWeekData(others);
  const follows = useTourPlayerFollows(others.length > 0);
  const liveCount = others.filter(s => s.type === 'live').length;
  if (others.length === 0) return null;
  return <section className="also-week"><OverviewSectionHead title={t('overview.alsoThisWeek.title')} meta={liveCount > 0 ? <span className="also-week-meta">{t('overview.alsoThisWeek.live', {count:liveCount})}</span> : undefined}/><div>{others.map(slide => <AlsoWeekEvent key={slide.tournament.id} slide={slide} entries={data.isError ? [] : data.data?.boards.get(slide.tournament.id) ?? []} draw={data.isError ? undefined : data.data?.draws.get(slide.tournament.id)} followed={follows.ids}/>)}</div></section>;
}