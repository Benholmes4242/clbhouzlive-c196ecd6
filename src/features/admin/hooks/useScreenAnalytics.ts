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
  /**
   * Test/developer entry. It stays in the manifest on purpose so it remains
   * visible and removable, but it must not dilute the dead-screen reading.
   */
  is_dev: boolean;
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
        is_dev: r.is_dev === true,
      }));
    },
  });
}

/** Top event names fired on one screen, resolved through page_path_map. */
export interface ScreenEventRow {
  name: string;
  count: number;
}

/**
 * THE PATH LOOKUP GOES THROUGH A TRUSTED FUNCTION, NOT A DIRECT SELECT.
 * `page_path_map` has RLS enabled and NO policy on purpose: it is closed to
 * members and the function is its only door, exactly as `get_screen_analytics`
 * already reads `page_route_manifest`. A direct client select returned 0 of
 * 1,656 rows and the panel rendered that as "no events on this screen", which
 * made an unreadable lookup indistinguishable from a screen nobody used.
 * Do NOT add a member-facing policy to reopen the direct select.
 *
 * THREE STATES, NOT TWO. A failed read must NOT be shown as a zero: the hook
 * throws (isError at the consumer, which renders no figure and says the panel
 * cannot be read), while an empty array is a genuine zero - either the screen
 * has no mapped paths at all, in which case it can have fired no events, or it
 * has paths and no events in the window.
 */
export function useScreenTopEvents(routePattern: string | null, days: number) {
  return useQuery({
    queryKey: ['admin', 'screen-analytics', 'events', routePattern, days],
    enabled: !!routePattern,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ScreenEventRow[]> => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: paths, error: pErr } = await supabase.rpc(
        'get_screen_event_paths' as never,
        { p_route_pattern: routePattern as string } as never,
      );
      if (pErr) throw pErr;

      const rawPaths = ((paths ?? []) as { raw_path: string }[])
        .map(p => p.raw_path)
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

