import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * get_admin_active_windows - the RPC owns the definition of DAU / WAU / MAU.
 *
 * WAU and MAU are DISTINCT counts over rolling windows. They are NOT summable
 * from a per-day series (a member appearing on five days would be counted five
 * times), so nothing in this file - or downstream of it - derives them. If you
 * are about to build a Set of user ids in TypeScript, stop.
 *
 * The RPC also excludes headless / bot traffic, which get_platform_activity
 * does not: the DAU here is deliberately lower and is the correct figure.
 */
export interface ActiveWindow {
  current: number;
  previous: number;
}

export interface ActiveDailyPoint {
  date: string;
  /** Uniques on that day. */
  dau: number;
  /** Rolling 7-day distinct count ENDING on that day - a real weekly trend. */
  wau: number;
  /** Rolling 30-day distinct count ending on that day. */
  mau: number;
}

export interface ActiveWindows {
  /** previous = same weekday last week. */
  dau: ActiveWindow;
  /** previous = the 7 days before. */
  wau: ActiveWindow;
  /** previous = days 30-60 back. */
  mau: ActiveWindow;
  /** WAU as a percentage of MAU, one decimal. null when not computable. */
  stickiness: number | null;
  daily: ActiveDailyPoint[];
  computed_at: string;
}

function n(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function readWindow(raw: unknown): ActiveWindow | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const cur = n(o.current);
  const prev = n(o.previous);
  if (cur === null || prev === null) return null;
  return { current: cur, previous: prev };
}

/**
 * UNRESOLVED IS NOT ABSENT. A payload cached before this RPC existed - or one
 * with a block stripped - maps to null, and callers keep the tiles in their
 * loading state rather than rendering a zero.
 */
function mapActiveWindows(raw: unknown): ActiveWindows | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const dau = readWindow(o.dau);
  const wau = readWindow(o.wau);
  const mau = readWindow(o.mau);
  if (!dau || !wau || !mau) return null;

  const daily: ActiveDailyPoint[] = Array.isArray(o.daily)
    ? (o.daily as unknown[]).flatMap((p) => {
        if (!p || typeof p !== 'object') return [];
        const r = p as Record<string, unknown>;
        const d = n(r.dau); const w = n(r.wau); const mo = n(r.mau);
        if (typeof r.date !== 'string' || d === null || w === null || mo === null) return [];
        return [{ date: r.date, dau: d, wau: w, mau: mo }];
      })
    : [];

  return {
    dau, wau, mau,
    stickiness: n(o.stickiness),
    daily,
    computed_at: typeof o.computed_at === 'string' ? o.computed_at : '',
  };
}

export function useActiveWindows(days = 28) {
  return useQuery<ActiveWindows | null>({
    queryKey: ['admin-v2', 'active-windows', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_active_windows' as never, { p_spark_days: days } as never);
      if (error) throw error;
      return mapActiveWindows(data);
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
