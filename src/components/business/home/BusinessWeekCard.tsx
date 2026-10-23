/**
 * CB67 — Business home, Section 2: This week. Exact match of the signed-off
 * biz-week mock (six states: good, slower, quiet, seen-not-visited, first
 * week, loading/error). Figures come only from useBusinessWeek; a failed read
 * is the error card, never zeros. Down is never red.
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { CSSProperties, ReactNode } from 'react';
import { useBusinessWeek, type BusinessWeek } from '@/hooks/useBusinessWeek';
import { formatNumber } from '@/i18n/format';

export const W = {
  card: '#17171B',
  line: 'rgba(255,255,255,0.08)',
  hair: 'rgba(255,255,255,0.06)',
  ink: '#F8FAFC',
  mute: 'rgba(248,250,252,0.62)',
  dim: 'rgba(248,250,252,0.42)',
  green: '#34D399',
  bar: 'rgba(255,255,255,0.22)',
  stub: 'rgba(255,255,255,0.14)',
  sk: 'rgba(255,255,255,0.06)',
  btnHair: 'rgba(255,255,255,0.14)',
  btnFill: 'rgba(255,255,255,0.04)',
} as const;

const DAY = 86_400_000;
const n = (v: number) => formatNumber(v);

// ── Pure rules (exported for tests) ──────────────────────────────────────

export type SubKind = 'first' | 'zero' | 'up' | 'down' | 'same';
export function subKind(cur: number, prev: number, firstWeek: boolean): SubKind {
  if (firstWeek) return 'first';
  if (cur === 0) return 'zero';
  if (cur > prev) return 'up';
  if (cur < prev) return 'down';
  return 'same';
}

export type HeadlineBranch = 'first_week' | 'visits' | 'seen' | 'quiet';
export function headlineBranch(w: BusinessWeek): HeadlineBranch {
  if (w.first_week) return 'first_week';
  if (w.visits > 0) return 'visits';
  if (w.seen_by > 0) return 'seen';
  return 'quiet';
}

/** Whole days since the last post; null when never posted. */
export function daysSince(lastPostAt: string | null, now = Date.now()): number | null {
  if (!lastPostAt) return null;
  return Math.max(0, Math.floor((now - new Date(lastPostAt).getTime()) / DAY));
}

export type Bar = { kind: 'stub' } | { kind: 'bar'; pct: number; latest: boolean };
export function barShapes(values: number[]): Bar[] {
  const vals = Array.from({ length: 7 }, (_, i) => Math.max(0, values?.[i] ?? 0));
  const max = Math.max(...vals);
  return vals.map((v, i) => (v === 0 || max === 0 ? { kind: 'stub' } : { kind: 'bar', pct: (v / max) * 100, latest: i === 6 }));
}

export type TapKey = 'website' | 'directions' | 'call' | 'message';
export function visibleTaps(taps: BusinessWeek['taps'] | undefined): { key: TapKey; count: number }[] {
  const order: TapKey[] = ['website', 'directions', 'call', 'message'];
  return order.map((key) => ({ key, count: taps?.[key] ?? 0 })).filter((x) => x.count > 0);
}

// ── Styles ───────────────────────────────────────────────────────────────

const cardStyle: CSSProperties = {
  margin: '12px 16px 0', background: W.card, border: `1px solid ${W.line}`, borderRadius: 18, padding: 16,
};
const kickerStyle: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em',
  textTransform: 'uppercase', color: W.mute,
};
const headStyle: CSSProperties = { marginTop: 8, fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.28, color: W.ink };
const paraStyle: CSSProperties = { marginTop: 4, fontSize: 13, lineHeight: 1.45, color: W.mute };
const figsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 16 };
const labelStyle: CSSProperties = { fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: W.dim };
const figStyle: CSSProperties = {
  marginTop: 4, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: W.ink, fontVariantNumeric: 'tabular-nums',
};
const subStyle: CSSProperties = { marginTop: 5, fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: W.dim };
const sparkStyle: CSSProperties = { marginTop: 9, display: 'flex', alignItems: 'flex-end', gap: 3, height: 22 };
const skStyle: CSSProperties = { background: W.sk, borderRadius: 6 };

// ── Pieces ───────────────────────────────────────────────────────────────

function Kicker() {
  const { t } = useTranslation();
  return (
    <div data-week-kicker="" style={kickerStyle}>
      <span>{t('business.week.kicker', { defaultValue: 'This week' })}</span>
      <span style={{ color: W.dim, letterSpacing: '0.12em' }}>{t('business.week.window', { defaultValue: 'Last 7 days' })}</span>
    </div>
  );
}

function Labels(): string[] {
  const { t } = useTranslation();
  return [
    t('business.week.labels.visits', { defaultValue: 'Visits' }),
    t('business.week.labels.seenBy', { defaultValue: 'Seen by' }),
    t('business.week.labels.newFollowers', { defaultValue: 'New followers' }),
  ];
}

function InsightsLink({ businessId }: { businessId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      data-week-link=""
      onClick={() => navigate(`/business/${businessId}/insights`)}
      style={{
        marginTop: 14, display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 13.5, fontWeight: 600, color: W.ink, background: 'none', border: 'none', padding: 0, textAlign: 'left',
      }}
    >
      {t('business.week.fullInsights', { defaultValue: 'Full insights' })}
      <span aria-hidden style={{ color: W.mute }}>›</span>
    </button>
  );
}

function Spark({ values }: { values: number[] }) {
  return (
    <div data-week-spark="" style={sparkStyle}>
      {barShapes(values).map((b, i) =>
        b.kind === 'stub' ? (
          <i key={i} data-bar="stub" style={{ flex: 1, borderRadius: 2, height: 2, background: W.stub }} />
        ) : (
          <i key={i} data-bar={b.latest ? 'latest' : 'bar'} style={{ flex: 1, borderRadius: 2, height: `${b.pct}%`, background: b.latest ? W.ink : W.bar }} />
        ),
      )}
    </div>
  );
}

function SubLine({ cur, prev, first }: { cur: number; prev: number; first: boolean }) {
  const { t } = useTranslation();
  const kind = subKind(cur, prev, first);
  let text: string;
  let color: string = W.dim;
  if (kind === 'first') text = t('business.week.sub.firstWeek', { defaultValue: 'first week' });
  else if (kind === 'zero') text = t('business.week.sub.lastWeek', { defaultValue: '{{value}} last week', value: n(prev) });
  else if (kind === 'up') { text = `↑ ${n(cur - prev)}`; color = W.green; }
  else if (kind === 'down') text = `↓ ${n(prev - cur)}`;
  else text = t('business.week.sub.same', { defaultValue: 'same as last week' });
  return <div data-week-sub={kind} style={{ ...subStyle, color }}>{text}</div>;
}

function Headline({ w, name }: { w: BusinessWeek; name: string }) {
  const { t } = useTranslation();
  const branch = headlineBranch(w);
  let head: ReactNode;
  let para: string | null = null;

  if (branch === 'first_week') {
    head = t('business.week.head.firstWeek', { defaultValue: 'Your first week: {{value}} profile visits.', count: w.visits, value: n(w.visits) });
  } else if (branch === 'visits') {
    const diff = w.visits - w.visits_prev;
    const lead = t('business.week.head.visitsLead', { defaultValue: '{{value}} profile visits, ', count: w.visits, value: n(w.visits) });
    if (diff === 0) {
      head = <>{lead}{t('business.week.head.same', { defaultValue: 'the same as last week.' })}</>;
    } else {
      const delta = diff > 0
        ? <span data-week-head-delta="up" style={{ color: W.green }}>{t('business.week.head.more', { defaultValue: '{{value}} more', value: n(diff) })}</span>
        : <span data-week-head-delta="down">{t('business.week.head.fewer', { defaultValue: '{{value}} fewer', value: n(-diff) })}</span>;
      head = <>{lead}{delta}{t('business.week.head.thanLastWeek', { defaultValue: ' than last week.' })}</>;
    }
  } else if (branch === 'seen') {
    head = t('business.week.head.seen', { defaultValue: '{{value}} golfers saw {{name}} this week, but nobody opened the profile.', count: w.seen_by, value: n(w.seen_by), name });
  } else {
    head = t('business.week.head.quiet', { defaultValue: 'No golfer has seen {{name}} this week.', name });
    const days = daysSince(w.last_post_at);
    const reason = days === null
      ? t('business.week.reason.never', { defaultValue: "You haven't posted as {{name}} yet.", name })
      : days === 0
        ? t('business.week.reason.today', { defaultValue: 'Your last post as {{name}} was today.', name })
        : days === 1
          ? t('business.week.reason.yesterday', { defaultValue: 'Your last post as {{name}} was yesterday.', name })
          : t('business.week.reason.daysAgo', { defaultValue: 'Your last post as {{name}} was {{value}} days ago.', name, count: days, value: n(days) });
    const followers = w.followers_total > 0
      ? ' ' + t('business.week.reason.followers', { defaultValue: 'Your {{value}} followers are the golfers most likely to see a new post.', count: w.followers_total, value: n(w.followers_total) })
      : '';
    para = reason + followers;
  }

  return (
    <>
      <div data-week-headline={branch} style={headStyle}>{head}</div>
      {para !== null && <div data-week-reason="" style={paraStyle}>{para}</div>}
    </>
  );
}

function Taps({ taps }: { taps: BusinessWeek['taps'] }) {
  const { t } = useTranslation();
  const items = visibleTaps(taps);
  if (items.length === 0) return null;
  const word = (key: TapKey, count: number) => {
    switch (key) {
      case 'website': return t('business.week.taps.website', { defaultValue: 'to your website', count });
      case 'directions': return t('business.week.taps.directions', { defaultValue: count === 1 ? 'direction' : 'directions', count });
      case 'call': return t('business.week.taps.call', { defaultValue: count === 1 ? 'call' : 'calls', count });
      default: return t('business.week.taps.message', { defaultValue: count === 1 ? 'message' : 'messages', count });
    }
  };
  return (
    <div
      data-week-taps=""
      style={{
        marginTop: 14, paddingTop: 12, borderTop: `1px solid ${W.hair}`, display: 'flex', flexWrap: 'wrap',
        gap: '6px 14px', fontSize: 12.5, color: W.mute,
      }}
    >
      {items.map(({ key, count }) => (
        <span key={key} data-tap={key}>
          <b style={{ color: W.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{n(count)}</b> {word(key, count)}
        </span>
      ))}
    </div>
  );
}

// ── States ───────────────────────────────────────────────────────────────

export function BusinessWeekSkeleton({ businessId }: { businessId: string }) {
  const labels = Labels();
  return (
    <section data-business-week="loading" aria-busy="true" style={cardStyle}>
      <Kicker />
      <div data-sk="headline" style={{ ...skStyle, marginTop: 10, height: 18, width: '78%' }} />
      <div style={figsStyle}>
        {labels.map((l) => (
          <div key={l} data-week-fig="">
            <div style={labelStyle}>{l}</div>
            <div data-sk="figure" style={{ ...skStyle, marginTop: 4, height: 26, width: '60%' }} />
            <div data-sk="sub" style={{ ...skStyle, marginTop: 5, height: 12, width: '70%' }} />
            <div style={sparkStyle} />
          </div>
        ))}
      </div>
      <InsightsLink businessId={businessId} />
    </section>
  );
}

export function BusinessWeekError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <section data-business-week="error" style={cardStyle}>
      <Kicker />
      <div style={headStyle}>{t('business.week.error.title', { defaultValue: "This week's figures didn't load." })}</div>
      <div style={paraStyle}>{t('business.week.error.body', { defaultValue: 'Check your connection and try again.' })}</div>
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          data-week-retry=""
          onClick={onRetry}
          style={{
            display: 'inline-flex', alignItems: 'center', height: 30, padding: '0 13px', borderRadius: 15,
            border: `1px solid ${W.btnHair}`, background: W.btnFill, color: W.ink, fontSize: 12.5, fontWeight: 700,
          }}
        >
          {t('business.week.error.retry', { defaultValue: 'Try again' })}
        </button>
      </div>
    </section>
  );
}

export function BusinessWeekView({ week, businessId, name }: { week: BusinessWeek; businessId: string; name: string }) {
  const { t } = useTranslation();
  const labels = Labels();
  const total = t('business.week.sub.total', { defaultValue: '{{value}} in total', value: n(week.followers_total) });
  return (
    <section data-business-week="ready" style={cardStyle}>
      <Kicker />
      <Headline w={week} name={name} />
      <div style={figsStyle}>
        <div data-week-fig="visits">
          <div style={labelStyle}>{labels[0]}</div>
          <div style={figStyle}>{n(week.visits)}</div>
          <SubLine cur={week.visits} prev={week.visits_prev} first={week.first_week} />
          <Spark values={week.bars?.visits ?? []} />
        </div>
        <div data-week-fig="seen_by">
          <div style={labelStyle}>{labels[1]}</div>
          <div style={figStyle}>{n(week.seen_by)}</div>
          <SubLine cur={week.seen_by} prev={week.seen_by_prev} first={week.first_week} />
          <Spark values={week.bars?.seen_by ?? []} />
        </div>
        <div data-week-fig="new_followers">
          <div style={labelStyle}>{labels[2]}</div>
          <div style={figStyle}>{n(week.new_followers)}</div>
          <div data-week-sub="total" style={subStyle}>{total}</div>
          <Spark values={week.bars?.new_followers ?? []} />
        </div>
      </div>
      <Taps taps={week.taps} />
      <InsightsLink businessId={businessId} />
    </section>
  );
}

export function BusinessWeekCard({ businessId, name }: { businessId: string; name: string }) {
  const { data, isLoading, isError, refetch } = useBusinessWeek(businessId);
  if (isError) return <BusinessWeekError onRetry={() => { void refetch(); }} />;
  if (isLoading || !data) return <BusinessWeekSkeleton businessId={businessId} />;
  return <BusinessWeekView week={data} businessId={businessId} name={name} />;
}
