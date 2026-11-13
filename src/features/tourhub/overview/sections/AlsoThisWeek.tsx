import { settled, useSectionReady } from '@/components/courses/browse/PageLoadGate';
import { useAlsoWeekData } from './useAlsoWeekData';
import { AlsoWeekEvent } from './AlsoWeekEvent';
import { useTourPlayerFollows } from '../../leaderboard/useTourPlayerFollows';
import './alsoWeek.css';
import { useTranslation } from 'react-i18next';
import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import { useOverviewEventsAbove } from './useOverviewEventsAbove';
export { isAlsoThisWeek } from './overviewEventSelection';
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

export function shouldShowAlsoThisWeekFigures(slide: Pick<HeroSlide, 'type' | 'tournament'>): boolean {
  return slide.type !== 'upcoming' && slide.tournament.leaderScore != null && Boolean(slide.tournament.leaderName?.trim());
}

export function AlsoThisWeek() {
  const { t } = useTranslation('tourhub');
  const { alsoWeek: others } = useOverviewEventsAbove();
  const data = useAlsoWeekData(others);
  useSectionReady('alsoThisWeek', others.length === 0 || settled(data));
  const follows = useTourPlayerFollows(others.length > 0);
  const liveCount = others.filter(s => s.type === 'live').length;
  if (others.length === 0) return null;
  return <section className="also-week" data-overview-band="alsoThisWeek"><OverviewSectionHead title={t('overview.alsoThisWeek.title')} meta={liveCount > 0 ? <span className="also-week-meta">{t('overview.alsoThisWeek.live', {count:liveCount})}</span> : undefined}/><div>{others.map(slide => <AlsoWeekEvent key={slide.tournament.id} slide={slide} entries={data.isError ? [] : data.data?.boards.get(slide.tournament.id) ?? []} draw={data.isError ? undefined : data.data?.draws.get(slide.tournament.id)} followed={follows.ids}/>)}</div></section>;
}