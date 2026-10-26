/**
 * Business Insights (BRIEF_BUSINESS_INSIGHTS).
 *
 * The rules this file now encodes, because four of them were being broken:
 *   - 0 IS A FACT. A metric of zero renders "0". Only absent renders nothing,
 *     and only while the query is in flight (the Skeleton path).
 *   - The headline/funnel (CB82, InsightsFunnel) owns period changes:
 *     absolute below a base of 20, never red.
 *   - NOTHING IS INVENTED. No placeholder rows, no mock bars, no fabricated
 *     locations. A locked section says what it is waiting for and shows the
 *     member's REAL progress towards it.
 *   - A RATE CARRIES ITS DENOMINATOR, and below RATE_MIN_IMPRESSIONS it is not
 *     printed at all: the count is stated and the rate is withheld.
 *
 * Type: the shared BUSINESS TYPE SCALE (BIZ_KICKER / BIZ_LABEL / BIZ_TITLE /
 * BIZ_BODY / bizFigure) from analytical/tokens. Nothing here renders at 800.
 */
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import { useBusinessInsights } from '@/hooks/useBusinessInsights';
import { useBusinessInsightsFunnel } from '@/hooks/useBusinessInsightsFunnel';
import { InsightsFunnel } from '@/components/business/insights/InsightsFunnel';
import { InsightsVisitsSection } from '@/components/business/insights/InsightsVisitsSection';
import { InsightsAudienceSection } from '@/components/business/insights/InsightsAudienceSection';
import { InsightsPostsSection } from '@/components/business/insights/InsightsPostsSection';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Button } from '@/components/ui/button';
import { RailChips } from '@/components/ui/RailChips';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { BIZ } from '@/components/business/businessTokens';
import { formatNumber, formatDayMonthShortGB } from '@/i18n/format';
import {
  A, BIZ_KICKER, BIZ_LABEL, BIZ_TITLE, BIZ_BODY, bizFigure, BIZ_INSET, BIZ_TRACK_H,
} from '@/features/courses/components/holes/analytical/tokens';

type DateRange = '7d' | '30d' | '90d';
const RANGE_DAYS: Record<DateRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

/** Below this many impressions the rate is WITHHELD: the page states the
 *  impression count and says why, rather than printing a number it disowns. */
const RATE_MIN_IMPRESSIONS = 500;

/** Bar fill on a dark track: ink at reduced alpha, lighter than A.TRACK, so
 *  the filled part reads as filled rather than as a hole in the track. */
const BAR_FILL = A.DIM;


const cardStyle: React.CSSProperties = { background: BIZ.card, border: `1px solid ${BIZ.hair}` };
const numFeat: React.CSSProperties = { fontFeatureSettings: '"kern" 1, "liga" 1' };

const formatNum = (n: number) => formatNumber(n ?? 0);
const formatDay = (iso: string) => {
  try { return formatDayMonthShortGB(iso); }
  catch { return iso; }
};

// ─────────────────────────────────────────────────────────────
// Reused Reviews section (structure untouched; amber -> neutral ink only)
// ─────────────────────────────────────────────────────────────
const ReviewsSection = ({ businessId, navigate }: { businessId: string; navigate: (path: string) => void }) => {
  const { t } = useTranslation('common');
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
          <p className="mt-1" style={BIZ_BODY}>{t('business.insights.reviewsCount', { count: reviewStats.totalReviews, n: formatNum(reviewStats.totalReviews) })}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {reviewStats.distribution.slice().reverse().map(item => (
            <div key={item.score} className="flex items-center gap-2">
              <span className="text-[11px] w-5 text-right tabular-nums" style={{ color: A.MUTE, ...numFeat }}>{item.score}</span>
              <div className="flex-1 rounded-full overflow-hidden" style={{ height: BIZ_TRACK_H, background: A.TRACK }}>
                <div className="h-full rounded-full" style={{ width: `${(item.count / maxCount) * 100}%`, background: BAR_FILL }} />
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
// Section: Followers growth
// ─────────────────────────────────────────────────────────────
const FollowersChart = ({ data, emptyTitle, emptyBody }: {
  data: { day: string; count: number }[]; emptyTitle: string; emptyBody: string;
}) => {
  // ABSENCE of rows is "no data"; a flat zero line is the truthful answer.
  const hasData = data.length > 0;
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
            <XAxis dataKey="day" tick={{ fill: A.MUTE, fontSize: 10 /* AXIS floor 10: chart tick, a coordinate */ }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis tick={{ fill: A.MUTE, fontSize: 10 /* AXIS floor 10: chart tick, a coordinate */ }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip contentStyle={{ background: A.PANEL, border: `1px solid ${A.BORDER}`, borderRadius: 8, fontSize: 12, color: A.INK }} labelStyle={{ color: A.MUTE }} />
            <Line type="monotone" dataKey="Followers" stroke={A.INK} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartInset>
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

  useHideBottomNav();
  const { data: business, isLoading: businessLoading } = useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading, isFetched: membershipFetched } = useBusinessMembership(id);
  const { data: insights, isLoading: insightsLoading } = useBusinessInsights(business?.id, dateRange);
  const { data: funnel, isError: funnelError } = useBusinessInsightsFunnel(business?.id, RANGE_DAYS[dateRange]);

  const isLoading = businessLoading || membershipLoading;

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

  // TERMINAL, not a skeleton: the redirect effect above normally moves the
  // viewer on, but this state must never be able to hang.
  if (!membership?.canViewInsights) {
    return (
      <ManagePageShell title="Insights">
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <p style={BIZ_BODY}>You don't have access to this business's insights.</p>
          <Button onClick={() => navigate(`/business/${id}`, { replace: true })} className="mt-4 border-0" style={{ background: A.INK, color: A.CANVAS }}>Back to profile</Button>
        </div>
      </ManagePageShell>
    );
  }

  const rangeLabels: Record<DateRange, string> = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
  const h = insights.headline;
  const canPost = !!membership.role && ['owner', 'admin', 'editor'].includes(membership.role);

  const rangePicker = (
    <div className="flex justify-center pb-3">
      <RailChips
        options={(['7d', '30d', '90d'] as DateRange[]).map(r => ({ id: r, label: rangeLabels[r] }))}
        value={dateRange}
        onChange={(next) => setDateRange(next as DateRange)}
        ariaLabel="Date range"
      />
    </div>
  );

  return (
    <ManagePageShell title="Insights" subtitle={business.name} belowTitle={rangePicker}>

      <div className="mx-auto px-4 md:px-6 py-6 space-y-5 md:space-y-6">
        {/* ── CB82: headline + "from seen to acted" (replaces OVERVIEW). Draws
            nothing until the first read settles or if it fails; period
            switches keep the previous figures. ── */}
        {funnel && !funnelError && (
          <div className="-mx-4 md:-mx-6 -mt-6">
            <InsightsFunnel
              funnel={funnel}
              businessName={business.name}
              days={RANGE_DAYS[dateRange]}
              canPost={canPost}
              onPost={() => usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: business.id })}
            />
          </div>
        )}

        <div className="-mx-4 md:-mx-6 !mt-0">
          <InsightsVisitsSection businessId={business.id} range={dateRange} />
        </div>

        {/* ── CB84: YOUR GOLFERS (replaces the permanently locked "Who's
            viewing you" card). Draws nothing until the audience read settles,
            nothing at all if it fails, and ignores the 7/30/90 picker. ── */}
        <div className="-mx-4 md:-mx-6 !mt-0">
          <InsightsAudienceSection businessId={business.id} businessName={business.name} />
        </div>

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

        {/* ── CB85: YOUR POSTS (replaces CONTENT · Top posts). Draws nothing
            until the first read settles or if it fails; period switches keep
            the previous card. ── */}
        <div className="-mx-4 md:-mx-6 !mt-0">
          <InsightsPostsSection
            businessId={business.id}
            days={RANGE_DAYS[dateRange]}
            canPost={canPost}
            onPost={() => usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: business.id })}
            onOpen={(postId) => navigate(`/post/${postId}`)}
          />
        </div>

        {/* ── ENGAGEMENT: the rate carries its denominator, and below the
            floor it is withheld - the count is stated, the rate is not. ── */}
        <section className="rounded-[18px] p-4 md:p-5" style={cardStyle}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-1.5" style={BIZ_KICKER}>ENGAGEMENT</p>
              <h3 style={BIZ_TITLE}>Engagement rate</h3>
            </div>
            <div className="text-right">
              {insightsLoading ? (
                <Skeleton className="h-7 w-14" />
              ) : engagement !== null && engagement.impressions >= RATE_MIN_IMPRESSIONS ? (
                <>
                  <p className="tabular-nums" style={bizFigure(24)}>{`${engagement.rate.toFixed(1)}%`}</p>
                  <p style={{ ...BIZ_LABEL, marginTop: 6 }}>
                    {t('business.insights.rate.from', { count: engagement.impressions, n: formatNum(engagement.impressions) })}
                  </p>
                </>
              ) : engagement !== null ? (
                <>
                  <p className="tabular-nums" style={bizFigure(24)}>{formatNum(engagement.impressions)}</p>
                  <p style={{ ...BIZ_LABEL, marginTop: 6 }}>{t('business.insights.rate.impressionsLabel')}</p>
                </>
              ) : null}
            </div>
          </div>
          {insightsLoading ? (
            <Skeleton className="h-4 w-3/4 mt-3" />
          ) : (
            <p style={{ ...BIZ_BODY, marginTop: 10 }}>
              {engagement === null
                ? t('business.insights.rate.none')
                : engagement.impressions < RATE_MIN_IMPRESSIONS
                  ? t('business.insights.rate.tooFew')
                  : t('business.insights.rate.benchmark')}
            </p>
          )}
        </section>

        {/* ── REPUTATION (course-linked only) ── */}
        {business.club_id && <ReviewsSection businessId={business.id} navigate={navigate} />}
      </div>
    </ManagePageShell>
  );
};

export default BusinessInsightsPageV2;
