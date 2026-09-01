import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { currentBuildId } from '@/lib/buildFreshness';

const DAY = 86_400_000;

export interface ErrorRow {
  id: string;
  created_at: string;
  user_id: string | null;
  props: {
    kind?: string;
    message?: string;
    stack?: string;
    route?: string;
    build_id?: string;
  } | null;
}

export interface TopError {
  message: string;
  kind: string;
  count: number;
  users: number;
  last: string;
  rows: ErrorRow[];
}

export interface StabilityData {
  crashFreePct: number | null;
  noErrorsEver: boolean;
  buckets: { date: string; value: number }[];
  topErrors: TopError[];
  totalErrors: number;
  totalErrors7d: number;
  sessions7d: number;
  /** Separated, not discarded — errors reported by clients on another build. */
  outdatedErrors: number;
  outdatedUsers: number;
  outdatedErrors24h: number;
  /** Distinct build ids seen in the 14d error window: the stuck-client count. */
  distinctBuilds: number;
}

// 24h rolling count — feeds the Errors health chip.
export function useErrorCount24h() {
  return useQuery({
    queryKey: ['admin-v2', 'stability', 'count24h'],
    queryFn: async () => {
      const since = new Date(Date.now() - DAY).toISOString();
      // Current build only. An old client's errors are a different fault and
      // must not sit inside this chip.
      const { count, error } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('name', 'app_error')
        .eq('props->>build_id', currentBuildId())
        .gte('created_at', since);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

// Full Stability tab data — 14d bars, top errors, crash-free 7d.
export function useStabilityData() {
  return useQuery<StabilityData>({
    queryKey: ['admin-v2', 'stability', 'data14d'],
    queryFn: async () => {
      const now = Date.now();
      const since14 = new Date(now - 14 * DAY).toISOString();
      const since7 = new Date(now - 7 * DAY).toISOString();

      // Bounded queries — 1000 errors covers ~70/day for 2 weeks, well
      // above our expected volume; sessions capped at 50k like the
      // sibling analytics hooks.
      const [errRes, sessRes] = await Promise.all([
        supabase
          .from('analytics_events')
          .select('id, created_at, user_id, props')
          .eq('name', 'app_error')
          .gte('created_at', since14)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('analytics_events')
          .select('user_id')
          .eq('name', 'session_start')
          .gte('created_at', since7)
          .not('user_id', 'is', null)
          .limit(50000),
      ]);
      if (errRes.error) throw errRes.error;
      if (sessRes.error) throw sessRes.error;

      const allErrRows = (errRes.data ?? []) as ErrorRow[];
      const build = currentBuildId();
      // SEPARATE, DO NOT DISCARD: current-build rows drive every figure below;
      // the rest are counted on their own line so a stuck client is visible
      // rather than hidden inside the crash-free rate.
      const errRows = allErrRows.filter((r) => r.props?.build_id === build);
      const outdatedRows = allErrRows.filter((r) => r.props?.build_id !== build);
      const distinctBuilds = new Set(
        allErrRows.map((r) => r.props?.build_id ?? '(unlabelled)'),
      ).size;
      const sessRows = (sessRes.data ?? []) as { user_id: string }[];

      // ── Crash-free sessions over 7d ─────────────────────────────
      // denom  = distinct users with a session_start in the last 7d.
      // crashed = of those users, how many also logged an app_error
      //           in the same window. We intersect on the session-
      //           having set so signed-out crashes never inflate the
      //           denominator or the numerator. When no errors have
      //           been recorded at all we surface an honest "no errors
      //           recorded" copy rather than 100%-with-a-caveat.
      const errIn7 = errRows.filter((r) => r.created_at >= since7);
      const sessionUsers = new Set(sessRows.map((r) => r.user_id));
      const crashedUsers = new Set(
        errIn7
          .map((r) => r.user_id)
          .filter((u): u is string => !!u && sessionUsers.has(u)),
      );
      const denom = sessionUsers.size;
      const crashFreePct =
        denom > 0
          ? Math.max(0, Math.min(100, ((denom - crashedUsers.size) / denom) * 100))
          : null;

      // ── 14d bars ────────────────────────────────────────────────
      const buckets: { date: string; value: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now - i * DAY);
        buckets.push({ date: d.toISOString().slice(0, 10), value: 0 });
      }
      const idx = new Map(buckets.map((b, i) => [b.date, i] as const));
      for (const r of errRows) {
        const key = new Date(r.created_at).toISOString().slice(0, 10);
        const i = idx.get(key);
        if (i != null) buckets[i].value += 1;
      }

      // ── Top errors grouped by message ───────────────────────────
      const groups = new Map<string, TopError & { userSet: Set<string> }>();
      for (const r of errRows) {
        const msg = (r.props?.message ?? '(no message)').trim() || '(no message)';
        const kind = r.props?.kind ?? 'error';
        let g = groups.get(msg);
        if (!g) {
          g = {
            message: msg,
            kind,
            count: 0,
            users: 0,
            last: r.created_at,
            rows: [],
            userSet: new Set<string>(),
          };
          groups.set(msg, g);
        }
        g.count += 1;
        if (r.user_id) g.userSet.add(r.user_id);
        if (r.created_at > g.last) g.last = r.created_at;
        g.rows.push(r);
      }
      const topErrors: TopError[] = [...groups.values()]
        .map((g) => ({
          message: g.message,
          kind: g.kind,
          count: g.count,
          users: g.userSet.size,
          last: g.last,
          rows: g.rows,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        crashFreePct,
        noErrorsEver: errRows.length === 0,
        buckets,
        topErrors,
        totalErrors: errRows.length,
        totalErrors7d: errIn7.length,
        sessions7d: denom,
        outdatedErrors: outdatedRows.length,
        outdatedUsers: new Set(outdatedRows.map((r) => r.user_id).filter(Boolean)).size,
        outdatedErrors24h: outdatedRows.filter(
          (r) => r.created_at >= new Date(now - DAY).toISOString(),
        ).length,
        distinctBuilds,
      };
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
