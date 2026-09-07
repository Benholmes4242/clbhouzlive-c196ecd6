/**
 * EVENTS EXPLORER — server-side aggregation only.
 *
 * This file used to pull raw analytics_events into the browser. PostgREST caps
 * any response at 2000 rows whatever `.limit()` says, and this window holds
 * ~226,000 rows over 180 days, so every count, unique-member figure and delta
 * on that screen was computed from 0.9% of the data. All of it was fiction.
 *
 * THE STANDING RULE: no admin figure is computed by counting rows in the
 * browser. Counting happens in Postgres. There is no raw select in this file.
 *
 * WHAT THIS SCREEN IS FOR: instrumentation, not behaviour. Does this event
 * fire, how often, for how many distinct members, when was it last seen, and
 * has it STOPPED. Behaviour measurement has five purpose-built homes already
 * (Overview, North Star, Audiences, Screens, Funnels) and duplicating them
 * here is exactly the drift we spent the week removing.
 *
 * Search matches event NAME only. There is no GIN index on analytics_events.props
 * — only narrow expression indexes on props->>'path'/'tag'/'user_id' — so a
 * containment search over 226k jsonb rows would be an unindexed scan. Properties
 * are read in the drill-down, which returns the full props payload.
 *
 * Indexes relied on (verified 7 Sep 2026):
 *   ae_name_time_idx / idx_ae_name_created  (name, created_at)
 *   ae_created_at_idx / analytics_events_created_at_idx (created_at)
 * Measured aggregate timings: 30d window (+30d prior) 230ms, 180d (+180d) 463ms.
 */
import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsPeriod, periodToDays } from './useAnalytics';

// The function clamps p_days to this too — the cap lives in Postgres, not the UI.
export const EVENTS_MAX_DAYS = 180;

export type EventSort = 'count' | 'users' | 'last_seen' | 'name';

export interface EventAggregate {
  name: string;
  count: number;
  users: number;
  priorCount: number;
  priorUsers: number;
  /** null when the prior window was empty — a new event, not a rise from zero. */
  deltaCountPct: number | null;
  deltaUsersPct: number | null;
  /** Fired in the prior window, silent in this one. A release broke tracking. */
  stopped: boolean;
  lastSeenAt: string | null;
}

export interface EventAggregatePage {
  windowDays: number;
  windowFrom: string;
  distinctNames: number;
  stoppedNames: number;
  windowEvents: number;
  windowMembers: number;
  rows: EventAggregate[];
}

function mapAggregates(payload: any): EventAggregatePage {
  return {
    windowDays: Number(payload?.window_days ?? 0),
    windowFrom: String(payload?.window_from ?? ''),
    distinctNames: Number(payload?.distinct_names ?? 0),
    stoppedNames: Number(payload?.stopped_names ?? 0),
    windowEvents: Number(payload?.window_events ?? 0),
    windowMembers: Number(payload?.window_members ?? 0),
    rows: (payload?.rows ?? []).map((r: any): EventAggregate => ({
      name: String(r.name),
      count: Number(r.count ?? 0),
      users: Number(r.users ?? 0),
      priorCount: Number(r.prior_count ?? 0),
      priorUsers: Number(r.prior_users ?? 0),
      deltaCountPct: r.delta_count_pct === null || r.delta_count_pct === undefined
        ? null : Number(r.delta_count_pct),
      deltaUsersPct: r.delta_users_pct === null || r.delta_users_pct === undefined
        ? null : Number(r.delta_users_pct),
      stopped: !!r.stopped,
      lastSeenAt: r.last_seen_at ?? null,
    })),
  };
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function useEventAggregates(
  period: AnalyticsPeriod,
  opts: { search?: string; sort?: EventSort; limit?: number } = {},
) {
  const days = Math.min(periodToDays(period), EVENTS_MAX_DAYS);
  const search = (opts.search ?? '').trim();
  const sort = opts.sort ?? 'count';
  const limit = opts.limit ?? 250;

  const q = useQuery({
    queryKey: ['admin-v2', 'analytics', 'event-aggregates', days, search, sort, limit],
    queryFn: async (): Promise<EventAggregatePage> => {
      const { data, error } = await supabase.rpc('get_admin_event_aggregates', {
        p_days: days,
        p_search: search || null,
        p_sort: sort,
        p_limit: limit,
        p_offset: 0,
      });
      if (error) throw error;
      return mapAggregates(data);
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return { ...q, page: q.data ?? null, aggregates: q.data?.rows ?? [] };
}

// ── Per-event daily history: count AND distinct members ──────────────────────
export interface DailyPoint { date: string; count: number; users: number }

export function useEventDaily(name: string | null, period: AnalyticsPeriod) {
  const days = Math.min(periodToDays(period), EVENTS_MAX_DAYS);
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'event-daily', name, days],
    enabled: !!name,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<DailyPoint[]> => {
      const { data, error } = await supabase.rpc('get_admin_event_daily', {
        p_name: name!,
        p_days: days,
        p_tz: 'UTC',
      });
      if (error) throw error;
      return ((data as any)?.points ?? []).map((p: any): DailyPoint => ({
        date: String(p.date),
        count: Number(p.count ?? 0),
        users: Number(p.users ?? 0),
      }));
    },
  });
}

// ── Drill-down: keyset-paged raw rows, WITH the full props payload ────────────
// app_error is worthless without message, stack and build, and those live in props.
export interface OccurrenceRow {
  id: string;
  user_id: string | null;
  created_at: string;
  props: Record<string, unknown> | null;
}

interface OccurrencePage {
  rows: OccurrenceRow[];
  nextBeforeAt: string | null;
  nextBeforeId: string | null;
  hasMore: boolean;
}

export function useEventOccurrences(name: string | null, period: AnalyticsPeriod, pageSize = 50) {
  const days = Math.min(periodToDays(period), EVENTS_MAX_DAYS);
  return useInfiniteQuery({
    queryKey: ['admin-v2', 'analytics', 'event-occurrences', name, days, pageSize],
    enabled: !!name,
    staleTime: 60_000,
    initialPageParam: { at: null as string | null, id: null as string | null },
    queryFn: async ({ pageParam }): Promise<OccurrencePage> => {
      const { data, error } = await supabase.rpc('get_admin_event_occurrences', {
        p_name: name!,
        p_days: days,
        p_before_at: pageParam.at,
        p_before_id: pageParam.id,
        p_limit: pageSize,
      });
      if (error) throw error;
      const d = data as any;
      return {
        rows: (d?.rows ?? []) as OccurrenceRow[],
        nextBeforeAt: d?.next_before_at ?? null,
        nextBeforeId: d?.next_before_id ?? null,
        hasMore: !!d?.has_more,
      };
    },
    getNextPageParam: (last) =>
      last.hasMore && last.nextBeforeAt
        ? { at: last.nextBeforeAt, id: last.nextBeforeId }
        : undefined,
  });
}

// ── app_error, grouped by MESSAGE + BUILD ────────────────────────────────────
// All app_error rows share one name, so name-grouping renders the single most
// valuable diagnostic on this screen as one useless row.
export interface AppErrorGroup {
  message: string;
  build: string;
  count: number;
  users: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface AppErrorsView {
  totalErrors: number;
  distinctGroups: number;
  membersAffected: number;
  rows: AppErrorGroup[];
}

export function useAppErrors(period: AnalyticsPeriod) {
  const days = Math.min(periodToDays(period), EVENTS_MAX_DAYS);
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'app-errors', days],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AppErrorsView> => {
      const { data, error } = await supabase.rpc('get_admin_app_errors', {
        p_days: days,
        p_limit: 100,
        p_offset: 0,
      });
      if (error) throw error;
      const d = data as any;
      return {
        totalErrors: Number(d?.total_errors ?? 0),
        distinctGroups: Number(d?.distinct_groups ?? 0),
        membersAffected: Number(d?.members_affected ?? 0),
        rows: (d?.rows ?? []).map((r: any): AppErrorGroup => ({
          message: String(r.message ?? '(no message)'),
          build: String(r.build ?? '(unknown build)'),
          count: Number(r.count ?? 0),
          users: Number(r.users ?? 0),
          firstSeenAt: String(r.first_seen_at ?? ''),
          lastSeenAt: String(r.last_seen_at ?? ''),
        })),
      };
    },
  });
}
