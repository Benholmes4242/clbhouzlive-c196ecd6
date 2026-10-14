/**
 * The five Analytics RPCs (BRIEF_ANALYTICS). Every figure on the Analytics
 * page comes from here; nothing on that page reads a table. Mappers tolerate
 * missing keys: missing = null, never 0. Staff handling is the RPCs' job.
 */
import { useEffect } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type J = Record<string, unknown> | null | undefined;
const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
const n = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
const s = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const b = (v: unknown): boolean => v === true;
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

async function rpc(name: string, args: Record<string, unknown>): Promise<J> {
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string, a: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>)(name, args);
  if (error) throw new Error(error.message);
  return obj(data);
}

/** All five refetch on the shell's 'admin-v2:refetch' event. */
function useAdminRefetch<T>(q: UseQueryResult<T>): UseQueryResult<T> {
  const { refetch } = q;
  useEffect(() => {
    const h = () => { void refetch(); };
    window.addEventListener('admin-v2:refetch', h);
    return () => window.removeEventListener('admin-v2:refetch', h);
  }, [refetch]);
  return q;
}

// ─── Health ────────────────────────────────────────────────────────────────
export interface AnalyticsHealth {
  days: number | null;
  computed_at: string | null;
  weekly_golfers: { weeks: { week: string | null; n: number | null }[]; this_week: number | null; last_week: number | null; last_week_to_date: number | null };
  activity: { dau_avg: number | null; dau_peak: number | null; dau_avg_30: number | null; wau: number | null; mau: number | null; members: number | null; members_ex_staff: number | null };
  handicap: { connected_n: number | null; not_connected_n: number | null; connected_back_pct: number | null; not_connected_back_pct: number | null; median_days_to_connect: number | null };
  cohorts: { month: string | null; month_start: string | null; n: number | null; cells: (number | null)[] }[];
  growth: { joined: number | null; joined_prior: number | null; members: number | null; connected_new: number | null; daily: { d: string | null; n: number | null }[] };
}

export function mapHealth(raw: J): AnalyticsHealth {
  const r = obj(raw) ?? {};
  const wg = obj(r.weekly_golfers) ?? {};
  const a = obj(r.activity) ?? {};
  const h = obj(r.handicap) ?? {};
  const g = obj(r.growth) ?? {};
  return {
    days: n(r.days),
    computed_at: s(r.computed_at),
    weekly_golfers: {
      weeks: arr(wg.weeks).map((w) => { const o = obj(w) ?? {}; return { week: s(o.week), n: n(o.n) }; }),
      this_week: n(wg.this_week), last_week: n(wg.last_week), last_week_to_date: n(wg.last_week_to_date),
    },
    activity: {
      dau_avg: n(a.dau_avg), dau_peak: n(a.dau_peak), dau_avg_30: n(a.dau_avg_30), wau: n(a.wau),
      mau: n(a.mau), members: n(a.members), members_ex_staff: n(a.members_ex_staff),
    },
    handicap: {
      connected_n: n(h.connected_n), not_connected_n: n(h.not_connected_n),
      connected_back_pct: n(h.connected_back_pct), not_connected_back_pct: n(h.not_connected_back_pct),
      median_days_to_connect: n(h.median_days_to_connect),
    },
    cohorts: arr(r.cohorts).map((c) => {
      const o = obj(c) ?? {};
      return { month: s(o.month), month_start: s(o.month_start), n: n(o.n), cells: arr(o.cells).map(n) };
    }),
    growth: {
      joined: n(g.joined), joined_prior: n(g.joined_prior), members: n(g.members), connected_new: n(g.connected_new),
      daily: arr(g.daily).map((d) => { const o = obj(d) ?? {}; return { d: s(o.d), n: n(o.n) }; }),
    },
  };
}

export function useAnalyticsHealth(days: 7 | 30 | 90) {
  return useAdminRefetch(useQuery({
    queryKey: ['admin-v2', 'analytics', 'health', days],
    queryFn: async () => mapHealth(await rpc('get_admin_analytics_health', { p_days: days })),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  }));
}

// ─── Behaviour ─────────────────────────────────────────────────────────────
export interface AnalyticsBehaviour {
  days: number | null;
  computed_at: string | null;
  features: { avg_ret: number | null; base_users: number | null; rows: { name: string; users: number | null; ret: number | null }[] };
  rhythm: { grid: number[][]; busiest: { dow: number; slot: number } | null; weekend_pct: number | null };
  after_round: { rounds: number | null; opened_pct: number | null; median_wait_secs: number | null; first_screens: { label: string; pct: number | null }[] };
  time_share: { area: string; pct: number | null }[];
}

export function mapBehaviour(raw: J): AnalyticsBehaviour {
  const r = obj(raw) ?? {};
  const f = obj(r.features) ?? {};
  const rh = obj(r.rhythm) ?? {};
  const ar = obj(r.after_round) ?? {};
  const bz = obj(rh.busiest);
  const grid = Array.from({ length: 7 }, (_, i) => {
    const row = arr(arr(rh.grid)[i]);
    return Array.from({ length: 12 }, (_, j) => n(row[j]) ?? 0);
  });
  return {
    days: n(r.days),
    computed_at: s(r.computed_at),
    features: {
      avg_ret: n(f.avg_ret), base_users: n(f.base_users),
      rows: arr(f.rows).map((x) => { const o = obj(x) ?? {}; return { name: s(o.name) ?? '', users: n(o.users), ret: n(o.ret) }; }),
    },
    rhythm: {
      grid,
      busiest: bz && n(bz.dow) != null && n(bz.slot) != null ? { dow: n(bz.dow)!, slot: n(bz.slot)! } : null,
      weekend_pct: n(rh.weekend_pct),
    },
    after_round: {
      rounds: n(ar.rounds), opened_pct: n(ar.opened_pct), median_wait_secs: n(ar.median_wait_secs),
      first_screens: arr(ar.first_screens).map((x) => { const o = obj(x) ?? {}; return { label: s(o.label) ?? '', pct: n(o.pct) }; }),
    },
    time_share: arr(r.time_share).map((x) => { const o = obj(x) ?? {}; return { area: s(o.area) ?? '', pct: n(o.pct) }; }),
  };
}

export function useAnalyticsBehaviour() {
  return useAdminRefetch(useQuery({
    queryKey: ['admin-v2', 'analytics', 'behaviour', 30],
    queryFn: async () => mapBehaviour(await rpc('get_admin_analytics_behaviour', { p_days: 30 })),
    staleTime: 5 * 60_000,
  }));
}

// ─── Journeys ──────────────────────────────────────────────────────────────
export interface FunnelStep { label: string; n: number | null; wait: string | null }
export interface Funnel { key: string; title: string; sub: string; steps: FunnelStep[] }
export interface AnalyticsJourneys {
  days: number | null;
  computed_at: string | null;
  gap: { joined: number | null; signup_starts: number | null };
  funnels: Funnel[];
}

export function mapJourneys(raw: J): AnalyticsJourneys {
  const r = obj(raw) ?? {};
  const g = obj(r.gap) ?? {};
  return {
    days: n(r.days),
    computed_at: s(r.computed_at),
    gap: { joined: n(g.joined), signup_starts: n(g.signup_starts) },
    funnels: arr(r.funnels).map((x, i) => {
      const o = obj(x) ?? {};
      return {
        key: s(o.key) ?? String(i), title: s(o.title) ?? '', sub: s(o.sub) ?? '',
        steps: arr(o.steps).map((st) => { const so = obj(st) ?? {}; return { label: s(so.label) ?? '', n: n(so.n), wait: s(so.wait) }; }),
      };
    }),
  };
}

export function useAnalyticsJourneys() {
  return useAdminRefetch(useQuery({
    queryKey: ['admin-v2', 'analytics', 'journeys', 30],
    queryFn: async () => mapJourneys(await rpc('get_admin_analytics_journeys', { p_days: 30 })),
    staleTime: 5 * 60_000,
  }));
}

// ─── Screens ───────────────────────────────────────────────────────────────
export interface ScreenRow { route: string; label: string; area: string; views: number | null; secs: number | null; members: number | null }
export interface UnusedRow { route: string; label: string; area: string; last_seen: string | null }
export interface AnalyticsScreens {
  days: number | null; computed_at: string | null; used: number | null; unused: number | null;
  views: number | null; typical_secs: number | null; dev_hidden: number | null;
  rows: ScreenRow[]; unused_rows: UnusedRow[];
}

export function mapScreens(raw: J): AnalyticsScreens {
  const r = obj(raw) ?? {};
  return {
    days: n(r.days), computed_at: s(r.computed_at), used: n(r.used), unused: n(r.unused),
    views: n(r.views), typical_secs: n(r.typical_secs), dev_hidden: n(r.dev_hidden),
    rows: arr(r.rows).map((x) => {
      const o = obj(x) ?? {};
      return { route: s(o.route) ?? '', label: s(o.label) ?? s(o.route) ?? '', area: s(o.area) ?? 'Unlisted', views: n(o.views), secs: n(o.secs), members: n(o.members) };
    }),
    unused_rows: arr(r.unused_rows).map((x) => {
      const o = obj(x) ?? {};
      return { route: s(o.route) ?? '', label: s(o.label) ?? s(o.route) ?? '', area: s(o.area) ?? '', last_seen: s(o.last_seen) };
    }),
  };
}

export function useAnalyticsScreens() {
  return useAdminRefetch(useQuery({
    queryKey: ['admin-v2', 'analytics', 'screens', 30],
    queryFn: async () => mapScreens(await rpc('get_admin_analytics_screens', { p_days: 30 })),
    staleTime: 5 * 60_000,
  }));
}

// ─── Live ──────────────────────────────────────────────────────────────────
export interface LivePerson {
  id: string; username: string | null; display_name: string | null; photo: string | null; is_staff: boolean;
  screen: string | null; detail: string | null; on_secs: number | null; session_secs: number | null;
}
export interface AnalyticsLive {
  now: number | null; staff_now: number | null; today: number | null; peak: number | null; peak_at: string | null;
  same_time_last_week: number | null; last_week_day: string | null; views_30m: number | null; computed_at: string | null;
  people: LivePerson[]; bars: number[]; tops: { label: string; n: number | null }[];
}

export function mapLive(raw: J): AnalyticsLive {
  const r = obj(raw) ?? {};
  return {
    now: n(r.now), staff_now: n(r.staff_now), today: n(r.today), peak: n(r.peak), peak_at: s(r.peak_at),
    same_time_last_week: n(r.same_time_last_week), last_week_day: s(r.last_week_day),
    views_30m: n(r.views_30m), computed_at: s(r.computed_at),
    people: arr(r.people).map((x) => {
      const o = obj(x) ?? {};
      return {
        id: s(o.id) ?? '', username: s(o.username), display_name: s(o.display_name), photo: s(o.photo),
        is_staff: b(o.is_staff), screen: s(o.screen), detail: s(o.detail), on_secs: n(o.on_secs), session_secs: n(o.session_secs),
      };
    }),
    bars: arr(r.bars).map((v) => n(v) ?? 0),
    tops: arr(r.tops).map((x) => { const o = obj(x) ?? {}; return { label: s(o.label) ?? '', n: n(o.n) }; }),
  };
}

/** `fast` = the Live lens is open (15s poll); otherwise 30s for the header pill. */
export function useAnalyticsLive(includeStaff: boolean, fast = false) {
  return useAdminRefetch(useQuery({
    queryKey: ['admin-v2', 'analytics', 'live', includeStaff],
    queryFn: async () => mapLive(await rpc('get_admin_analytics_live', { p_include_staff: includeStaff })),
    refetchInterval: fast ? 15_000 : 30_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  }));
}
