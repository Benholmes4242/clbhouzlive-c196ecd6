import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsPeriod, periodToDays } from './useAnalytics';

// ──────────────────────────────────────────────────────────────────────────────
// C2 EVENTS EXPLORER
// ONE bounded query per selected period covering 2x the window so per-event
// current/prior counts and deltas are derived client-side with no second call.
// ──────────────────────────────────────────────────────────────────────────────

export interface RawEventRow {
  name: string;
  user_id: string | null;
  created_at: string;
}

async function fetchEventsWindow(period: AnalyticsPeriod): Promise<{
  rows: RawEventRow[];
  cutoffISO: string;
  windowStartISO: string;
}> {
  const days = periodToDays(period);
  const now = Date.now();
  const cutoff = now - days * 86_400_000;              // start of current window
  const windowStart = now - 2 * days * 86_400_000;     // 2x span (prior + current)
  const { data, error } = await supabase
    .from('analytics_events')
    .select('name, user_id, created_at')
    .gte('created_at', new Date(windowStart).toISOString())
    .limit(50000);
  if (error) throw error;
  return {
    rows: (data as RawEventRow[]) ?? [],
    cutoffISO: new Date(cutoff).toISOString(),
    windowStartISO: new Date(windowStart).toISOString(),
  };
}

export function useEventsExplorer(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'events-explorer', period],
    queryFn: () => fetchEventsWindow(period),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export interface EventAggregate {
  name: string;
  count: number;
  users: number;
  priorCount: number;
  deltaPct: number;
}

export function useEventAggregates(period: AnalyticsPeriod) {
  const q = useEventsExplorer(period);
  const aggregates = useMemo<EventAggregate[]>(() => {
    if (!q.data) return [];
    const cutoff = q.data.cutoffISO;
    const current = new Map<string, { count: number; users: Set<string> }>();
    const prior = new Map<string, number>();
    for (const r of q.data.rows) {
      if (r.created_at >= cutoff) {
        let e = current.get(r.name);
        if (!e) { e = { count: 0, users: new Set() }; current.set(r.name, e); }
        e.count += 1;
        if (r.user_id) e.users.add(r.user_id);
      } else {
        prior.set(r.name, (prior.get(r.name) ?? 0) + 1);
      }
    }
    const out: EventAggregate[] = [];
    for (const [name, { count, users }] of current) {
      const p = prior.get(name) ?? 0;
      const deltaPct = p === 0 ? (count > 0 ? 100 : 0) : Math.round(((count - p) / p) * 100 * 10) / 10;
      out.push({ name, count, users: users.size, priorCount: p, deltaPct });
    }
    out.sort((a, b) => b.count - a.count);
    return out;
  }, [q.data]);

  return { ...q, aggregates };
}

// Per-event daily counts across the current window (client-derived from same rows).
export interface DailyPoint { date: string; value: number }

export function dailyForEvent(
  rows: RawEventRow[],
  cutoffISO: string,
  name: string,
  days: number,
): DailyPoint[] {
  const buckets: Record<string, number> = {};
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of rows) {
    if (r.name !== name) continue;
    if (r.created_at < cutoffISO) continue;
    const k = r.created_at.slice(0, 10);
    if (k in buckets) buckets[k] += 1;
  }
  return Object.entries(buckets).map(([date, value]) => ({
    date: new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    value,
  }));
}

// Detail-sheet fetch: latest 15 occurrences of a specific event (with props).
export interface OccurrenceRow {
  id: string;
  user_id: string | null;
  created_at: string;
  props: Record<string, unknown> | null;
}

async function fetchRecentOccurrences(name: string, cutoffISO: string): Promise<OccurrenceRow[]> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('id, user_id, created_at, props')
    .eq('name', name)
    .gte('created_at', cutoffISO)
    .order('created_at', { ascending: false })
    .limit(15);
  if (error) throw error;
  return (data as OccurrenceRow[]) ?? [];
}

export function useRecentOccurrences(name: string | null, cutoffISO: string | null) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'event-occurrences', name, cutoffISO],
    queryFn: () => fetchRecentOccurrences(name!, cutoffISO!),
    enabled: !!name && !!cutoffISO,
    staleTime: 60_000,
  });
}
