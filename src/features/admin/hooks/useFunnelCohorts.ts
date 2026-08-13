import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * get_admin_funnel_cohorts - the RPC owns activation and weekly retention.
 *
 * It EXCLUDES admin routes and bot traffic server-side. Do not re-filter in
 * the client, and do not rebuild either shape from analytics_events: sixteen
 * hook files already did that and it is the fault this console spent two weeks
 * recovering from.
 *
 * The funnel is meant to be STRICTLY NESTED - each step a subset of the one
 * above. A step wider than its parent is a DATA fault: surface it, never clamp
 * the bar, or the chart quietly launders the error.
 */
export interface FunnelStep {
  key: string;
  label: string;
  n: number;
}

export interface CohortRow {
  /** ISO date of the signup week start. */
  week: string;
  size: number;
  /** W1..W4 percentages. null = the week has NOT ELAPSED, which is not zero. */
  weeks: (number | null)[];
}

/**
 * NOT a funnel step. "Posted or reviewed" is a SIBLING of the last step, not a
 * child of it: posting does not require having played recently, so it carries
 * its OWN denominator. `of_key` names the parent step - read it, never assume
 * which step that is, and never divide by funnel[0].
 */
export interface FunnelBranch {
  key: string;
  label: string;
  n: number;
  of_key: string;
  of_n: number;
}

export interface FunnelCohorts {
  funnel: FunnelStep[];
  /** null when the RPC predates the branch split. */
  branch: FunnelBranch | null;
  cohorts: CohortRow[];
  computed_at: string;
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

/** Unresolved is not absent: a malformed payload maps to null so panels keep skeletoning. */
function map(raw: unknown): FunnelCohorts | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.funnel) || !Array.isArray(o.cohorts)) return null;

  const funnel: FunnelStep[] = (o.funnel as unknown[]).flatMap(s => {
    if (!s || typeof s !== 'object') return [];
    const r = s as Record<string, unknown>;
    if (typeof r.key !== 'string' || typeof r.label !== 'string') return [];
    return [{ key: r.key, label: r.label, n: num(r.n) }];
  });

  const cohorts: CohortRow[] = (o.cohorts as unknown[]).flatMap(c => {
    if (!c || typeof c !== 'object') return [];
    const r = c as Record<string, unknown>;
    if (typeof r.week !== 'string') return [];
    const weeks = Array.isArray(r.weeks) ? (r.weeks as unknown[]).map(numOrNull) : [];
    return [{ week: r.week, size: num(r.size), weeks }];
  });

  const b = (o.branch && typeof o.branch === 'object') ? o.branch as Record<string, unknown> : null;
  const branch: FunnelBranch | null = (b && typeof b.key === 'string' && typeof b.label === 'string')
    ? {
        key: b.key,
        label: b.label,
        n: num(b.n),
        of_key: typeof b.of_key === 'string' ? b.of_key : '',
        of_n: num(b.of_n),
      }
    : null;

  return {
    funnel,
    branch,
    cohorts,
    computed_at: typeof o.computed_at === 'string' ? o.computed_at : '',
  };
}

export function useFunnelCohorts(weeks = 8) {
  return useQuery<FunnelCohorts | null>({
    queryKey: ['admin-v2', 'analytics', 'funnel-cohorts', weeks],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_funnel_cohorts' as never, { p_weeks: weeks } as never);
      if (error) throw error;
      return map(data);
    },
    staleTime: 5 * 60_000,
  });
}

/** Steps whose count EXCEEDS the step above. Empty is the healthy case. */
export function nestingFaults(funnel: FunnelStep[]): { key: string; n: number; parentKey: string; parentN: number }[] {
  const out: { key: string; n: number; parentKey: string; parentN: number }[] = [];
  for (let i = 1; i < funnel.length; i++) {
    if (funnel[i].n > funnel[i - 1].n) {
      out.push({ key: funnel[i].key, n: funnel[i].n, parentKey: funnel[i - 1].key, parentN: funnel[i - 1].n });
    }
  }
  return out;
}
