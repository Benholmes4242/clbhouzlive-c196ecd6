import { settled, useSectionReady } from '@/components/courses/browse/PageLoadGate';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useComingUp, type ComingUpRow } from '../data/useComingUp';
import type { TourId } from '../../hooks/useOverviewData';
import { OverviewSectionHead } from './OverviewSectionHead';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { useTournamentLastYearTop4 } from '../../hooks/useTournamentLastYearTop4';
import { useComingUpOwnRounds } from '../data/useComingUpOwnRounds';
import { ComingUpNext, ComingUpListRow } from './ComingUpEvent';
import { comingMonth } from './comingUpRules';
import { Fragment } from 'react';
import './comingUp.css';
import { compareComingUpEvents } from './overviewEventSelection';

export function displayEventName(name: string): string { return name.replace(/\s+(hosted|presented)\s+by\s+.+$/i, '').trim() || name; }
export function selectComingUpRail(rows: ComingUpRow[], excludeIds: readonly string[] = []): ComingUpRow[] {
  const used = new Set(excludeIds);
  return rows.filter((row) => !used.has(row.id)).sort(compareComingUpEvents).slice(0, 5);
}

export function ComingUp({ tour, excludeIds }: { tour: TourId | null; excludeIds?: readonly string[] }) {
  const navigate = useNavigate(); const { t } = useTranslation('tourhub'); const scheduleQuery = useComingUp(tour, 12); const { data = [] } = scheduleQuery;
  useSectionReady('comingUp', settled(scheduleQuery));
  const events = selectComingUpRail(data, excludeIds);
  const next = events[0];
  const { data: photos } = useBatchCourseImages(next ? [{ id: next.id, golf_course_id: next.golf_course_id, venue_name: next.venue_name ?? null, venue_course_name: next.venue_course_name, venue_city: next.venue_city, venue_state: next.venue_state, venue_country: next.venue_country }] : []);
  const { data: lastYear } = useTournamentLastYearTop4(next?.id);
  const own = useComingUpOwnRounds(events.flatMap(row => row.golf_course_id ? [row.golf_course_id] : []));
  if (events.length === 0) return null;
  return <section className="coming-up" data-overview-band="comingUp"><OverviewSectionHead title={t('overview.comingUp.title')} action={t('overview.comingUp.linkLabel')} onAction={() => navigate(`/tourhub?tab=schedule&tour=${tour ?? 'all'}`)} />
    {next ? <ComingUpNext row={next} photo={photos?.get(next.id)} lastYear={lastYear} own={next.golf_course_id ? own?.get(next.golf_course_id) : undefined} onOpen={() => navigate(`/tourhub/tournament/${next.id}`)}/> : null}
    {events.slice(1).map((row, index, rows) => { const month = comingMonth(row.start_date); const showMonth = index === 0 || month !== comingMonth(rows[index - 1].start_date); return <Fragment key={row.id}>{showMonth ? <div className="coming-month" data-coming-month>{month}</div> : null}<ComingUpListRow row={row} played={!!row.golf_course_id && !!own?.has(row.golf_course_id)} onOpen={() => navigate(`/tourhub/tournament/${row.id}`)}/></Fragment>; })}
  </section>;
}