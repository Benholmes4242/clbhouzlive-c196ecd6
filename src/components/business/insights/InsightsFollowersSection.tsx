/**
 * CB86 — Insights section 5 "Followers". Replaces "AUDIENCE · Follower growth".
 * Draws nothing until the first read settles and nothing if it fails; period
 * switches keep the previous card. Every figure is the server's. The change
 * on the period before reuses the funnel's changeOf/changeText; the
 * today/yesterday rule is section 2's UTC day rule. Styled as sections 1–4.
 */
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { useBusinessFollowers, type BusinessFollowers } from '@/hooks/useBusinessFollowers';
import { changeOf, changeText } from './InsightsFunnel';
import { utcDay, previousDay } from './visitBuckets';
import { postDate } from './InsightsPostsSection';

type K = (key: string, o?: Record<string, unknown>) => string;

export const REACH_MIN_PCT = 2;
export function reachPct(reached: number, followers: number): number {
  if (followers <= 0 || reached <= 0) return 0;
  return Math.min(100, Math.max(REACH_MIN_PCT, (reached / followers) * 100));
}

export type LastFollowKind = 'today' | 'yesterday' | 'date';
export function lastFollowKind(iso: string, today = utcDay(new Date())): LastFollowKind {
  const day = utcDay(iso);
  return day === today ? 'today' : day === previousDay(today) ? 'yesterday' : 'date';
}

const bolded = (s: string) => s.split(/<b>(.*?)<\/b>/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));

const Card = ({ d, days, businessName, k }: { d: BusinessFollowers; days: number; businessName: string; k: K }) => {
  const kicker = (
    <div className="insights-visits-kicker">
      <span>{k('kicker')}</span>
      <span data-total={d.total}>{k('inTotal', { n: formatNumber(d.total) })}</span>
    </div>
  );
  if (d.total === 0) {
    return (
      <section className="insights-followers-card" data-card="followers" data-state="none">
        {kicker}
        <h3 className="insights-followers-title" data-title="none">{k('noneTitle', { business: businessName })}</h3>
      </section>
    );
  }
  const change = changeOf(d.new, d.prev);
  const title = d.new === 0 ? k(`titleZero_${days}`) : k(`title_${days}`, { count: d.new, n: formatNumber(d.new) });
  const lastKind = d.last_new_at ? lastFollowKind(d.last_new_at) : null;
  const showInset = d.has_posts && d.followers > 0;
  return (
    <section className="insights-followers-card" data-card="followers" data-state="ready">
      {kicker}
      <h3 className="insights-followers-title" data-title={d.new === 0 ? 'zero' : 'new'} data-new={d.new}>
        {title}
        {change && (
          <span className="insights-followers-change" data-change={change.dir} data-change-text={changeText(change)} style={{ color: change.color }}>
            {change.dir === 'up' ? k(change.mode === 'pct' ? 'changeUpPct' : 'changeUp', { n: change.n }) : k(change.mode === 'pct' ? 'changeDownPct' : 'changeDown', { n: change.n })}
          </span>
        )}
      </h3>
      {d.last_new_at && lastKind && (
        <p className="insights-followers-last" data-last={lastKind}>
          {bolded(lastKind === 'date' ? k('lastDate', { date: postDate(d.last_new_at) }) : k(lastKind === 'today' ? 'lastToday' : 'lastYesterday'))}
        </p>
      )}
      {showInset && (
        <div className="insights-followers-inset" data-inset>
          <div>
            <span className="insights-followers-reached" data-reached={d.reached}>{formatNumber(d.reached)}</span>
            <span className="insights-followers-of" data-of={d.followers}>{k('of', { n: formatNumber(d.followers) })}</span>
          </div>
          <p className="insights-followers-saw" data-saw-count={d.followers}>{k(`saw_${days}`, { count: d.followers })}</p>
          <div className="insights-followers-bar"><i data-bar style={{ width: `${reachPct(d.reached, d.followers)}%` }} /></div>
        </div>
      )}
      {d.merge_in_period && <p className="insights-followers-fine" data-fine="merge">{k('mergeFine')}</p>}
    </section>
  );
};

export function InsightsFollowersSection({ businessId, businessName, days }: { businessId: string; businessName: string; days: number }) {
  const { t } = useTranslation('common');
  const q = useBusinessFollowers(businessId, days);
  if (q.isError || !q.data) return null;
  const k: K = (key, options = {}) => t(`business.insights.followersCard.${key}`, { ...options, defaultValue: '' });
  return <Card d={q.data} days={days} businessName={businessName} k={k} />;
}
