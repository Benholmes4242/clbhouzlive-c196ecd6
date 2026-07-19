import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Star, ArrowUpRight, Eye, Users, Compass, ExternalLink,
  UserPlus, MessageCircle, TrendingUp, TrendingDown, Lock, MapPin, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import { useBusinessInsights, deltaPct } from '@/hooks/useBusinessInsights';
import { PageRoot } from '@/components/layout/PageRoot';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackBusinessProfileVisit } from '@/lib/businessAnalyticsTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AppLog } from '@/lib/logger';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { BIZ } from '@/components/business/businessTokens';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { formatNumber, formatDayMonthShortGB } from '@/i18n/format';

type DateRange = '7d' | '30d' | '90d';

const GREEN = '#059669';
const RED = '#DC2626';

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
// Reused Reviews section (kept intact, course-gated)
// ─────────────────────────────────────────────────────────────
const ReviewsSection = ({ businessId, navigate }: { businessId: string; navigate: (path: string) => void }) => {
  const { data: reviewStats, isLoading, error } = useBusinessReviewStats(businessId);

  const shell = (children: React.ReactNode) => (
    <section className="rounded-[18px] p-4 md:p-5 space-y-5" style={cardStyle}>
      <h3 className="text-[0.9rem] font-medium" style={{ color: BIZ.ink }}>Reviews & reputation</h3>
      {children}
    </section>
  );

  if (error) return shell(<p className="text-sm" style={{ color: BIZ.inkMute }}>Failed to load review stats.</p>);
  if (isLoading) return shell(<><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></>);
  if (!reviewStats) {
    return shell(
      <>
        <p className="text-[0.8rem] text-center py-6" style={{ color: BIZ.inkMute }}>
          No reviews yet. Once golfers review your courses, you'll see ratings and feedback here.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => navigate(`/business/${businessId}/reviews`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12.5px] font-bold active:opacity-90"
            style={{ background: BIZ.ink, color: '#fff', border: 'none' }}
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
            <span className="text-[2rem] font-bold tabular-nums" style={{ color: BIZ.ink, ...numFeat }}>{reviewStats.avgRating}</span>
            <span style={{ color: BIZ.inkMute }}>/ 10</span>
          </div>
          <p className="text-[0.8rem] mt-1" style={{ color: BIZ.inkMute }}>{reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 space-y-1">
          {reviewStats.distribution.slice().reverse().map(item => (
            <div key={item.score} className="flex items-center gap-2">
              <span className="text-xs w-5 text-right tabular-nums" style={{ color: BIZ.inkMute, ...numFeat }}>{item.score}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: BIZ.fill }}>
                <div className="h-full rounded-full" style={{ width: `${(item.count / maxCount) * 100}%`, background: BIZ.amber }} />
              </div>
              <span className="text-xs w-6 text-right tabular-nums" style={{ color: BIZ.inkMute, ...numFeat }}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => navigate(`/business/${businessId}/reviews`)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12.5px] font-bold active:opacity-90"
        style={{ background: BIZ.ink, color: '#fff', border: 'none' }}
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
        {kicker && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: BIZ.inkFaint }}>{kicker}</p>
        )}
        <h3 className="text-[0.95rem] font-semibold" style={{ color: BIZ.ink }}>{title}</h3>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Delta = ({ pct }: { pct: number | null }) => {
  if (pct === null || Number.isNaN(pct)) return null;
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const color = up ? GREEN : RED;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums" style={{ color, ...numFeat }}>
      <Icon className="h-3 w-3" />
      {up ? '+' : ''}{pct.toFixed(pct >= 10 || pct <= -10 ? 0 : 1)}%
    </span>
  );
};

const MetricTile = ({
  icon: Icon, label, value, prev, loading,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string; value: number; prev: number; loading: boolean;
}) => {
  const pct = deltaPct(value, prev);
  return (
    <div className="rounded-[14px] p-3.5" style={{ background: BIZ.fill, border: `1px solid ${BIZ.hairSoft}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full" style={{ background: BIZ.amberTint }}>
          <Icon className="h-3.5 w-3.5" style={{ color: BIZ.amber }} />
        </span>
        {!loading && <Delta pct={pct} />}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-14 mb-1.5" />
          <Skeleton className="h-3 w-20" />
        </>
      ) : (
        <>
          <p className="text-[1.5rem] font-semibold tabular-nums leading-none" style={{ color: BIZ.ink, ...numFeat }}>
            {value > 0 ? formatNum(value) : '—'}
          </p>
          <p className="text-[0.72rem] mt-1.5" style={{ color: BIZ.inkMute }}>{label}</p>
        </>
      )}
    </div>
  );
};

const EmptyBlock = ({ children, height = 200 }: { children: React.ReactNode; height?: number }) => (
  <div className="flex items-center justify-center rounded-[12px]"
    style={{ height, background: BIZ.fill, color: BIZ.inkMute, fontSize: '0.85rem', border: `1px dashed ${BIZ.hairDashed}` }}>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Section: Visits over time
// ─────────────────────────────────────────────────────────────
const VisitsChart = ({ data }: { data: { day: string; total: number; unique: number }[] }) => {
  const hasData = data.some(d => d.total > 0 || d.unique > 0);
  if (!hasData) return <EmptyBlock>No visits yet in this period</EmptyBlock>;
  const rows = data.map(d => ({ day: formatDay(d.day), Total: d.total, Unique: d.unique }));
  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="visitsAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BIZ.amber} stopOpacity={0.28} />
              <stop offset="100%" stopColor={BIZ.amber} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={BIZ.hairSoft} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: BIZ.inkMute, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
          <YAxis tick={{ fill: BIZ.inkMute, fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
          <Tooltip contentStyle={{ background: BIZ.card, border: `1px solid ${BIZ.hair}`, borderRadius: 8, fontSize: 12, color: BIZ.ink }} labelStyle={{ color: BIZ.inkMute }} />
          <Legend wrapperStyle={{ fontSize: 11, color: BIZ.inkMute }} iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="Total" stroke={BIZ.amber} strokeWidth={2} fill="url(#visitsAmber)" />
          <Line type="monotone" dataKey="Unique" stroke={BIZ.ink} strokeWidth={1.75} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Section: Discovery sources (horizontal % bars)
// ─────────────────────────────────────────────────────────────
const DiscoveryBars = ({ sources }: { sources: { source: string; count: number }[] }) => {
  const total = sources.reduce((a, s) => a + s.count, 0);
  if (total === 0) return <EmptyBlock height={120}>No discovery data yet in this period</EmptyBlock>;
  const rows = [...sources].sort((a, b) => b.count - a.count);
  return (
    <div className="space-y-3">
      {rows.map(r => {
        const pct = (r.count / total) * 100;
        return (
          <div key={r.source}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[0.8rem]" style={{ color: BIZ.ink }}>{SOURCE_LABEL[r.source] ?? r.source}</span>
              <span className="text-[0.8rem] font-semibold tabular-nums" style={{ color: BIZ.ink, ...numFeat }}>
                {pct.toFixed(0)}% <span className="font-normal" style={{ color: BIZ.inkMute }}>· {formatNum(r.count)}</span>
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: BIZ.fill }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: BIZ.amber }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Section: Followers growth
// ─────────────────────────────────────────────────────────────
const FollowersChart = ({ data }: { data: { day: string; count: number }[] }) => {
  const hasData = data.some(d => d.count > 0);
  if (!hasData) return <EmptyBlock>Follower activity will appear here as it happens</EmptyBlock>;
  const rows = data.map(d => ({ day: formatDay(d.day), Followers: d.count }));
  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={BIZ.hairSoft} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: BIZ.inkMute, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
          <YAxis tick={{ fill: BIZ.inkMute, fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
          <Tooltip contentStyle={{ background: BIZ.card, border: `1px solid ${BIZ.hair}`, borderRadius: 8, fontSize: 12, color: BIZ.ink }} labelStyle={{ color: BIZ.inkMute }} />
          <Line type="monotone" dataKey="Followers" stroke={BIZ.amber} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Section: Top posts
// ─────────────────────────────────────────────────────────────
const TopPosts = ({
  items, onOpen,
}: {
  items: { post_id: string; content_preview: string; created_at: string; impressions: number; likes: number; comments: number }[];
  onOpen: (postId: string) => void;
}) => {
  if (items.length === 0) return <EmptyBlock height={140}>No posts published in this period</EmptyBlock>;
  return (
    <ul className="divide-y" style={{ borderColor: BIZ.hairSoft }}>
      {items.map(p => (
        <li key={p.post_id}>
          <button
            onClick={() => onOpen(p.post_id)}
            className="w-full text-left py-3 flex items-start gap-3 active:opacity-70"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[0.85rem] truncate" style={{ color: BIZ.ink }}>
                {stripMentionMarkup(p.content_preview ?? '').trim() || 'Untitled post'}
              </p>
              <div className="mt-1 flex items-center gap-3 text-[0.72rem]" style={{ color: BIZ.inkMute, ...numFeat }}>
                <span className="tabular-nums">{formatNum(p.impressions)} impressions</span>
                <span className="tabular-nums">{formatNum(p.likes)} likes</span>
                <span className="tabular-nums">{formatNum(p.comments)} comments</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: BIZ.inkMute }} />
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
    if (membershipFetched && !membershipLoading && !membership?.canViewInsights && business) {
      navigate(`/business/${id}`, { replace: true });
    }
  }, [membershipFetched, membershipLoading, membership, business, id, navigate]);

  const engagementRate = useMemo(() => {
    const impr = insights.content.reduce((a, c) => a + c.impressions, 0);
    if (impr <= 0) return null;
    const eng = insights.content.reduce((a, c) => a + c.likes + c.comments, 0);
    return (eng / impr) * 100;
  }, [insights.content]);

  if (isLoading || !membershipFetched) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="space-y-4 px-4 pt-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </PageRoot>
    );
  }

  if (!business) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <p style={{ color: BIZ.inkMute }}>Business not found</p>
          <Button onClick={() => navigate('/')} className="mt-4 text-white border-0" style={{ background: BIZ.amber }}>Go home</Button>
        </div>
      </PageRoot>
    );
  }

  if (!membership?.canViewInsights) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="space-y-4 px-4 pt-4">
          <div className="h-32 animate-pulse rounded-2xl" style={{ background: BIZ.fillStrong }} />
          <div className="h-24 animate-pulse rounded-2xl" style={{ background: BIZ.fillStrong }} />
        </div>
      </PageRoot>
    );
  }

  const rangeLabels: Record<DateRange, string> = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
  const h = insights.headline;

  return (
    <PageRoot className="min-h-screen pb-20" style={{ background: BIZ.pageBg }}>
      <div className="px-4 pt-3 pb-3" style={{ paddingTop: 'calc(var(--chrome-total-h, 0px) + 12px)' }}>
        <SectionHeader tier="standard" kicker="INSIGHTS" tone="amber" />
        <h1 className="text-[18px] leading-tight mt-0.5" style={{ color: BIZ.ink, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Insights
        </h1>
      </div>

      <div className="sticky z-10 backdrop-blur-xl"
        style={{ top: 'var(--chrome-total-h, 0px)', background: 'rgba(248,250,252,0.97)', borderBottom: `0.5px solid ${BIZ.hair}` }}>
        <div className="flex justify-center pb-3">
          <div className="inline-flex rounded-full p-1" style={{ border: `1px solid ${BIZ.hair}`, background: BIZ.fill }}>
            {(['7d', '30d', '90d'] as DateRange[]).map(range => {
              const active = dateRange === range;
              return (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn('px-3 md:px-4 py-1.5 text-[0.8rem] rounded-full transition-colors', active ? 'font-medium' : '')}
                  style={active ? { background: BIZ.amber, color: '#ffffff' } : { color: BIZ.inkMute }}
                >
                  {rangeLabels[range]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-6 space-y-5 md:space-y-6">
        {/* ── OVERVIEW ── */}
        <section>
          <h2 className="text-[0.75rem] font-medium uppercase tracking-wider mb-3" style={{ color: BIZ.inkMute }}>Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <MetricTile icon={Eye} label="Profile views" value={h.profile_views.value} prev={h.profile_views.prev} loading={insightsLoading} />
            <MetricTile icon={Users} label="Unique visitors" value={h.unique_visitors.value} prev={h.unique_visitors.prev} loading={insightsLoading} />
            <MetricTile icon={Compass} label="Directory impressions" value={h.directory_impressions.value} prev={h.directory_impressions.prev} loading={insightsLoading} />
            <MetricTile icon={ExternalLink} label="Click-outs" value={h.click_outs.value} prev={h.click_outs.prev} loading={insightsLoading} />
            <MetricTile icon={UserPlus} label="New followers" value={h.new_followers.value} prev={h.new_followers.prev} loading={insightsLoading} />
            <MetricTile icon={MessageCircle} label="Message clicks" value={h.message_clicks.value} prev={h.message_clicks.prev} loading={insightsLoading} />
          </div>
        </section>

        {/* ── VISITORS ── */}
        <InsightCard kicker="VISITORS" title="Profile visits over time">
          {insightsLoading ? <Skeleton className="h-[220px] w-full rounded-md" /> : <VisitsChart data={insights.visits_series} />}
        </InsightCard>

        <InsightCard kicker="DISCOVERY" title="How golfers discover you">
          {insightsLoading
            ? <div className="space-y-3"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
            : <DiscoveryBars sources={insights.sources} />}
        </InsightCard>

        {/* ── AUDIENCE / DEMOGRAPHICS (locked placeholder) ── */}
        <InsightCard
          kicker="AUDIENCE"
          title="Who's viewing you"
          action={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: BIZ.amberTint, color: BIZ.amber, border: `1px solid ${BIZ.amberHair}` }}>
              <Lock className="h-2.5 w-2.5" /> Soon
            </span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: BIZ.inkMute }}>Handicap range</p>
              <div className="space-y-2">
                {['Scratch – 5', '6 – 12', '13 – 20', '21+'].map(label => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[0.75rem] w-24" style={{ color: BIZ.ink }}>{label}</span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: BIZ.fill }} />
                    <span className="text-[0.75rem] w-6 text-right tabular-nums" style={{ color: BIZ.inkMute, ...numFeat }}>—</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: BIZ.inkMute }}>Top locations</p>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" style={{ color: BIZ.inkMute }} />
                    <span className="text-[0.75rem] flex-1" style={{ color: BIZ.inkMute }}>Location {i}</span>
                    <span className="text-[0.75rem] tabular-nums" style={{ color: BIZ.inkMute, ...numFeat }}>—</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11.5px] pt-1" style={{ color: BIZ.inkMute }}>
            Demographics unlock once you reach enough unique visitors.
          </p>
        </InsightCard>

        {/* ── FOLLOWERS ── */}
        <InsightCard
          kicker="AUDIENCE"
          title="Follower growth"
          action={
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: BIZ.inkMute }}>Total</p>
              <p className="text-[1.1rem] font-semibold tabular-nums leading-none" style={{ color: BIZ.ink, ...numFeat }}>
                {formatNum(h.total_followers)}
              </p>
            </div>
          }
        >
          {insightsLoading ? <Skeleton className="h-[200px] w-full rounded-md" /> : <FollowersChart data={insights.followers_series} />}
        </InsightCard>

        {/* ── CONTENT ── */}
        <InsightCard kicker="CONTENT" title="Top posts">
          {insightsLoading
            ? <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
            : <TopPosts items={insights.content} onOpen={(postId) => navigate(`/post/${postId}`)} />}
        </InsightCard>

        <section className="rounded-[18px] p-4 md:p-5" style={cardStyle}>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: BIZ.inkFaint }}>ENGAGEMENT</p>
              <h3 className="text-[0.95rem] font-semibold" style={{ color: BIZ.ink }}>Engagement rate</h3>
            </div>
            <p className="text-[1.5rem] font-semibold tabular-nums leading-none" style={{ color: BIZ.ink, ...numFeat }}>
              {engagementRate === null ? '—' : `${engagementRate.toFixed(1)}%`}
            </p>
          </div>
          <p className="text-[11.5px] mt-2" style={{ color: BIZ.inkMute }}>
            {engagementRate === null
              ? 'Publish posts and gather impressions to see your engagement rate.'
              : 'Likes + comments as a share of impressions. >2% is strong.'}
          </p>
        </section>

        {/* ── REPUTATION (course-linked only) ── */}
        {business.club_id && <ReviewsSection businessId={business.id} navigate={navigate} />}
      </div>
    </PageRoot>
  );
};

export default BusinessInsightsPageV2;
