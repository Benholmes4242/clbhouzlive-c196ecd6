/** CB99: server-authoritative course pulse; availability and regional privacy
 * are never inferred here. Shared change/name/date helpers preserve existing
 * Insights conventions. Only this card owns its conditional presentation. */
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/i18n/format';
import { courseNameWithinClub } from '@/features/courses/_shared/courseLabel';
import { useBusinessCourseActivity } from '@/hooks/useBusinessCourseActivity';
import { changeOf, changeText } from './InsightsFunnel';
import { postDate } from './InsightsPostsSection';

export const courseActivityClubName = (name: string) => name.trim().replace(/\s+(?:Golf Club|Golf Course|GC)$/i, '').trim();
const bolded = (s: string) => s.split(/<b>(.*?)<\/b>/g).map((part, i) => i % 2 ? <b key={i}>{part}</b> : part);

export function InsightsCourseSection({ businessId, businessName, days, onNavigate }: {
  businessId: string; businessName: string; days: number; onNavigate: (path: string) => void;
}) {
  const { t } = useTranslation('common');
  const q = useBusinessCourseActivity(businessId, days);
  if (q.isError || !q.data || !q.data.available) return null;
  const d = q.data;
  const k = (key: string, options: Record<string, unknown> = {}) => t(`business.insights.courseCard.${key}`, { ...options, defaultValue: '' });
  const club = courseActivityClubName(businessName);
  const period = d.period_days;
  const change = d.rounds > 0 ? changeOf(d.rounds, d.prev_rounds) : null;
  const splits = [
    { id: 'member', label: 'members', count: d.member_rounds },
    { id: 'visitor', label: 'visitors', count: d.visitor_rounds },
    { id: 'unknown', label: 'unknown', count: d.unknown_rounds },
  ];
  const regions = d.regions === null ? null : [
    ...d.regions.map(r => ({ ...r, elsewhere: false })),
    ...(d.elsewhere != null && d.elsewhere > 0 ? [{ region: k('elsewhere'), count: d.elsewhere, elsewhere: true }] : []),
  ];
  const maxRegion = Math.max(0, ...(regions ?? []).map(r => r.count));
  return (
    <section className="insights-course-card" data-card="course" data-state={d.rounds > 0 ? 'ready' : 'empty'}>
      <div className="insights-course-kicker"><span>{k('kicker')}</span>{d.rounds > 0 && <span data-total={d.rounds}>{k('rounds', { count: d.rounds, n: formatNumber(d.rounds) })}</span>}</div>
      <h3 className="insights-course-title" data-title={d.rounds > 0 ? 'rounds' : 'empty'}>
        {k(d.rounds > 0 ? 'title' : 'emptyTitle', { count: d.rounds, n: formatNumber(d.rounds), club, days: period })}
        {change && <span className="insights-course-change" data-change={change.dir} data-change-text={changeText(change)}>{changeText(change)}</span>}
      </h3>
      {d.rounds > 0 ? <>
        <p className="insights-course-line" data-golfers={d.golfers}>{bolded(k('golfers', { count: d.golfers, n: formatNumber(d.golfers) }))}</p>
        <div className="insights-course-split" data-split>{splits.filter(s => s.count > 0).map(s => <i key={s.id} data-segment={s.id} style={{ flexGrow: s.count }} />)}</div>
        <div className="insights-course-legend">{splits.filter(s => s.id !== 'unknown' || s.count > 0).map(s => <Fragment key={s.id}>
          <span className="insights-course-label" data-legend={s.id}><i data-segment={s.id} />{k(s.label)}</span><span className="insights-course-value" data-rounds={s.id}>{formatNumber(s.count)}</span>
        </Fragment>)}</div>
        {d.courses.length >= 2 && <div className="insights-course-courses" data-courses>{d.courses.map(c => <div className="insights-course-row" key={c.course_id} data-course={c.course_id}>
          <span className="insights-course-name">{courseNameWithinClub(c.name)}</span><span className="insights-course-count">{formatNumber(c.rounds)}<small>{k('roundLabel')}</small></span>
        </div>)}</div>}
        {regions !== null && <div data-regions><div className="insights-course-kicker insights-course-regions-kicker">{k('regionsKicker')}</div>
          <div className="insights-course-regions">{regions.map(r => <div className="insights-course-region" key={r.region} data-region={r.region} data-elsewhere={r.elsewhere || undefined}>
            <span>{r.region}</span><span className="insights-course-track"><i style={{ width: `${maxRegion > 0 ? r.count / maxRegion * 100 : 0}%` }} /></span><span className="insights-course-value">{formatNumber(r.count)}</span>
          </div>)}</div>
        </div>}
        {d.visitors > 0 && <p className="insights-course-note" data-visitors={d.visitors}>{bolded(k('visitorNote', { count: d.visitors, n: formatNumber(d.visitors) }))}{d.repeat_visitors > 0 && <span data-repeat={d.repeat_visitors}>{k('repeat', { n: formatNumber(d.repeat_visitors) })}</span>}</p>}
      </> : d.last_round && <p className="insights-course-line" data-last-round={d.last_round}>{bolded(k('lastRound', { date: postDate(d.last_round) }))}</p>}
      <Button variant="ghost" className="insights-course-link" onClick={() => onNavigate(`/business/${businessId}/course`)}><span>{k('link')}</span><span aria-hidden="true">›</span></Button>
      <p className="insights-course-fine" data-fine={d.rounds > 0 ? 'ready' : 'empty'}>{k(d.rounds > 0 ? 'fine' : 'emptyFine')}</p>
    </section>
  );
}