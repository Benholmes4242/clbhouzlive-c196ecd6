/**
 * BRIEF_HEALTH data layer. Every Health lens figure comes from the
 * get_admin_health_* RPCs (plus the existing service hooks); nothing here
 * reads a table. Mappers keep missing values as null: null is not zero.
 */
import { useEffect } from 'react';
import {
  useInfiniteQuery, useMutation, useQuery, useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { currentBuildId } from '@/lib/buildFreshness';
import { plainJobName } from '../components/health/jobNames';

const rpc = (name: string, args?: Record<string, unknown>) => (supabase.rpc as any)(name, args);
const n = (v: unknown): number | null => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const s = (v: unknown): string | null => (v == null ? null : String(v));
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

function useAdminRefetch(refetch: () => unknown) {
  useEffect(() => {
    const h = () => { void refetch(); };
    window.addEventListener('admin-v2:refetch', h);
    return () => window.removeEventListener('admin-v2:refetch', h);
  }, [refetch]);
}

// ─── Golf ──────────────────────────────────────────────────────────────────
export interface HealthGolf {
  promise: { median_hrs: number | null; slowest_hrs: number | null; rounds: number | null; target_hrs: number; days: { d: string; n: number | null; median_hrs: number | null }[] };
  journey: { posted: number | null; posted_with_time: number | null; synced_median_mins: number | null; holes: number | null; analysed: number | null; analysed_median_secs: number | null; matched: number | null; seen: number | null; seen_median_mins: number | null };
  connections: { connected: number | null; fresh: number | null; stale: number | null; reauth: number | null; failing: number | null; next_sync_at: string | null; oldest: { user_id: string; name: string | null; last_synced_at: string | null; status: string | null; last_round: string | null; rounds: number | null }[] };
  quality: { rounds: number | null; hole_detail: number | null; course_matched: number | null; rating_slope: number | null; played_courses: number | null; played_on_map: number | null };
  unmatched: { courses: number | null; rounds: number | null; rows: { name: string; rounds: number | null; members: number | null; last_played: string | null }[] };
  stuck: { waiting: number | null; stuck: number | null; oldest_wait_secs: number | null; failed_7d: number | null; median_process_secs: number | null };
}

export function mapGolf(raw: any): HealthGolf {
  const d = raw ?? {};
  const p = d.promise ?? {}, j = d.journey ?? {}, c = d.connections ?? {}, q = d.quality ?? {}, u = d.unmatched ?? {}, st = d.stuck ?? {};
  return {
    promise: {
      median_hrs: n(p.median_hrs), slowest_hrs: n(p.slowest_hrs), rounds: n(p.rounds), target_hrs: n(p.target_hrs) ?? 6,
      days: arr(p.days).map((x) => ({ d: String(x?.d ?? ''), n: n(x?.n), median_hrs: n(x?.median_hrs) })),
    },
    journey: {
      posted: n(j.posted), posted_with_time: n(j.posted_with_time), synced_median_mins: n(j.synced_median_mins), holes: n(j.holes),
      analysed: n(j.analysed), analysed_median_secs: n(j.analysed_median_secs), matched: n(j.matched), seen: n(j.seen), seen_median_mins: n(j.seen_median_mins),
    },
    connections: {
      connected: n(c.connected), fresh: n(c.fresh), stale: n(c.stale), reauth: n(c.reauth), failing: n(c.failing), next_sync_at: s(c.next_sync_at),
      oldest: arr(c.oldest).map((x) => ({ user_id: String(x?.user_id ?? ''), name: s(x?.name), last_synced_at: s(x?.last_synced_at), status: s(x?.status), last_round: s(x?.last_round), rounds: n(x?.rounds) })),
    },
    quality: { rounds: n(q.rounds), hole_detail: n(q.hole_detail), course_matched: n(q.course_matched), rating_slope: n(q.rating_slope), played_courses: n(q.played_courses), played_on_map: n(q.played_on_map) },
    unmatched: { courses: n(u.courses), rounds: n(u.rounds), rows: arr(u.rows).map((x) => ({ name: String(x?.name ?? ''), rounds: n(x?.rounds), members: n(x?.members), last_played: s(x?.last_played) })) },
    stuck: { waiting: n(st.waiting), stuck: n(st.stuck), oldest_wait_secs: n(st.oldest_wait_secs), failed_7d: n(st.failed_7d), median_process_secs: n(st.median_process_secs) },
  };
}

export function useHealthGolf(): UseQueryResult<HealthGolf> {
  const q = useQuery({
    queryKey: ['admin-v2', 'health', 'golf'],
    queryFn: async () => { const { data, error } = await rpc('get_admin_health_golf'); if (error) throw error; return mapGolf(data); },
    staleTime: 60_000, refetchInterval: 120_000,
  });
  useAdminRefetch(q.refetch);
  return q;
}

// ─── App ───────────────────────────────────────────────────────────────────
export interface HealthApp {
  build_id: string | null;
  sessions_7d: number | null; sessions_7d_current: number | null; crashed_sessions_7d: number | null;
  errors_7d_current: number | null; errors_14d: number | null; errors_14d_old: number | null;
  old_build_members: number | null; old_error_members: number | null; old_build_ids: number | null;
  last_current_error_at: string | null; last_test_at: string | null;
  builds: { tracked_sessions: number | null; current: number | null; previous: number | null; older: number | null; older_builds: number | null; current_first_seen: string | null; tracking_since: string | null };
  old_members: { user_id: string; name: string | null; build: string | null; last_seen: string | null; errors: number | null }[];
  daily: { d: string; current: number | null; old: number | null }[];
  top: { message: string; n: number | null; members: number | null; last_at: string | null; on_current: boolean }[];
}

export function mapApp(raw: any): HealthApp {
  const d = raw ?? {}; const b = d.builds ?? {};
  return {
    build_id: s(d.build_id),
    sessions_7d: n(d.sessions_7d), sessions_7d_current: n(d.sessions_7d_current), crashed_sessions_7d: n(d.crashed_sessions_7d),
    errors_7d_current: n(d.errors_7d_current), errors_14d: n(d.errors_14d), errors_14d_old: n(d.errors_14d_old),
    old_build_members: n(d.old_build_members), old_error_members: n(d.old_error_members), old_build_ids: n(d.old_build_ids),
    last_current_error_at: s(d.last_current_error_at), last_test_at: s(d.last_test_at),
    builds: { tracked_sessions: n(b.tracked_sessions), current: n(b.current), previous: n(b.previous), older: n(b.older), older_builds: n(b.older_builds), current_first_seen: s(b.current_first_seen), tracking_since: s(b.tracking_since) },
    old_members: arr(d.old_members).map((x) => ({ user_id: String(x?.user_id ?? ''), name: s(x?.name), build: s(x?.build), last_seen: s(x?.last_seen), errors: n(x?.errors) })),
    daily: arr(d.daily).map((x) => ({ d: String(x?.d ?? ''), current: n(x?.current), old: n(x?.old) })),
    top: arr(d.top).map((x) => ({ message: String(x?.message ?? ''), n: n(x?.n), members: n(x?.members), last_at: s(x?.last_at), on_current: !!x?.on_current })),
  };
}

export function useHealthApp(): UseQueryResult<HealthApp> {
  const build = currentBuildId();
  const q = useQuery({
    queryKey: ['admin-v2', 'health', 'app', build],
    queryFn: async () => { const { data, error } = await rpc('get_admin_health_app', { p_build_id: build }); if (error) throw error; return mapApp(data); },
    staleTime: 60_000,
  });
  useAdminRefetch(q.refetch);
  return q;
}

// ─── Jobs ──────────────────────────────────────────────────────────────────
export type JobState = 'failing' | 'never_ok' | 'not_run' | 'paused' | 'running' | 'ok';
export interface HealthJob {
  id: number; name: string; schedule: string; active: boolean; state: JobState;
  runs: number | null; ok: number | null; failed: number | null;
  last_run_at: string | null; last_ok_at: string | null; last_status: string | null; last_error: string | null; last_secs: number | null;
  recent: string[];
}
export interface HealthJobs {
  total: number | null; healthy: number | null; failing: number | null; never_ok: number | null; not_run: number | null; paused: number | null;
  history_from: string | null; jobs: HealthJob[];
}

const STATES: JobState[] = ['failing', 'never_ok', 'not_run', 'paused', 'running', 'ok'];
export function mapJobs(raw: any): HealthJobs {
  const d = raw ?? {};
  return {
    total: n(d.total), healthy: n(d.healthy), failing: n(d.failing), never_ok: n(d.never_ok), not_run: n(d.not_run), paused: n(d.paused),
    history_from: s(d.history_from),
    jobs: arr(d.jobs).map((x) => ({
      id: Number(x?.id), name: String(x?.name ?? ''), schedule: String(x?.schedule ?? ''), active: x?.active !== false,
      state: (STATES as string[]).includes(x?.state) ? x.state : 'ok',
      runs: n(x?.runs), ok: n(x?.ok), failed: n(x?.failed),
      last_run_at: s(x?.last_run_at), last_ok_at: s(x?.last_ok_at), last_status: s(x?.last_status), last_error: s(x?.last_error), last_secs: n(x?.last_secs),
      recent: arr(x?.recent).map(String).slice(-10),
    })),
  };
}

export function useHealthJobs(): UseQueryResult<HealthJobs> {
  const q = useQuery({
    queryKey: ['admin-v2', 'health', 'jobs'],
    queryFn: async () => { const { data, error } = await rpc('get_admin_health_jobs'); if (error) throw error; return mapJobs(data); },
    staleTime: 60_000, refetchInterval: 120_000,
  });
  useAdminRefetch(q.refetch);
  return q;
}

// ─── Admin log ─────────────────────────────────────────────────────────────
export type LogKind = 'all' | 'courses' | 'accounts' | 'content' | 'jobs';
export interface HealthLogRow {
  id: string; action: string; kind: string | null; at: string; admin: string | null; admin_user_id: string | null;
  target_email: string | null; details: Record<string, unknown> | null;
}
export interface HealthLogPage { rows: HealthLogRow[]; has_more: boolean }

export function mapLog(raw: any): HealthLogPage {
  const d = raw ?? {};
  return {
    rows: arr(d.rows).map((x) => ({
      id: String(x?.id ?? ''), action: String(x?.action ?? ''), kind: s(x?.kind), at: String(x?.at ?? ''),
      admin: s(x?.admin), admin_user_id: s(x?.admin_user_id), target_email: s(x?.target_email),
      details: x?.details && typeof x.details === 'object' && !Array.isArray(x.details) ? x.details : null,
    })),
    has_more: !!d.has_more,
  };
}

export function useHealthLog(kind: LogKind) {
  const q = useInfiniteQuery({
    queryKey: ['admin-v2', 'health', 'log', kind],
    initialPageParam: null as { at: string; id: string } | null,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await rpc('get_admin_health_log', {
        p_kind: kind, p_before: pageParam?.at ?? null, p_before_id: pageParam?.id ?? null, p_limit: 25,
      });
      if (error) throw error;
      return mapLog(data);
    },
    getNextPageParam: (last) => {
      if (!last.has_more || !last.rows.length) return undefined;
      const r = last.rows[last.rows.length - 1];
      return { at: r.at, id: r.id };
    },
    staleTime: 60_000,
  });
  useAdminRefetch(q.refetch);
  return q;
}

// ─── Job mutations ─────────────────────────────────────────────────────────
function useInvalidateJobs() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['admin-v2', 'health', 'jobs'] });
    void qc.invalidateQueries({ queryKey: ['admin-v2', 'health', 'log'] });
  };
}

export function useRunJob() {
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: async (job: { id: number; name: string }) => {
      const { data, error } = await rpc('admin_run_cron_job', { p_jobid: job.id });
      if (error) throw error;
      return { job, r: (data ?? {}) as { ok?: boolean; dispatched?: boolean; error?: string | null; secs?: number | null } };
    },
    onSuccess: ({ job, r }) => {
      const name = plainJobName(job.name);
      if (r.ok && r.dispatched) toast.success(`Started ${name}`, { description: "It runs in the background; check the job's own output." });
      else if (r.ok) toast.success(`Ran ${name} in ${r.secs ?? '-'}s`);
      else toast.error(`${name} failed`, { description: r.error ?? undefined });
    },
    onError: (e: any, job) => toast.error(`${plainJobName(job.name)} failed`, { description: e?.message }),
    onSettled: invalidate,
  });
}

export function useSetJobActive() {
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: async (v: { id: number; name: string; active: boolean }) => {
      const { error } = await rpc('admin_set_cron_job_active', { p_jobid: v.id, p_active: v.active });
      if (error) throw error;
      return v;
    },
    onSuccess: (v) => toast.success(`${v.active ? 'Resumed' : 'Paused'} ${plainJobName(v.name)}`),
    onError: (e: any, v) => toast.error(`${plainJobName(v.name)} failed`, { description: e?.message }),
    onSettled: invalidate,
  });
}
