import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ──────────────────────────────────────────────────────────────────────────────
// C2 LIVE TAB HOOKS
// - useLiveInApp (5-min distinct users) lives in useOverviewMetrics.ts so the
//   Dashboard Right-Now strip and the Analytics Live card share ONE query key
//   ['admin-v2','overview','live-in-app'] and never double-poll.
// - This file owns the 30-minute window feed used by Live's chart + stream +
//   top-screens section, and a bounded profiles-by-ids fetch for row labels.
// - All polling queries are visibility-gated: they pause when the tab is
//   backgrounded (document.visibilityState === 'hidden').
// ──────────────────────────────────────────────────────────────────────────────

const gatedInterval = (ms: number) => () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden'
    ? false
    : ms;

export interface LiveEventRow {
  id: string;
  name: string;
  user_id: string | null;
  created_at: string;
  props: Record<string, unknown> | null;
}

async function fetchLast30mEvents(): Promise<LiveEventRow[]> {
  const since = new Date(Date.now() - 30 * 60_000).toISOString();
  const { data, error } = await supabase
    .from('analytics_events')
    .select('id, name, user_id, created_at, props')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data as LiveEventRow[]) ?? [];
}

// 30-minute event dataset. Powers: minute bar chart, event stream (latest 25),
// top screens right now, and who-is-here labeling.
export function useLiveWindow30m() {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'live-30m'],
    queryFn: fetchLast30mEvents,
    refetchInterval: gatedInterval(15_000),
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
}

// ─── Profiles enrichment (non-polling; runs only when ids change) ────────────

export interface LiteProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
}

async function fetchProfilesByIds(ids: string[]): Promise<Record<string, LiteProfile>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .in('id', ids)
    .limit(ids.length);
  if (error) throw error;
  const map: Record<string, LiteProfile> = {};
  for (const p of (data as LiteProfile[]) ?? []) map[p.id] = p;
  return map;
}

export function useProfilesByIds(ids: string[]) {
  const sortedKey = [...ids].sort().join(',');
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'profiles-by-ids', sortedKey],
    queryFn: () => fetchProfilesByIds(ids),
    enabled: ids.length > 0,
    staleTime: 60_000,
  });
}
