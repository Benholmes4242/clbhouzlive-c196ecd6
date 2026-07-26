import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Per-screen usage, one row per ACTIVE route in page_route_manifest -
 * including routes with zero traffic (a dead screen emits no events, so it
 * can only be surfaced via the manifest).
 *
 * numeric columns arrive from PostgREST as strings: coerce with Number().
 */
export interface ScreenRow {
  route_pattern: string;
  label: string;
  area: string;
  views: number;
  unique_users: number;
  unique_sessions: number;
  /** null when there are no dwell samples */
  median_dwell_sec: number | null;
  events_fired: number;
  prev_views: number;
  /** null when prev_views = 0 - never invent a trend */
  trend_pct: number | null;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function useScreenAnalytics(days: number) {
  return useQuery({
    queryKey: ['admin', 'screen-analytics', days],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ScreenRow[]> => {
      const { data, error } = await supabase.rpc('get_screen_analytics' as never, {
        p_days: days,
      } as never);
      if (error) throw error;
      const rows = (data ?? []) as Record<string, unknown>[];
      return rows.map(r => ({
        route_pattern: String(r.route_pattern ?? ''),
        label: String(r.label ?? ''),
        area: String(r.area ?? ''),
        views: num(r.views),
        unique_users: num(r.unique_users),
        unique_sessions: num(r.unique_sessions),
        median_dwell_sec: numOrNull(r.median_dwell_sec),
        events_fired: num(r.events_fired),
        prev_views: num(r.prev_views),
        trend_pct: numOrNull(r.trend_pct),
      }));
    },
  });
}

/** Top event names fired on one screen, resolved through page_path_map. */
export interface ScreenEventRow {
  name: string;
  count: number;
}

export function useScreenTopEvents(routePattern: string | null, days: number) {
  return useQuery({
    queryKey: ['admin', 'screen-analytics', 'events', routePattern, days],
    enabled: !!routePattern,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ScreenEventRow[]> => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: paths, error: pErr } = await supabase
        .from('page_path_map')
        .select('raw_path')
        .eq('route_pattern', routePattern as string)
        .limit(1000);
      if (pErr) throw pErr;

      const rawPaths = (paths ?? [])
        .map(p => (p as { raw_path: string }).raw_path)
        .filter(Boolean);
      if (rawPaths.length === 0) return [];

      const { data, error } = await supabase
        .from('analytics_events')
        .select('name, props')
        .gte('created_at', since.toISOString())
        .in('props->>path', rawPaths)
        .limit(2000);
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of (data ?? []) as { name: string }[]) {
        if (!row?.name) continue;
        if (row.name === 'page_view' || row.name === 'page_exit') continue;
        counts.set(row.name, (counts.get(row.name) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });
}
