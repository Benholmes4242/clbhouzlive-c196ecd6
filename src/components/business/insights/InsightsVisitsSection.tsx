/** CB83 owns one settled snapshot of insights, funnel totals and UTC post
 * dates. Switches retain all previous figures until all reads settle. Failed
 * post-date reads omit markers/posted clauses. CB82/club analytics stay frozen. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBusinessInsights, type BusinessInsights, type InsightsRange } from '@/hooks/useBusinessInsights';
import { useBusinessInsightsFunnel, type BusinessInsightsFunnel } from '@/hooks/useBusinessInsightsFunnel';
import { useBusinessPostDays } from '@/hooks/useBusinessPostDays';
import { formatNumber } from '@/i18n/format';
import { axisIndices, busiestPeriod, sourceBuckets, visitBuckets, type VisitBucket } from './visitBuckets';
interface Snapshot { insights: BusinessInsights; funnel: BusinessInsightsFunnel; dates: string[]; days: number; businessId: string }
const dayLabel = (day: string, weekday = false) => new Intl.DateTimeFormat('en-GB', weekday ? { weekday: 'short', timeZone: 'UTC' } : { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
export function VisitsBars({ buckets, days }: { buckets: VisitBucket[]; days: number }) {
  const max = Math.max(1, ...buckets.map(b => b.total));
  return <div className="insights-visits-chart"><div className="insights-visits-bars">
    {buckets.map(b => <div className="insights-visits-column" key={b.day} data-day={b.day} data-total={b.total}>
      {b.posts > 0 && <span className="insights-visits-marker" data-posts={b.posts}>{b.posts >= 2 && <span>{formatNumber(b.posts)}</span>}</span>}
      {days === 7 && b.total > 0 && <span className="insights-visits-number" data-bar-number>{formatNumber(b.total)}</span>}
      <div className="insights-visits-bar" data-zero={b.total === 0} style={{ height: b.total === 0 ? 2 : `${b.total / max * (days === 7 ? 82 : 100)}%` }} />
    </div>)}
  </div><div className="insights-visits-axis" data-weekdays={days === 7}>
    {axisIndices(buckets.length, days).map(i => { const b = buckets[i]; return b ? <span key={b.day} data-axis-day={b.day}>{dayLabel(b.day, days === 7)}</span> : null; })}
  </div></div>;
}
export function InsightsVisitsCards({ insights, funnel, dates, days }: Omit<Snapshot, 'businessId'>) {
  const { t } = useTranslation('common');
  const k = (key: string, options: Record<string, unknown> = {}) => t(`business.insights.visits.${key}`, { ...options, defaultValue: '' });
  const buckets = visitBuckets(insights.visits_series, dates, days), best = busiestPeriod(buckets, dates, days);
  const sources = sourceBuckets(insights.sources), maxSource = Math.max(1, ...sources.map(s => s.count));
  const date = best ? best.dateKind === 'date' ? dayLabel(best.day) : k(best.dateKind) : '';
  return <div data-section="insights-visits">
    <section className="insights-visits-card" data-card="visits">
      <div className="insights-visits-kicker"><span>{k(days === 90 ? 'weeklyKicker' : 'kicker')}</span><span data-visit-total={funnel.opened.visits} data-golfer-total={funnel.opened.value}>{k('visitCount', { count: funnel.opened.visits, n: formatNumber(funnel.opened.visits) })} · {k('golferCount', { count: funnel.opened.value, n: formatNumber(funnel.opened.value) })}</span></div>
      <VisitsBars buckets={buckets} days={days} />
      <div className="insights-visits-legend"><span><i className="insights-visits-square" />{k('legendVisits')}</span><span><i className="insights-visits-ring" />{k('legendPosts')}</span></div>
      <p className="insights-visits-note" data-busiest-day={best?.day} data-date-kind={best?.dateKind} data-post-relation={best?.relation ?? 'none'} data-weekly={days === 90} data-empty={!best}>
        {best ? <><b>{k(days === 90 ? 'busiestWeek' : best.relation ? 'busiestDayPosted' : 'busiestDay', { date, count: best.total, n: formatNumber(best.total) })}</b>{best.relation && <> {k(best.relation === 'same' ? 'postedSame' : 'postedAfter')}</>}</> : k('empty', { days })}
      </p>
    </section>
    {funnel.opened.visits > 0 && <section className="insights-visits-card" data-card="sources">
      <div className="insights-visits-kicker"><span>{k('sourcesKicker')}</span><span>{k('sourcesUnit')}</span></div>
      <div className="insights-source-rows">{sources.map(s => <div className="insights-source-row" data-source={s.name} data-count={s.count} key={s.name}><span>{k(`sources.${s.name}`)}</span><div className="insights-source-track"><i style={{ width: `${s.count / maxSource * 100}%` }} /></div><span className="insights-source-value">{formatNumber(s.count)}</span></div>)}</div>
      {sources.some(s => s.name === 'other') && <p className="insights-source-fine" data-source-fine>{k('fine')}</p>}
    </section>}
  </div>;
}
export function InsightsVisitsSection({ businessId, range }: { businessId: string; range: InsightsRange }) {
  const insights = useBusinessInsights(businessId, range), funnel = useBusinessInsightsFunnel(businessId, insights.days), posts = useBusinessPostDays(businessId, insights.days);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  useEffect(() => {
    if (!insights.isFetched || insights.isPlaceholderData || insights.error || !funnel.isFetched || funnel.isPlaceholderData || funnel.isError || !funnel.data || !posts.isFetched || posts.isPlaceholderData) return;
    setSnapshot({ insights: insights.data, funnel: funnel.data, dates: posts.isError ? [] : posts.data ?? [], days: insights.days, businessId });
  }, [insights.data, insights.days, insights.isFetched, insights.isPlaceholderData, insights.error, funnel.data, funnel.isFetched, funnel.isPlaceholderData, funnel.isError, posts.data, posts.isFetched, posts.isPlaceholderData, posts.isError, businessId]);
  if (!snapshot || snapshot.businessId !== businessId) return null;
  return <InsightsVisitsCards {...snapshot} />;
}