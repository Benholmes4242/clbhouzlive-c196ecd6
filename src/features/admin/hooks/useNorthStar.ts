/**
 * ⚠️ POSTGREST RETURNS AT MOST 2000 ROWS — whatever `.limit()` says.
 *
 * REMEDIATED (batch 2, pre-emptive). This hook was "not wrong today": its
 * widest raw read was a single 24-hour window at ~1,400 events against the
 * 2000 cap — 70% of the ceiling. It would have broken first on the busiest
 * days and repaired itself on the quiet ones, which is the least detectable
 * failure mode there is. Everything below now comes from
 * get_admin_north_star, one row, counted in Postgres.
 *
 * STANDING RULE: no admin figure is computed by counting rows in the browser.
 * Counting happens in Postgres. A new metric needs an RPC, not a select and a
 * Set.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NorthStarData {
  dauToday: number;
  dauYesterday: number;
  wau: number;
  /**
   * Prior 7-day window (7–14d ago) unique actives. NOW AVAILABLE: a union of
   * unique member ids cannot be derived from a per-day trend, so it is counted
   * in the database instead of reported as missing.
   */
  wauPrev: number | null;
  mau: number;
  signups7d: number;
  signupsPrev7d: number;
  d1Retention: number | null;
  d7Retention: number | null;

  totalUsers: number;
}

interface NorthStarPayload {
  dau_today: number;
  dau_yesterday: number;
  wau: number;
  wau_prev: number;
  mau: number;
  signups_7d: number;
  signups_prev_7d: number;
  total_users: number;
  d1_cohort_size: number;
  d7_cohort_size: number;
  d1_retention: number | null;
  d7_retention: number | null;
}

function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

async function fetchNorthStar(): Promise<NorthStarData> {
  const { data, error } = await supabase.rpc('get_admin_north_star' as never);
  if (error) throw error;
  const p = data as unknown as NorthStarPayload | null;
  if (!p) throw new Error('get_admin_north_star returned no payload');

  const dauToday = p.dau_today ?? 0;
  const wau = p.wau ?? 0;
  const mau = p.mau ?? 0;
  const totalUsers = p.total_users ?? 0;
  const signups7d = p.signups_7d ?? 0;

  // ONE POPULATION. The Members tile and the Audiences grid count the same
  // set: live profiles, service account excluded. These are arithmetic
  // identities, not thresholds - a break means the tile has drifted off the
  // population, so fail loudly rather than render a plausible number.
  if (!(dauToday <= wau)) throw new Error(`North Star invariant broken: DAU ${dauToday} > WAU ${wau}`);
  if (!(wau <= mau)) throw new Error(`North Star invariant broken: WAU ${wau} > MAU ${mau}`);
  if (!(mau <= totalUsers)) throw new Error(`North Star invariant broken: MAU ${mau} > MEMBERS ${totalUsers}`);
  if (!(signups7d <= totalUsers)) {
    throw new Error(`North Star invariant broken: SIGNUPS 7D ${signups7d} > MEMBERS ${totalUsers}`);
  }

  return {
    dauToday,
    dauYesterday: p.dau_yesterday ?? 0,
    wau,
    wauPrev: p.wau_prev ?? null,
    mau,
    signups7d,
    signupsPrev7d: p.signups_prev_7d ?? 0,
    d1Retention: p.d1_retention ?? null,
    d7Retention: p.d7_retention ?? null,
    totalUsers,
  };
}


export function useNorthStar() {
  return useQuery({
    queryKey: ['admin-v2', 'dashboard', 'north-star'],
    queryFn: fetchNorthStar,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export const northStarDelta = calcDelta;
