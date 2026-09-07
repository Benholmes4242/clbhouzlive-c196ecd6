/**
 * Audience segment head-counts for the Analytics > Growth "Audiences" grid.
 *
 * SERVER-SIDE ONLY. Every figure comes from get_admin_audiences(), one row
 * computed in Postgres.
 *
 * WHY NOT RAW SELECTS (do not reintroduce them):
 * this hook used to pull analytics_events rows into the browser with a nominal
 * 50,000 limit and count distinct users in JavaScript. PostgREST caps a
 * response at 2000 rows whatever limit you ask for, and with no ORDER BY the
 * rows returned are physical order — the OLDEST slice of an append-only table.
 * Recent activity was therefore never seen: members active last week fell out
 * of the active set and landed in dormant (89 shown against a true 59).
 * Raising the limit does not fix it; adding .order() inverts the bug. The
 * aggregation belongs in the database.
 *
 * POPULATION: user_profiles with deleted_at IS NULL and is_system_account =
 * false — the same set MEMBERS counts, minus the flagged service account.
 * Events belonging to deleted accounts stay as history but join to no member,
 * so they cannot inflate any count.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AudienceSizes {
  /** The population every segment below is a subset of. */
  members: number;
  new_this_week: number;
  active_24h: number;
  dormant_14d: number;
  eg_linked: number;
  eg_issues: number;
  suspended: number;
  /** Funnel figure, NOT an audience: accounts that never confirmed. */
  incomplete_signups: number;
  /** Midnight-anchored. */
  dau_today: number;
  wau: number;
  mau: number;
}

const KEYS: (keyof AudienceSizes)[] = [
  'members', 'new_this_week', 'active_24h', 'dormant_14d', 'eg_linked',
  'eg_issues', 'suspended', 'incomplete_signups', 'dau_today', 'wau', 'mau',
];

function mapRow(raw: unknown): AudienceSizes {
  if (!raw || typeof raw !== 'object') throw new Error('Audiences: no data returned');
  const o = raw as Record<string, unknown>;
  const out = {} as AudienceSizes;
  for (const k of KEYS) {
    const v = o[k];
    const n = typeof v === 'string' ? Number(v) : v;
    if (typeof n !== 'number' || !Number.isFinite(n)) {
      throw new Error(`Audiences: ${k} missing from the RPC payload`);
    }
    out[k] = n;
  }
  return out;
}

/**
 * ARITHMETIC IDENTITIES, not thresholds. A break means a count has stopped
 * describing the member population — show an error, never a number.
 */
export function assertAudienceInvariants(a: AudienceSizes): void {
  const fail = (msg: string) => { throw new Error(`Audiences invariant broken: ${msg}`); };
  if (!(a.dau_today <= a.wau)) fail(`DAU ${a.dau_today} > WAU ${a.wau}`);
  if (!(a.wau <= a.mau)) fail(`WAU ${a.wau} > MAU ${a.mau}`);
  if (!(a.mau <= a.members)) fail(`MAU ${a.mau} > MEMBERS ${a.members}`);
  if (!(a.wau + a.dormant_14d <= a.members)) fail(`WAU ${a.wau} + DORMANT ${a.dormant_14d} > MEMBERS ${a.members}`);
  if (!(a.dormant_14d >= a.members - a.mau)) fail(`DORMANT ${a.dormant_14d} < MEMBERS ${a.members} - MAU ${a.mau}`);
  if (!(a.active_24h + a.dormant_14d <= a.members)) fail(`ACTIVE 24H ${a.active_24h} + DORMANT ${a.dormant_14d} > MEMBERS ${a.members}`);
}

export function useAudiences() {
  return useQuery<AudienceSizes>({
    queryKey: ['admin-v2', 'analytics', 'audiences'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_audiences' as never);
      if (error) throw error;
      const mapped = mapRow(data);
      assertAudienceInvariants(mapped);
      return mapped;
    },
    staleTime: 5 * 60_000,
  });
}
