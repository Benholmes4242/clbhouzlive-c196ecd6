import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * get_admin_member_actions - deliberate member actions in a rolling window.
 *
 * Admin routes and bot traffic are excluded SERVER-SIDE; do not re-filter here.
 * The RPC returns actions ordered by times desc - render as given.
 *
 * TIMES and MEMBERS are separate because the split is the finding: 29 opens by
 * one member is one enthusiast, not adoption, and a single count cannot tell
 * you which you are looking at.
 */
export interface MemberAction {
  name: string;
  times: number;
  members: number;
  prev_times: number;
}

export interface MemberActions {
  window_days: number;
  computed_at: string;
  totals: { events: number; members: number };
  actions: MemberAction[];
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function map(raw: unknown): MemberActions | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.actions)) return null;
  const totals = (o.totals && typeof o.totals === 'object') ? o.totals as Record<string, unknown> : {};
  return {
    window_days: num(o.window_days),
    computed_at: typeof o.computed_at === 'string' ? o.computed_at : '',
    totals: { events: num(totals.events), members: num(totals.members) },
    actions: (o.actions as unknown[]).flatMap(a => {
      if (!a || typeof a !== 'object') return [];
      const r = a as Record<string, unknown>;
      if (typeof r.name !== 'string') return [];
      return [{ name: r.name, times: num(r.times), members: num(r.members), prev_times: num(r.prev_times) }];
    }),
  };
}

export function useMemberActions(days = 7) {
  return useQuery<MemberActions | null>({
    queryKey: ['admin-v2', 'analytics', 'member-actions', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_member_actions' as never, { p_days: days } as never);
      if (error) throw error;
      return map(data);
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * snake_case in, sentence case out. NO LOOKUP TABLE: an event added tomorrow
 * must read sensibly with no client change. Known initialisms are upper-cased
 * from a short list of ACRONYMS, which is not a list of event names.
 */
const ACRONYMS = new Set(['whs', 'hio', 'ai', 'gam', 'pga', 'id', 'url', 'cta', 'ui', 'dp']);

export function humaniseActionName(name: string): string {
  const words = name.replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  if (words.length === 0 || words[0] === '') return name;
  const mapped = words.map(w => {
    const lower = w.toLowerCase();
    if (ACRONYMS.has(lower)) return lower.toUpperCase();
    // t100 / v2 style tokens keep their digits and read better upper-cased.
    if (/^[a-z]\d+$/.test(lower)) return lower.toUpperCase();
    return lower;
  });
  const first = mapped[0];
  mapped[0] = first === first.toUpperCase() ? first : first.charAt(0).toUpperCase() + first.slice(1);
  return mapped.join(' ');
}
