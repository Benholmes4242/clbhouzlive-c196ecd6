import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronRight, Activity, Bell, Cpu,
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

// ─── Recent posts (Latest in the clubhouse) ───────────────────────────────────

interface LatestPost {
  id: string;
  content: string | null;
  created_at: string;
  user: { display_name: string | null; username: string | null; profile_photo_url: string | null } | null;
}

async function fetchLatestPosts(): Promise<LatestPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, content, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(6);
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const ids = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
  if (!ids.length) return rows.map(r => ({ ...r, user: null }));
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .in('id', ids);
  const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return rows.map(r => ({
    id: r.id,
    content: r.content,
    created_at: r.created_at,
    user: map.get(r.user_id) ?? null,
  }));
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

  const latestPosts = useQuery({
    queryKey: ['admin-v2', 'dashboard', 'latest-posts'],
    queryFn: fetchLatestPosts,
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

  const bannerReason = useMemo(() => {
    if (push.data?.status === 'red') return 'Push notifications delivery is failing — investigate the queue.';
    if ((triage.data?.total ?? 0) >= 25) return `${triage.data!.total} items are waiting in your triage queues.`;
    if (push.data?.status === 'amber') return 'Push notifications delivery is degraded.';
    return null;
  }, [push.data?.status, triage.data]);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720, margin: '0 auto' }}>
      {bannerReason && <AlertBanner message={bannerReason} />}

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
        posts={latestPosts.data ?? []}
        loading={latestPosts.isLoading}
        isError={latestPosts.isError}
        onRetry={() => latestPosts.refetch()}
      />

      <HealthChipStrip
        echo={echo}
        push={push}
      />
    </div>
  );
}

// ─── Alert banner ─────────────────────────────────────────────────────────────

function AlertBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: t.warnSoft,
        border: `1px solid ${t.warnText}22`,
        color: t.warnText,
        borderRadius: t.radius.md,
        fontSize: 13, fontWeight: 600,
      }}
    >
      <AlertTriangle size={16} />
      <span style={{ flex: 1 }}>{message}</span>
    </div>
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
            to="/admin-v2/verifications"
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
              {loading ? '—' : num(data?.totalUsers ?? 0)}
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
        {value === null ? '—' : num(value)}
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
        d1={data?.d1Retention ?? 0}
        d7={data?.d7Retention ?? 0}
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
        {value === null ? '—' : num(value)}
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

function RetentionCard({ loading, d1, d7 }: { loading: boolean; d1: number; d7: number }) {
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
      <div style={{ display: 'flex', gap: 16 }}>
        <RetentionBar label="D1" pct={loading ? 0 : d1} loading={loading} />
        <RetentionBar label="D7" pct={loading ? 0 : d7} loading={loading} />
      </div>
    </div>
  );
}

function RetentionBar({ label, pct, loading }: { label: string; pct: number; loading: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ color: t.inkMuted, fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{
          color: t.ink, fontSize: 18, fontWeight: 700,
          fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
        }}>
          {loading ? '—' : `${pct}%`}
        </span>
      </div>
      <div style={{
        height: 6, background: t.canvas, borderRadius: 999, overflow: 'hidden',
        border: `1px solid ${t.line}`,
      }}>
        <div style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          height: '100%',
          background: t.brand,
          borderRadius: 999,
        }} />
      </div>
    </div>
  );
}

// ─── Latest in the clubhouse ──────────────────────────────────────────────────

function LatestInClubhouse({
  posts, loading, isError, onRetry,
}: {
  posts: LatestPost[];
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
          <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>Fresh posts across the platform</div>
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
        <AdminErrorState message="Couldn't load recent posts." onRetry={onRetry} />
      ) : posts.length === 0 ? (
        <EmptyState title="No posts yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {posts.map((p, idx) => {
            const name = p.user?.display_name ?? p.user?.username ?? 'Someone';
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 0',
                  borderTop: idx === 0 ? 'none' : `1px solid ${t.line}`,
                }}
              >
                <SquircleAvatar
                  src={p.user?.profile_photo_url ?? undefined}
                  alt={name}
                  size={32}
                  hairlineRing
                  ringColor={LIGHT_HAIRLINE}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ color: t.ink, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </span>
                    <span style={{ color: t.inkFaint, fontSize: 11 }}>· {relTime(p.created_at)}</span>
                  </div>
                  <div
                    style={{
                      color: t.inkMuted, fontSize: 13, marginTop: 2,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {p.content?.trim() || <em style={{ color: t.inkFaint }}>Media post</em>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Health chips ─────────────────────────────────────────────────────────────

function HealthChipStrip({
  echo, push,
}: {
  echo: ReturnType<typeof useEchoEngineHealth>;
  push: ReturnType<typeof usePushHealth>;
}) {
  const echoStatus = (() => {
    if (echo.isLoading) return { color: t.inkFaint, label: 'Loading…' };
    if (echo.isError) return { color: t.warn, label: 'Unavailable' };
    const latest = echo.data?.latest ?? [];
    if (!latest.length) return { color: t.inkFaint, label: 'No checks' };
    const failing = latest.filter(r => !r.ok).length;
    if (failing > 0) return { color: t.danger, label: `${failing} of ${latest.length} failing` };
    return { color: t.ok, label: `${latest.length} engines ok` };
  })();

  const pushStatus = (() => {
    if (push.isLoading) return { color: t.inkFaint, label: 'Loading…' };
    if (push.isError || !push.data) return { color: t.warn, label: 'Unavailable' };
    if (push.data.status === 'red') return { color: t.danger, label: 'Failing' };
    if (push.data.status === 'amber') return { color: t.warn, label: 'Degraded' };
    return { color: t.ok, label: 'Healthy' };
  })();

  return (
    <section
      style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}
    >
      <HealthChip
        to="/admin-v2/echo-health"
        icon={<Cpu size={14} />}
        label="Echo engines"
        status={echoStatus}
      />
      <HealthChip
        to="/admin-v2/push-health"
        icon={<Bell size={14} />}
        label="Push"
        status={pushStatus}
      />
    </section>
  );
}

function HealthChip({
  to, icon, label, status,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  status: { color: string; label: string };
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
        style={{ width: 8, height: 8, borderRadius: 999, background: status.color, flexShrink: 0 }}
      />
      <span style={{ display: 'inline-flex', color: t.inkMuted }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 11, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{status.label}</span>
      </div>
      <ChevronRight size={14} color={t.inkFaint} />
    </Link>
  );
}

// Silence unused import warning if Activity ever gets used
void Activity;
