/** EFFECTIVE ROUND WITHOUT THE FIELD — owner of the cheap read that gives
 * exactly effectiveCurrentRound(providerRound, rows) (liveStateRules.ts) for
 * surfaces that do not load the board. Consumers that already hold the full
 * field rows (overview, feed post) keep calling effectiveCurrentRound(rows).
 *
 * Probes: existence reads on sr_leaderboards (select id, limit 1) for active
 * rows (status null or not MC/CUT/WD/DQ/DNS/MDF, as isActiveEntry) with a
 * non-null round_n for any n >= k, walking k = providerRound - 1 down to 1.
 * The first probe covers round p-1 and every later round, because a score in
 * any of them gives the answer p (min(p, highest + 1)) — this keeps a cancelled
 * round or a lagging provider exact. Normal case: one probe; a provider one
 * round ahead (RSM): two. When no round has scores, one
 * extra probe asks whether any active row exists: none = empty board, keep the
 * provider round (the 21d55d1 rule); some = round 1.
 * One query key per (tournament, provider round), shared by every consumer;
 * while loading (or not live) the provider round is returned. */
import { useQueries, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const OUT = ['MC', 'CUT', 'WD', 'DQ', 'DNS', 'MDF'];
// isActiveEntry upper-cases; PostgREST `in` is exact, so list the stored casings.
const OUT_ANY_CASE = [...new Set(OUT.flatMap((s) => [s, s.toLowerCase(), s[0] + s.slice(1).toLowerCase()]))];
const ACTIVE_FILTER = `status.is.null,status.not.in.(${OUT_ANY_CASE.join(',')})`;
const MAX_CARD = 4; // effectiveCurrentRound reads round_1..round_4

export const EFFECTIVE_ROUND_STALE_MS = 60_000;
export const effectiveRoundKey = (tournamentId: string | null | undefined, providerRound: number) =>
  ['tourhub', 'effective-round', tournamentId ?? null, providerRound] as const;

export function normaliseProvider(providerRound: number | null | undefined): number {
  return providerRound != null && Number.isFinite(providerRound) && providerRound >= 1 ? Math.floor(providerRound) : 1;
}

/** Any active row with a score in round `from` or later (null = any active row). */
async function probe(tournamentId: string, from: number | null): Promise<boolean> {
  let q = supabase.from('sr_leaderboards').select('id').eq('tournament_id', tournamentId).or(ACTIVE_FILTER);
  if (from != null) {
    const cols: string[] = [];
    for (let n = from; n <= MAX_CARD; n++) cols.push(`round_${n}.not.is.null`);
    q = q.or(cols.join(','));
  }
  const { data, error } = await q.limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function readEffectiveRound(tournamentId: string, providerRound: number): Promise<number> {
  const p = normaliseProvider(providerRound);
  if (p === 1) return 1;
  for (let n = Math.min(p - 1, MAX_CARD); n >= 1; n--) {
    // Nothing scored from round n+1 on (earlier probe), so a hit means highest = n, or more only on the first probe (answer p either way).
    if (await probe(tournamentId, n)) return Math.max(1, Math.min(p, n + 1));
  }
  return (await probe(tournamentId, null)) ? 1 : p;
}

function options(tournamentId: string | null | undefined, providerRound: number | null | undefined, live: boolean) {
  const p = normaliseProvider(providerRound);
  return {
    queryKey: effectiveRoundKey(tournamentId, p),
    enabled: Boolean(tournamentId && live && providerRound != null && p > 1),
    staleTime: EFFECTIVE_ROUND_STALE_MS,
    refetchInterval: EFFECTIVE_ROUND_STALE_MS,
    queryFn: () => readEffectiveRound(tournamentId as string, p),
  };
}

/** Effective round for one event. `live` = the event is in progress; other
 * events never probe. Null provider round stays null. */
export function useEffectiveRound(tournamentId: string | null | undefined, providerRound: number | null | undefined, live = true): number | null {
  const q = useQuery(options(tournamentId, providerRound, live));
  if (providerRound == null) return null;
  return live && q.data != null ? q.data : providerRound;
}

/** Same reads for a list (island, side menu); keys are shared with useEffectiveRound. */
export function useEffectiveRounds(events: ReadonlyArray<{ id: string; currentRound: number | null; live: boolean }>): Map<string, number | null> {
  const results = useQueries({ queries: events.map((e) => options(e.id, e.currentRound, e.live)) });
  return new Map(events.map((e, i) => [e.id, e.currentRound == null ? null : e.live && results[i]?.data != null ? results[i].data! : e.currentRound]));
}
