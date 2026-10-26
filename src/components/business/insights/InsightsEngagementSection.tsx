/**
 * CB88 — Insights section 6 "Engagement". Replaces "ENGAGEMENT · Engagement
 * rate". Draws nothing until the first read settles, nothing if it fails and
 * nothing when the business has never posted; period switches keep the
 * previous card. Every figure is the server's. The change on engaged_prev
 * reuses the funnel's changeOf/changeText exactly as section 5.
 */
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { useBusinessEngagement, type BusinessEngagement } from '@/hooks/useBusinessEngagement';
import { changeOf, changeText } from './InsightsFunnel';

type K = (key: string, o?: Record<string, unknown>) => string;

/** Below this many golfers reached the ratio is not said in words. */
export const RATIO_MIN_REACHED = 20;
export const ENGAGED_BAR_MIN_PCT = 2;

export type Ratio = null | { kind: 'half' } | { kind: 'exact' | 'about'; n: number };
export function ratioOf(engaged: number, reached: number): Ratio {
  if (reached < RATIO_MIN_REACHED || engaged <= 0) return null;
  if (engaged * 2 > reached) return { kind: 'half' };
  const n = Math.round(reached / engaged);
  return { kind: reached % engaged === 0 ? 'exact' : 'about', n };
}

export function engagedPct(engaged: number, reached: number): number {
  if (engaged <= 0 || reached <= 0) return 0;
  return Math.min(100, Math.max(ENGAGED_BAR_MIN_PCT, (engaged / reached) * 100));
}

export function titleKeyOf(engaged: number, reached: number): 'title' | 'titleNone' | 'titleOne' | 'titleOneNone' {
  if (reached === 1) return engaged > 0 ? 'titleOne' : 'titleOneNone';
  return engaged > 0 ? 'title' : 'titleNone';
}

const bolded = (s: string) => s.split(/<b>(.*?)<\/b>/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));

const Card = ({ d, days, k }: { d: BusinessEngagement; days: number; k: K }) => {
  const kicker = <div className="insights-visits-kicker"><span>{k('kicker')}</span></div>;
  if (d.reached === 0) {
    return (
      <section className="insights-engagement-card" data-card="engagement" data-state="empty">
        {kicker}
        <h3 className="insights-engagement-title" data-title="empty">{k(`empty_${days}`)}</h3>
      </section>
    );
  }
  const change = changeOf(d.engaged, d.engaged_prev);
  const titleKey = titleKeyOf(d.engaged, d.reached);
  const ratio = ratioOf(d.engaged, d.reached);
  const showTiles = d.likes > 0 || d.comments > 0;
  return (
    <section className="insights-engagement-card" data-card="engagement" data-state="ready">
      {kicker}
      <h3 className="insights-engagement-title" data-title={titleKey} data-engaged={d.engaged} data-reached={d.reached}>
        {k(titleKey, { x: formatNumber(d.engaged), n: formatNumber(d.reached) })}
        {change && (
          <span className="insights-engagement-change" data-change={change.dir} data-change-text={changeText(change)} style={{ color: change.color }}>
            {change.dir === 'up' ? k(change.mode === 'pct' ? 'changeUpPct' : 'changeUp', { n: change.n }) : k(change.mode === 'pct' ? 'changeDownPct' : 'changeDown', { n: change.n })}
          </span>
        )}
      </h3>
      {ratio && (
        <p className="insights-engagement-ratio" data-ratio={ratio.kind} data-ratio-n={ratio.kind === 'half' ? undefined : ratio.n}>
          {bolded(ratio.kind === 'half' ? k('ratioHalf') : k(ratio.kind === 'exact' ? 'ratioExact' : 'ratioAbout', { n: ratio.n }))}
        </p>
      )}
      {d.engaged > 0 && (
        <div className="insights-engagement-bar"><i data-bar style={{ width: `${engagedPct(d.engaged, d.reached)}%` }} /></div>
      )}
      {showTiles && (
        <div className="insights-engagement-tiles" data-tiles>
          <div className="insights-engagement-tile" data-tile="likes">
            <div className="insights-engagement-tile-n">{formatNumber(d.likes)}</div>
            <div className="insights-engagement-tile-l" data-label-count={d.likes}>{k('likes', { count: d.likes })}</div>
          </div>
          <div className="insights-engagement-tile" data-tile="comments">
            <div className="insights-engagement-tile-n">{formatNumber(d.comments)}</div>
            <div className="insights-engagement-tile-l" data-label-count={d.comments}>{k('comments', { count: d.comments })}</div>
          </div>
        </div>
      )}
      <p className="insights-engagement-fine" data-fine={d.engaged > 0 ? 'engaged' : 'none'}>{k(d.engaged > 0 ? 'fine' : 'fineNone')}</p>
    </section>
  );
};

export function InsightsEngagementSection({ businessId, days }: { businessId: string; days: number }) {
  const { t } = useTranslation('common');
  const q = useBusinessEngagement(businessId, days);
  if (q.isError || !q.data || !q.data.has_posts) return null;
  const k: K = (key, options = {}) => t(`business.insights.engagementCard.${key}`, { ...options, defaultValue: '' });
  return <Card d={q.data} days={days} k={k} />;
}
