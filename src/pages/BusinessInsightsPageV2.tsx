/**
 * Business Insights (BRIEF_BUSINESS_INSIGHTS).
 *
 * The rules this file now encodes, because four of them were being broken:
 *   - 0 IS A FACT. A metric of zero renders "0". Only absent renders nothing,
 *     and only while the query is in flight (the Skeleton path).
 *   - A PERCENTAGE IS A SAMPLE-SIZE CLAIM. Below DELTA_MIN_BASE the delta is
 *     an absolute change, so 1 -> 13 reads "+12" and never "+1200%".
 *   - NOTHING IS INVENTED. No placeholder rows, no mock bars, no fabricated
 *     locations. A locked section says what it is waiting for and shows the
 *     member's REAL progress towards it.
 *   - A RATE CARRIES ITS DENOMINATOR, and below RATE_MIN_IMPRESSIONS it is a
 *     whole number with no benchmark, because a benchmark off n=21 is noise.
 *
 * Type: the shared BUSINESS TYPE SCALE (BIZ_KICKER / BIZ_LABEL / BIZ_TITLE /
 * BIZ_BODY / bizFigure) from analytical/tokens. Nothing here renders at 800.
 */
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ChevronRight } from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import { useBusinessInsights, deltaPct } from '@/hooks/useBusinessInsights';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackBusinessProfileVisit } from '@/lib/businessAnalyticsTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AppLog } from '@/lib/logger';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { BIZ } from '@/components/business/businessTokens';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { formatNumber, formatDayMonthShortGB } from '@/i18n/format';
import {
  A, RAMP, BIZ_KICKER, BIZ_LABEL, BIZ_TITLE, BIZ_BODY, bizFigure, BIZ_INSET, BIZ_TRACK_H,
} from '@/features/courses/components/holes/analytical/tokens';

type DateRange = '7d' | '30d' | '90d';

/**
 * A percentage below this previous-period base is arithmetic, not insight:
 * 1 -> 13 is "+12", not "+1200%". At or above it, the percentage stands.
 */
const DELTA_MIN_BASE = 20;

/** Below this many impressions: whole percent, and NO benchmark comparison. */
const RATE_MIN_IMPRESSIONS = 500;

const GREEN = A.GREEN;
const RED = A.RED;

const cardStyle: React.CSSProperties = { background: BIZ.card, border: `1px solid ${BIZ.hair}` };
const numFeat: React.CSSProperties = { fontFeatureSettings: '"kern" 1, "liga" 1' };

const formatNum = (n: number) => formatNumber(n ?? 0);
const formatDay = (iso: string) => {
  try { return formatDayMonthShortGB(iso); }
  catch { return iso; }
};

const SOURCE_LABEL: Record<string, string> = {
  direct: 'Direct',
  directory: 'Directory',
  search: 'Search',
  feed: 'Feed',
  shared: 'Shared link',
  course_page: 'Course page',
  content: 'From content',
};

// ─────────────────────────────────────────────────────────────
// Reused Reviews section (structure untouched; amber -> neutral ink only)
// ─────────────────────────────────────────────────────────────
const ReviewsSection = ({ businessId, navigate }: { businessId: string; navigate: (path: string) => void }) => {
  const { data: reviewStats, isLoading, error, refetch } = useBusinessReviewStats(businessId);

  const shell = (children: React.ReactNode) => (
    <section className="rounded-[18px] p-4 md:p-5 space-y-5" style={cardStyle}>
      <h3 style={BIZ_TITLE}>Reviews &amp; reputation</h3>
      {children}
    </section>
  );

  if (error) return shell(
    <div className="space-y-3">
      <p style={BIZ_BODY}>Failed to load review stats.</p>
      <button
        type="button"
        onClick={() => refetch()}
        className="inline-flex items-center gap-1.5 px-3.5 rounded-full text-[13px] font-bold active:opacity-90"
        style={{ background: A.INK, color: A.CANVAS, border: 'none', minHeight: 44 }}
      >
        Retry
      </button>
    </div>
  );
  if (isLoading) return shell(<><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></>);
  if (!reviewStats) {
    return shell(
      <>
        <p className="text-center py-6" style={BIZ_BODY}>
          No reviews yet. Once golfers review your courses, you'll see ratings and feedback here.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => navigate(`/business/${businessId}/reviews`)}
            className="inline-flex items-center gap-1.5 px-3.5 rounded-full text-[13px] font-bold active:opacity-90"
            style={{ background: A.INK, color: A.CANVAS, border: 'none', minHeight: 44 }}
          >
            Manage reviews
          </button>
        </div>
      </>
    );
  }

  const maxCount = Math.max(...reviewStats.distribution.map(d => d.count), 1);
  return shell(
    <>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="tabular-nums" style={bizFigure(30)}>{reviewStats.avgRating}</span>
            <span style={{ ...BIZ_BODY, color: A.DIM }}>/ 10</span>
          </div>
          <p className="mt-1" style={BIZ_BODY}>{reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {reviewStats.distribution.slice().reverse().map(item => (
            <div key={item.score} className="flex items-center gap-2">
              <span className="text-[11px] w-5 text-right tabular-nums" style={{ color: A.MUTE, ...numFeat }}>{item.score}</span>
              <div className="flex-1 rounded-full overflow-hidden" style={{ height: BIZ_TRACK_H, background: A.TRACK }}>
                <div className="h-full rounded-full" style={{ width: `${(item.count / maxCount) * 100}%`, background: RAMP.double }} />
              </div>
              <span className="text-[11px] w-6 text-right tabular-nums" style={{ color: A.MUTE, ...numFeat }}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => navigate(`/business/${businessId}/reviews`)}
        className="inline-flex items-center gap-1.5 px-3.5 rounded-full text-[13px] font-bold active:opacity-90"
        style={{ background: A.INK, color: A.CANVAS, border: 'none', minHeight: 44 }}
      >
        Manage reviews
      </button>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Building blocks
// ─────────────────────────────────────────────────────────────
const InsightCard = ({ title, kicker, action, children }: {
  title: string; kicker?: string; action?: React.ReactNode; children: React.ReactNode;
}) => (
  <section className="rounded-[18px] p-4 md:p-5 space-y-4" style={cardStyle}>
    <div className="flex items-start justify-between gap-3">
      <div>
        {kicker && <p className="mb-1.5" style={BIZ_KICKER}>{kicker}</p>}
        <h3 style={BIZ_TITLE}>{title}</h3>
      </div>
      {action}
    </div>
    {children}
  </section>
);

/** Solid triangle. A figure with an arrow is a MOVEMENT, so it keeps the
 *  green-up / red-down improvement convention. */
const Triangle = ({ up, color }: { up: boolean; color: string }) => (
  <span
    aria-hidden
    style={{
      display: 'inline-block',
      width: 0,
      height: 0,
      borderLeft: '3.2px solid transparent',
      borderRight: '3.2px solid transparent',
      ...(up
        ? { borderBottom: `4.4px solid ${color}` }
        : { borderTop: `4.4px solid ${color}` }),
    }}
  />
);

/**
 * The delta. THE FLOOR LIVES HERE, not in the shared deltaPct helper, which
 * has three other consumers in the admin analytics pages.
 *   prev < DELTA_MIN_BASE -> absolute change ("+12")
 *   prev >= DELTA_MIN_BASE -> percentage, as before
 *   value === prev         -> nothing at all, never "0%"
 */
const Delta = ({ value, prev }: { value: number; prev: number }) => {
  if (value == null || prev == null) return null;
  if (value === prev) return null;

  const up = value > prev;
  const color = up ? GREEN : RED;

  let text: string;
  if (prev < DELTA_MIN_BASE) {
    const diff = value - prev;
    text = `${diff > 0 ? '+' : '\u2212'}${formatNum(Math.abs(diff))}`;
  } else {
    const pct = deltaPct(value, prev);
    if (pct === null || Number.isNaN(pct)) return null;
    const abs = Math.abs(pct);
    text = `${pct >= 0 ? '+' : '\u2212'}${abs.toFixed(abs >= 10 ? 0 : 1)}%`;
  }

  return (
    <span
      className="inline-flex items-center gap-1 tabular-nums"
      style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '-0.01em', color, ...numFeat }}
    >
      <Triangle up={up} color={color} />
      {text}
    </span>
  );
};

/**
 * One overview cell. No border, no fill, no glyph - the page is a page of
 * panels already, and every row here is analytics, so a chart icon carries
 * nothing the label does not. The delta sits in a FIXED-height box so cells
 * without one stay aligned with cells that have one.
 */
const MetricCell = ({ label, value, prev, loading }: {
  label: string; value: number; prev: number; loading: boolean;
}) => (
  <div className="flex flex-col items-center text-center gap-1.5">
    <span style={{ ...BIZ_LABEL, lineHeight: 1.25 }}>{label}</span>
    {loading ? (
      <Skeleton className="h-7 w-12" />
    ) : (
      <span className="tabular-nums" style={bizFigure(24)}>{formatNum(value)}</span>
    )}
    <span style={{ height: 15, display: 'flex', alignItems: 'center' }}>
      {!loading && <Delta value={value} prev={prev} />}
    </span>
  </div>
);

/**
 * THE one chart inset. Every chart region sits in it whether it has data or
 * not, so the page does not change shape as data arrives. No border, and no
 * dashes - a broken edge says something is missing, and nothing is missing.
 */
const ChartInset = ({ children, height, center = false }: {
  children: React.ReactNode; height?: number; center?: boolean;
}) => (
  <div
    style={{
      ...BIZ_INSET,
      minHeight: height,
      padding: center ? '20px 16px' : '10px 6px 6px',
      display: center ? 'flex' : undefined,
      flexDirection: center ? 'column' : undefined,
      alignItems: center ? 'center' : undefined,
      justifyContent: center ? 'center' : undefined,
      textAlign: center ? 'center' : undefined,
    }}
  >
    {children}
  </div>
);

const InsetMessage = ({ title, body }: { title?: string; body: string }) => (
  <>
    {title && <p style={{ ...BIZ_LABEL, marginBottom: 6 }}>{title}</p>}
    <p style={{ ...BIZ_BODY, maxWidth: 280 }}>{body}</p>
  </>
);

// ─────────────────────────────────────────────────────────────
// Section: Visits over time
// ─────────────────────────────────────────────────────────────
const VisitsChart = ({ data, emptyLabel }: { data: { day: string; total: number; unique: number }[]; emptyLabel: string }) => {
  const hasData = data.some(d => d.total > 0 || d.unique > 0);
  if (!hasData) return <ChartInset height={220} center><InsetMessage body={emptyLabel} /></ChartInset>;
  const rows = data.map(d => ({ day: formatDay(d.day), Total: d.total, Unique: d.unique }));
  return (
    <ChartInset height={220}>
      <div style={{ width: '100%', height: 204 }}>
        <ResponsiveContainer>
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="visitsInk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={A.INK} stopOpacity={0.18} />
                <stop offset="100%" stopColor={A.INK} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={A.TRACK} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: A.MUTE, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis tick={{ fill: A.MUTE, fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip contentStyle={{ background: A.PANEL, border: `1px solid ${A.BORDER}`, borderRadius: 8, fontSize: 12, color: A.INK }} labelStyle={{ color: A.MUTE }} />
            <Legend wrapperStyle={{ fontSize: 11, color: A.MUTE }} iconType="circle" iconSize={8} />
            <Area type="monotone" dataKey="Total" stroke={A.INK} strokeWidth={2} fill="url(#visitsInk)" />
            <Line type="monotone" dataKey="Unique" stroke={A.MUTE} strokeWidth={1.75} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartInset>
  );
};

// ─────────────────────────────────────────────────────────────
// Section: Discovery sources (horizontal % bars)
// ─────────────────────────────────────────────────────────────
const DiscoveryBars = ({ sources, emptyLabel }: { sources: { source: string; count: number }[]; emptyLabel: string }) => {
  const total = sources.reduce((a, s) => a + s.count, 0);
  if (total === 0) return <ChartInset height={120} center><InsetMessage body={emptyLabel} /></ChartInset>;
  const rows = [...sources].sort((a, b) => b.count - a.count);
  return (
    <ChartInset height={120}>
      <div className="space-y-3 p-2.5">
        {rows.map(r => {
          const pct = (r.count / total) * 100;
          return (
            <div key={r.source}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span style={{ fontSize: 13, fontWeight: 500, color: A.INK }}>{SOURCE_LABEL[r.source] ?? r.source}</span>
                <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK, ...numFeat }}>
                  {pct.toFixed(0)}% <span style={{ fontWeight: 400, color: A.MUTE }}>&middot; {formatNum(r.count)}</span>
                </span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: BIZ_TRACK_H, background: A.TRACK }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: RAMP.double }} />
              </div>
            </div>
          );
        })}
      </div>
    </ChartInset>
  );
};

// ─────────────────────────────────────────────────────────────
// Section: Followers growth
// ─────────────────────────────────────────────────────────────
const FollowersChart = ({ data, emptyTitle, emptyBody }: {
  data: { day: string; count: number }[]; emptyTitle: string; emptyBody: string;
}) => {
  const hasData = data.some(d => d.count > 0);
  if (!hasData) {
    return (
      <ChartInset height={200} center>
        <InsetMessage title={emptyTitle} body={emptyBody} />
      </ChartInset>
    );
  }
  const rows = data.map(d => ({ day: formatDay(d.day), Followers: d.count }));
  return (
    <ChartInset height={200}>
      <div style={{ width: '100%', height: 184 }}>
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={A.TRACK} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: A.MUTE, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis tick={{ fill: A.MUTE, fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip contentStyle={{ background: A.PANEL, border: `1px solid ${A.BORDER}`, borderRadius: 8, fontSize: 12, color: A.INK }} labelStyle={{ color: A.MUTE }} />
            <Line type="monotone" dataKey="Followers" stroke={A.INK} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartInset>
  );
};

// ─────────────────────────────────────────────────────────────
// Section: Top posts
// ─────────────────────────────────────────────────────────────
const TopPosts = ({ items, onOpen, emptyLabel }: {
  items: { post_id: string; content_preview: string; created_at: string; impressions: number; likes: number; comments: number }[];
  onOpen: (postId: string) => void;
  emptyLabel: string;
}) => {
  if (items.length === 0) return <ChartInset height={140} center><InsetMessage body={emptyLabel} /></ChartInset>;
  return (
    <ul className="divide-y" style={{ borderColor: BIZ.hairSoft }}>
      {items.map(p => (
        <li key={p.post_id}>
          <button
            onClick={() => onOpen(p.post_id)}
            className="w-full text-left flex items-start gap-3 active:opacity-70"
            style={{ minHeight: 44, paddingTop: 12, paddingBottom: 12 }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontSize: 13.5, fontWeight: 500, color: A.INK }}>
                {stripMentionMarkup(p.content_preview ?? '').trim() || 'Untitled post'}
              </p>
              <div className="mt-1 flex items-center gap-3 tabular-nums" style={{ fontSize: 11.5, color: A.MUTE, ...numFeat }}>
                <span>{formatNum(p.impressions)} impressions</span>
                <span>{formatNum(p.likes)} likes</span>
                <span>{formatNum(p.comments)} comments</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: A.DIM }} />
          </button>
        </li>
      ))}
    </ul>
  );
};

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
const BusinessInsightsPageV2 = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { user } = useSupabaseSession();

  useHideBottomNav();
  const { data: business, isLoading: businessLoading } = useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading, isFetched: membershipFetched } = useBusinessMembership(id);
  const { data: insights, isLoading: insightsLoading } = useBusinessInsights(business?.id, dateRange);

  const isLoading = businessLoading || membershipLoading;

  useEffect(() => {
    if (business?.id && !isLoading) {
      trackBusinessProfileVisit(business.id, user?.id, 'direct', { page: 'insights' }).catch(err => {
        AppLog.error('[BusinessInsightsPageV2]', 'Failed to track visit:', err);
      });
    }
  }, [business?.id, user?.id, isLoading]);

  useEffect(() => {
    // eslint-disable-next-line settled/no-not-loading-empty-check -- the branch already requires membershipFetched.
    if (membershipFetched && !membershipLoading && !membership?.canViewInsights && business) {
      navigate(`/business/${id}`, { replace: true });
    }
  }, [membershipFetched, membershipLoading, membership, business, id, navigate]);

  /** The rate AND its denominator - a share without its base is not a fact. */
  const engagement = useMemo(() => {
    const impressions = insights.content.reduce((a, c) => a + c.impressions, 0);
    if (impressions <= 0) return null;
    const eng = insights.content.reduce((a, c) => a + c.likes + c.comments, 0);
    return { rate: (eng / impressions) * 100, impressions };
  }, [insights.content]);

  if (isLoading || !membershipFetched) {
    return (
      <ManagePageShell title="Insights">
        <div className="space-y-4 px-4 pt-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </ManagePageShell>
    );
  }

  if (!business) {
    return (
      <ManagePageShell title="Insights">
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <p style={BIZ_BODY}>Business not found</p>
          <Button onClick={() => navigate('/')} className="mt-4 border-0" style={{ background: A.INK, color: A.CANVAS }}>Go home</Button>
        </div>
      </ManagePageShell>
    );
  }

  if (!membership?.canViewInsights) {
    return (
      <ManagePageShell title="Insights">
        <div className="space-y-4 px-4 pt-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </ManagePageShell>
    );
  }

  const rangeLabels: Record<DateRange, string> = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
  const h = insights.headline;

  const rangePicker = (
    <div className="flex justify-center pb-3">
      <div className="inline-flex rounded-full p-1" style={{ border: `1px solid ${A.BORDER}`, background: A.PANEL }}>
        {(['7d', '30d', '90d'] as DateRange[]).map(range => {
          const active = dateRange === range;
          return (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn('px-3.5 md:px-4 rounded-full transition-colors flex items-center justify-center')}
              // A filled button is INK. Amber means the viewing member.
              style={{
                minHeight: 40,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                letterSpacing: '-0.01em',
                ...(active ? { background: A.INK, color: A.CANVAS } : { color: A.MUTE, background: 'transparent' }),
              }}
            >
              {rangeLabels[range]}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <ManagePageShell title="Insights" belowTitle={rangePicker}>

      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-6 space-y-5 md:space-y-6">
        {/* ── OVERVIEW: ONE panel, one grid, no per-cell chrome ── */}
        <section className="rounded-[18px] p-4 md:p-5" style={cardStyle}>
          <p style={{ ...BIZ_KICKER, marginBottom: 18 }}>OVERVIEW</p>
          <div
            className="grid grid-cols-3"
            style={{ rowGap: 24, columnGap: 10 }}
          >
            <MetricCell label={t('business.insights.metric.profileViews')} value={h.profile_views.value} prev={h.profile_views.prev} loading={insightsLoading} />
            <MetricCell label={t('business.insights.metric.uniqueVisitors')} value={h.unique_visitors.value} prev={h.unique_visitors.prev} loading={insightsLoading} />
            <MetricCell label={t('business.insights.metric.directoryImpressions')} value={h.directory_impressions.value} prev={h.directory_impressions.prev} loading={insightsLoading} />
            <MetricCell label={t('business.insights.metric.clickOuts')} value={h.click_outs.value} prev={h.click_outs.prev} loading={insightsLoading} />
            <MetricCell label={t('business.insights.metric.newFollowers')} value={h.new_followers.value} prev={h.new_followers.prev} loading={insightsLoading} />
            <MetricCell label={t('business.insights.metric.messageClicks')} value={h.message_clicks.value} prev={h.message_clicks.prev} loading={insightsLoading} />
          </div>
          <p style={{ ...BIZ_LABEL, marginTop: 18, textAlign: 'center' }}>
            {t('business.insights.deltaCaption', { range: rangeLabels[dateRange] })}
          </p>
        </section>

        {/* ── VISITORS ── */}
        <InsightCard kicker="VISITORS" title="Profile visits over time">
          {insightsLoading
            ? <Skeleton className="h-[220px] w-full rounded-[13px]" />
            : <VisitsChart data={insights.visits_series} emptyLabel={t('business.insights.empty.visits')} />}
        </InsightCard>

        <InsightCard kicker="DISCOVERY" title="How golfers discover you">
          {insightsLoading
            ? <Skeleton className="h-[120px] w-full rounded-[13px]" />
            : <DiscoveryBars sources={insights.sources} emptyLabel={t('business.insights.empty.discovery')} />}
        </InsightCard>

        {/* ── AUDIENCE (locked) ──
            The four handicap bands and the four "Location {i}" rows are GONE.
            They were a mock-up of data that does not exist, shown to a paying
            business as though it were real data greyed out. What stands here
            is the member's REAL unique-visitor count and the real reason the
            breakdown is withheld. NOTE: the unlock threshold is not defined
            anywhere in the codebase, so no target number is claimed here -
            see the report accompanying this change. */}
        <InsightCard
          kicker="AUDIENCE"
          title="Who's viewing you"
          action={
            <span className="inline-flex items-center gap-1" style={BIZ_LABEL}>
              <Lock style={{ width: 9, height: 9 }} /> {t('business.insights.audience.locked')}
            </span>
          }
        >
          <ChartInset height={120} center>
            {insightsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="tabular-nums" style={bizFigure(30)}>{formatNum(h.unique_visitors.value)}</span>
            )}
            <p style={{ ...BIZ_LABEL, marginTop: 7 }}>{t('business.insights.audience.visitorsLabel')}</p>
          </ChartInset>
          <p style={BIZ_BODY}>{t('business.insights.audience.body')}</p>
        </InsightCard>

        {/* ── FOLLOWERS ── */}
        <InsightCard
          kicker="AUDIENCE"
          title="Follower growth"
          action={
            <div className="text-right">
              <p style={BIZ_LABEL}>{t('business.insights.followers.total')}</p>
              <p className="tabular-nums mt-1" style={bizFigure(19)}>{formatNum(h.total_followers)}</p>
            </div>
          }
        >
          {insightsLoading
            ? <Skeleton className="h-[200px] w-full rounded-[13px]" />
            : (
              <FollowersChart
                data={insights.followers_series}
                emptyTitle={t('business.insights.empty.followersTitle')}
                emptyBody={t('business.insights.empty.followersBody')}
              />
            )}
        </InsightCard>

        {/* ── CONTENT ── */}
        <InsightCard kicker="CONTENT" title="Top posts">
          {insightsLoading
            ? <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
            : (
              <TopPosts
                items={insights.content}
                onOpen={(postId) => navigate(`/post/${postId}`)}
                emptyLabel={t('business.insights.empty.posts')}
              />
            )}
        </InsightCard>

        {/* ── ENGAGEMENT: the rate carries its denominator ── */}
        <section className="rounded-[18px] p-4 md:p-5" style={cardStyle}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-1.5" style={BIZ_KICKER}>ENGAGEMENT</p>
              <h3 style={BIZ_TITLE}>Engagement rate</h3>
            </div>
            <div className="text-right">
              {engagement !== null && (
                <>
                  <p className="tabular-nums" style={bizFigure(24)}>
                    {engagement.impressions < RATE_MIN_IMPRESSIONS
                      ? `${Math.round(engagement.rate)}%`
                      : `${engagement.rate.toFixed(1)}%`}
                  </p>
                  <p style={{ ...BIZ_LABEL, marginTop: 6 }}>
                    {t('business.insights.rate.from', { count: engagement.impressions, n: formatNum(engagement.impressions) })}
                  </p>
                </>
              )}
            </div>
          </div>
          <p style={{ ...BIZ_BODY, marginTop: 10 }}>
            {engagement === null
              ? t('business.insights.rate.none')
              : engagement.impressions < RATE_MIN_IMPRESSIONS
                ? t('business.insights.rate.tooFew')
                : t('business.insights.rate.benchmark')}
          </p>
        </section>

        {/* ── REPUTATION (course-linked only) ── */}
        {business.club_id && <ReviewsSection businessId={business.id} navigate={navigate} />}
      </div>
    </ManagePageShell>
  );
};

export default BusinessInsightsPageV2;
