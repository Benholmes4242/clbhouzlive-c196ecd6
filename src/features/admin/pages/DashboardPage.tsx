import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronRight, Activity, Bell, Cpu,
  MessageSquare, UserPlus, Star, RefreshCcw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import ChartCard from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import AdminErrorState from '../components/AdminErrorState';
import { useTriageCounts } from '../hooks/useTriageCounts';
import { useNorthStar, northStarDelta } from '../hooks/useNorthStar';
import { useEchoEngineHealth } from '../hooks/useEchoEngineHealth';
import { usePushHealth } from '../hooks/usePushHealth';
import { useDashboard } from '../hooks/useDashboard';
import {
  computeEchoChip, computePushChip, computeEgChip, computeCronChip,
  toneColor, type ChipState,
} from '../lib/healthChips';


// ─── Small helpers ────────────────────────────────────────────────────────────

const num = (n: number) => n.toLocaleString();
const fmtDateKey = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Clubhouse feed (members + posts + reviews) ───────────────────────────────

type FeedKind = 'member' | 'post' | 'review';

interface FeedItem {
  id: string;
  kind: FeedKind;
  created_at: string;
  title: string;
  subtitle: string | null;
  avatarUrl: string | null;
}

async function fetchClubhouseFeed(): Promise<FeedItem[]> {
  const [members, posts, reviews] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, display_name, username, profile_photo_url, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('posts')
      .select('id, content, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('course_ratings')
      .select('id, created_at, user_id, course_id, review')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const postRows = (posts.data ?? []) as any[];
  const reviewRows = (reviews.data ?? []) as any[];
  const memberRows = (members.data ?? []) as any[];

  const profileIds = Array.from(new Set([
    ...postRows.map(r => r.user_id),
    ...reviewRows.map(r => r.user_id),
  ].filter(Boolean)));
  const courseIds = Array.from(new Set(reviewRows.map(r => r.course_id).filter(Boolean)));

  const [profRes, courseRes] = await Promise.all([
    profileIds.length
      ? supabase.from('user_profiles').select('id, display_name, username, profile_photo_url').in('id', profileIds)
      : Promise.resolve({ data: [] as any[] } as any),
    courseIds.length
      ? supabase.from('golf_courses').select('id, name').in('id', courseIds)
      : Promise.resolve({ data: [] as any[] } as any),
  ]);
  const profMap = new Map<string, any>(((profRes.data ?? []) as any[]).map(p => [p.id, p]));
  const courseMap = new Map<string, any>(((courseRes.data ?? []) as any[]).map(c => [c.id, c]));

  const items: FeedItem[] = [];

  for (const m of memberRows) {
    const name = m.display_name ?? m.username ?? 'New golfer';
    items.push({
      id: `member:${m.id}`,
      kind: 'member',
      created_at: m.created_at,
      title: `New member: ${name}`,
      subtitle: null,
      avatarUrl: m.profile_photo_url ?? null,
    });
  }
  for (const p of postRows) {
    const prof = profMap.get(p.user_id);
    const name = prof?.display_name ?? prof?.username ?? 'Someone';
    items.push({
      id: `post:${p.id}`,
      kind: 'post',
      created_at: p.created_at,
      title: `Post from ${name}`,
      subtitle: (p.content ?? '').trim() || null,
      avatarUrl: prof?.profile_photo_url ?? null,
    });
  }
  for (const r of reviewRows) {
    const course = courseMap.get(r.course_id);
    const prof = profMap.get(r.user_id);
    items.push({
      id: `review:${r.id}`,
      kind: 'review',
      created_at: r.created_at,
      title: `Review: ${course?.name ?? 'a course'}`,
      subtitle: (r.review ?? '').trim() || null,
      avatarUrl: prof?.profile_photo_url ?? null,
    });
  }

  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return items.slice(0, 8);
}

// ─── Posts & Reviews 14d ──────────────────────────────────────────────────────

interface PRDay { date: string; posts: number; reviews: number }

async function fetchPostsReviews14d(): Promise<PRDay[]> {
  const start = new Date();
  start.setDate(start.getDate() - 13);
  start.setHours(0, 0, 0, 0);
  const iso = start.toISOString();
  const [posts, reviews] = await Promise.all([
    supabase.from('posts').select('created_at').gte('created_at', iso).limit(5000),
    supabase.from('course_ratings').select('created_at').gte('created_at', iso).limit(5000),
  ]);
  const buckets: Record<string, PRDay> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = fmtDateKey(d);
    buckets[key] = { date: key, posts: 0, reviews: 0 };
  }
  for (const r of posts.data ?? []) {
    const k = fmtDateKey(new Date(r.created_at));
    if (buckets[k]) buckets[k].posts++;
  }
  for (const r of reviews.data ?? []) {
    const k = fmtDateKey(new Date(r.created_at));
    if (buckets[k]) buckets[k].reviews++;
  }
  return Object.values(buckets);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const qc = useQueryClient();
  const northStar = useNorthStar();
  const triage = useTriageCounts();
  const echo = useEchoEngineHealth();
  const push = usePushHealth();
  const dashboard = useDashboard();
  const eg = dashboard.egSyncHealth;

  const feed = useQuery({
    queryKey: ['admin-v2', 'dashboard', 'clubhouse-feed'],
    queryFn: fetchClubhouseFeed,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const prTrend = useQuery({
    queryKey: ['admin-v2', 'dashboard', 'posts-reviews-14d'],
    queryFn: fetchPostsReviews14d,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });

  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: ['admin-v2', 'dashboard'] });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  // ── Health chip statuses (computed here so banner can read them) ────────────
  const echoChip = useMemo(() => computeEchoChip(echo), [echo.isLoading, echo.isError, echo.data]);
  const pushChip = useMemo(() => computePushChip(push), [push.isLoading, push.isError, push.data]);
  const egChip = useMemo(() => computeEgChip(eg), [eg.isLoading, eg.isError, eg.data]);
  const cronChip = useMemo(() => computeCronChip(eg), [eg.isLoading, eg.isError, eg.data]);

  const nonOkChips = [echoChip, pushChip, egChip, cronChip].filter(c => c.tone !== 'ok' && c.tone !== 'idle').length;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720, margin: '0 auto' }}>
      <AlertBannerRow
        triage={triage.data}
        pushRed={push.data?.status === 'red'}
        nonOkChips={nonOkChips}
      />

      <NorthStarHero
        data={northStar.data}
        loading={northStar.isLoading}
        isError={northStar.isError}
        onRetry={() => northStar.refetch()}
        triage={triage.data}
      />

      <ThisWeekGrid
        data={northStar.data}
        loading={northStar.isLoading}
      />

      <ChartCard
        title="Posts and reviews"
        subtitle="Last 14 days"
        loading={prTrend.isLoading}
        isEmpty={!prTrend.isLoading && (prTrend.data ?? []).every(d => !d.posts && !d.reviews)}
        emptyTitle="No posts or reviews yet"
        height={220}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={prTrend.data ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={t.line} vertical={false} />
            <XAxis dataKey="date" stroke={t.inkFaint} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={t.inkFaint} fontSize={11} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: t.surface, border: `1px solid ${t.line}`,
                borderRadius: 8, fontSize: 12, boxShadow: t.shadowPop,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="posts" stackId="a" fill={t.brand} radius={[0, 0, 0, 0]} />
            <Bar dataKey="reviews" stackId="a" fill={t.ink} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <LatestInClubhouse
        items={feed.data ?? []}
        loading={feed.isLoading}
        isError={feed.isError}
        onRetry={() => feed.refetch()}
      />

      <HealthChipStrip echoChip={echoChip} pushChip={pushChip} egChip={egChip} cronChip={cronChip} />
    </div>
  );
}

// ─── Alert banner ─────────────────────────────────────────────────────────────

function AlertBannerRow({
  triage, pushRed, nonOkChips,
}: {
  triage: ReturnType<typeof useTriageCounts>['data'];
  pushRed: boolean;
  nonOkChips: number;
}) {
  const total = triage?.total ?? 0;
  const hasTriage = total > 0;

  if (!hasTriage && !pushRed) return null;

  // Triage-line wins when both exist; push becomes the appended health clause.
  if (hasTriage) {
    const rel = triage?.oldestCreatedAt ? relTime(triage.oldestCreatedAt) : 'moments ago';
    const healthClause = pushRed
      ? ' - push notifications failing'
      : nonOkChips > 0
        ? ` - ${nonOkChips} health alert${nonOkChips === 1 ? '' : 's'}`
        : '';
    const message = `${total} waiting - longest ${rel}${healthClause}`;
    return <BannerLink to={triage!.oldestQueueRoute} tone="warn" message={message} />;
  }

  // Only push failing.
  return (
    <BannerLink
      to="/admin-v2/push-health"
      tone="danger"
      message="Push notifications failing - open push health"
    />
  );
}

function BannerLink({ to, tone, message }: { to: string; tone: 'warn' | 'danger'; message: string }) {
  const isDanger = tone === 'danger';
  return (
    <Link
      to={to}
      role="alert"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: isDanger ? t.dangerSoft : t.warnSoft,
        border: `1px solid ${(isDanger ? t.dangerText : t.warnText)}22`,
        color: isDanger ? t.dangerText : t.warnText,
        borderRadius: t.radius.md,
        fontSize: 13, fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      <AlertTriangle size={16} />
      <span style={{ flex: 1 }}>{message}</span>
      <ChevronRight size={16} />
    </Link>
  );
}

// ─── North Star hero ──────────────────────────────────────────────────────────

function NorthStarHero({
  data, loading, isError, onRetry, triage,
}: {
  data: ReturnType<typeof useNorthStar>['data'];
  loading: boolean;
  isError: boolean;
  onRetry: () => void;
  triage: ReturnType<typeof useTriageCounts>['data'];
}) {
  return (
    <section
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: 22,
        boxShadow: t.shadowCard,
        padding: 20,
        display: 'flex', flexDirection: 'column', gap: 16,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${t.brand}, ${t.brand}00)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ color: t.brandText, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            North Star
          </div>
          <div style={{ color: t.ink, fontSize: 17, fontWeight: 700, marginTop: 2 }}>
            Live activity
          </div>
        </div>
        {triage && triage.total > 0 && (
          <Link
            to={triage.oldestQueueRoute}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: t.ink, color: t.surface,
              padding: '6px 12px', borderRadius: 999,
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
            }}
          >
            {triage.total} to triage
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {isError ? (
        <AdminErrorState
          title="Couldn't load North Star"
          message="A retry usually fixes it."
          onRetry={onRetry}
        />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            <HeroStat
              label="DAU"
              value={loading ? null : (data?.dauToday ?? 0)}
              delta={loading ? undefined : northStarDelta(data?.dauToday ?? 0, data?.dauYesterday ?? 0)}
              subtitle="vs yesterday"
            />
            <HeroStat
              label="WAU"
              value={loading ? null : (data?.wau ?? 0)}
              delta={loading ? undefined : northStarDelta(data?.wau ?? 0, data?.wauPrev ?? 0)}
              subtitle="vs prev 7d"
            />
            <HeroStat
              label="MAU"
              value={loading ? null : (data?.mau ?? 0)}
              subtitle="last 30 days"
            />
          </div>
          <div
            style={{
              borderTop: `1px solid ${t.line}`,
              paddingTop: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: t.inkMuted, fontSize: 12,
            }}
          >
            <span>Total users</span>
            <span style={{
              color: t.ink, fontWeight: 700,
              fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
            }}>
              {loading ? '-' : num(data?.totalUsers ?? 0)}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

function HeroStat({
  label, value, delta, subtitle,
}: {
  label: string;
  value: number | null;
  delta?: number;
  subtitle?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      style={{
        background: t.canvas,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg,
        padding: '12px 10px',
        display: 'flex', flexDirection: 'column', gap: 4,
        minWidth: 0,
      }}
    >
      <div style={{ color: t.inkFaint, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{
        color: t.ink, fontSize: 22, fontWeight: 700, lineHeight: 1.1,
        fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
      }}>
        {value === null ? '-' : num(value)}
      </div>
      {typeof delta === 'number' ? (
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            color: positive ? t.okText : t.dangerText,
            fontSize: 11, fontWeight: 600,
          }}
        >
          {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {Math.abs(delta)}% <span style={{ color: t.inkFaint, fontWeight: 500 }}>· {subtitle}</span>
        </div>
      ) : subtitle ? (
        <div style={{ color: t.inkFaint, fontSize: 11 }}>{subtitle}</div>
      ) : null}
    </div>
  );
}

// ─── This week grid ───────────────────────────────────────────────────────────

function ThisWeekGrid({
  data, loading,
}: {
  data: ReturnType<typeof useNorthStar>['data'];
  loading: boolean;
}) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 12,
      }}
      className="admin-v2-thisweek"
    >
      <MetricCard
        title="Signups"
        subtitle="Last 7 days"
        value={loading ? null : (data?.signups7d ?? 0)}
        delta={loading ? undefined : northStarDelta(data?.signups7d ?? 0, data?.signupsPrev7d ?? 0)}
        deltaLabel="vs previous 7 days"
      />
      <RetentionCard
        loading={loading}
        d1={data?.d1Retention ?? null}
        d7={data?.d7Retention ?? null}
      />
      <style>{`
        @media (min-width: 640px) {
          .admin-v2-thisweek { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </section>
  );
}

function MetricCard({
  title, subtitle, value, delta, deltaLabel,
}: {
  title: string;
  subtitle?: string;
  value: number | null;
  delta?: number;
  deltaLabel?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: 18,
        boxShadow: t.shadowCard,
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{
        color: t.ink, fontSize: 28, fontWeight: 700, lineHeight: 1.05,
        fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
      }}>
        {value === null ? '-' : num(value)}
      </div>
      {typeof delta === 'number' && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          color: positive ? t.okText : t.dangerText,
          fontSize: 12, fontWeight: 600,
        }}>
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(delta)}%
          {deltaLabel && <span style={{ color: t.inkFaint, fontWeight: 500 }}>· {deltaLabel}</span>}
        </div>
      )}
      {subtitle && !delta && (
        <div style={{ color: t.inkMuted, fontSize: 12 }}>{subtitle}</div>
      )}
    </div>
  );
}

function RetentionCard({ loading, d1, d7 }: { loading: boolean; d1: number | null; d7: number | null }) {
  const sparse = !loading && d1 === null && d7 === null;
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: 18,
        boxShadow: t.shadowCard,
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        Retention
      </div>
      {sparse ? (
        <div style={{ color: t.inkMuted, fontSize: 13 }}>Not enough data yet</div>
      ) : (
        <div style={{ display: 'flex', gap: 16 }}>
          <RetentionBar label="D1" pct={d1} loading={loading} />
          <RetentionBar label="D7" pct={d7} loading={loading} />
        </div>
      )}
    </div>
  );
}

function RetentionBar({ label, pct, loading }: { label: string; pct: number | null; loading: boolean }) {
  const isNull = !loading && pct === null;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ color: t.inkMuted, fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{
          color: t.ink, fontSize: 18, fontWeight: 700,
          fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
        }}>
          {loading ? '-' : isNull ? '-' : `${pct}%`}
        </span>
      </div>
      <div style={{
        height: 6, background: t.canvas, borderRadius: 999, overflow: 'hidden',
        border: `1px solid ${t.line}`,
      }}>
        <div style={{
          width: `${Math.min(100, Math.max(0, pct ?? 0))}%`,
          height: '100%',
          background: t.brand,
          borderRadius: 999,
        }} />
      </div>
      {isNull && (
        <span style={{ color: t.inkFaint, fontSize: 10 }}>Not enough data yet</span>
      )}
    </div>
  );
}

// ─── Latest in the clubhouse ──────────────────────────────────────────────────

function LatestInClubhouse({
  items, loading, isError, onRetry,
}: {
  items: FeedItem[];
  loading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <section
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: 18,
        boxShadow: t.shadowCard,
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>Latest in the clubhouse</div>
          <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>New members, posts, and reviews</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 52, background: t.canvas, borderRadius: t.radius.md,
              animation: 'admin-pulse 1.4s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : isError ? (
        <AdminErrorState message="Couldn't load recent activity." onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((it, idx) => (
            <FeedRow key={it.id} item={it} first={idx === 0} />
          ))}
        </div>
      )}
    </section>
  );
}

function FeedRow({ item, first }: { item: FeedItem; first: boolean }) {
  const chip = feedChip(item.kind);
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 0',
        borderTop: first ? 'none' : `1px solid ${t.line}`,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 28, height: 28, borderRadius: 8,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: chip.bg, color: chip.fg, flexShrink: 0,
        }}
      >
        {chip.icon}
      </span>
      {item.avatarUrl ? (
        <SquircleAvatar
          src={item.avatarUrl}
          alt={item.title}
          size={28}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
        />
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ color: t.ink, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </span>
          <span style={{ color: t.inkFaint, fontSize: 11 }}>· {relTime(item.created_at)}</span>
        </div>
        {item.subtitle && (
          <div
            style={{
              color: t.inkMuted, fontSize: 13, marginTop: 2,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function feedChip(kind: FeedKind): { icon: React.ReactNode; bg: string; fg: string } {
  switch (kind) {
    case 'member':
      return { icon: <UserPlus size={14} />, bg: '#DBEAFE', fg: '#1D4ED8' };
    case 'review':
      return { icon: <Star size={14} />, bg: t.brandSoft, fg: t.brandText };
    case 'post':
    default:
      return { icon: <MessageSquare size={14} />, bg: t.canvas, fg: t.ink };
  }
}

// ─── Health chips ─────────────────────────────────────────────────────────────




function HealthChipStrip({
  egChip, cronChip, echoChip, pushChip,
}: {
  egChip: ChipState;
  cronChip: ChipState;
  echoChip: ChipState;
  pushChip: ChipState;
}) {
  return (
    <section
      style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}
    >
      <HealthChip to="/admin-v2/system" icon={<RefreshCcw size={14} />} state={egChip} />
      <HealthChip to="/admin-v2/system" icon={<Activity size={14} />} state={cronChip} />
      <HealthChip to="/admin-v2/echo-health" icon={<Cpu size={14} />} state={echoChip} />
      <HealthChip to="/admin-v2/push-health" icon={<Bell size={14} />} state={pushChip} />
    </section>
  );
}

function HealthChip({
  to, icon, state,
}: {
  to: string;
  icon: React.ReactNode;
  state: ChipState;
}) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg, boxShadow: t.shadowCard,
        padding: '10px 12px',
        textDecoration: 'none', color: t.ink,
        minWidth: 0,
      }}
    >
      <span
        aria-hidden
        style={{ width: 8, height: 8, borderRadius: 999, background: toneColor(state.tone), flexShrink: 0 }}
      />
      <span style={{ display: 'inline-flex', color: t.inkMuted }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.label}</span>
        <span style={{ fontSize: 11, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.detail}</span>
      </div>
      <ChevronRight size={14} color={t.inkFaint} />
    </Link>
  );
}
