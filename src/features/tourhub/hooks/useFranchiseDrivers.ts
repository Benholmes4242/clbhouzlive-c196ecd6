/**
 * useFranchiseDrivers — per-franchise weekly "driver" line for the Movers tab.
 *
 * A driver is the alumnus whose tournament finish best characterises the
 * franchise's weekly movement. Format: "{LastName} {Finish}" e.g. "McIlroy T2".
 *
 * Selection rule (per Phase 2 brief decision B3):
 * - Look at sr_leaderboards for tournaments ending in [weekStart, weekStart+7d).
 * - Filter to players whose sr_players.college_normalized matches the franchise.
 * - Exclude non-finishers: status IN ('CUT','DNS','DQ','WD') OR position IS NULL.
 * - Pick the row with the highest `money` per franchise.
 * - If no qualifying row, return null → row falls back to "{N} alumni".
 *
 * Position formatting:
 * - position_tied = true  → "T{n}"
 * - else 1/2/3            → "1st"/"2nd"/"3rd"
 * - else n                → "{n}th" (with 11/12/13 special-cased)
 *
 * Batched: one query per Movers-tab render, not per row.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { captainShortName } from '../utils/captainAnchor';

export interface FranchiseDriver {
  /** Pre-formatted display string, e.g. "McIlroy T2" */
  displayText: string;
  /** Last name only, for logging / alt formats */
  lastName: string;
  /** Pre-formatted finish, e.g. "T2", "1st", "14th" */
  finishText: string;
}

/** Format an ordinal finish position. Handles tied flag + 11/12/13 edge case. */
function formatFinish(position: number, tied: boolean): string {
  if (tied) return `T${position}`;
  const lastTwo = position % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${position}th`;
  switch (position % 10) {
    case 1: return `${position}st`;
    case 2: return `${position}nd`;
    case 3: return `${position}rd`;
    default: return `${position}th`;
  }
}

const NON_FINISHER_STATUSES = new Set(['CUT', 'DNS', 'DQ', 'WD']);

/**
 * Returns Map<normalized_name, FranchiseDriver | null> for the supplied slugs.
 * Single batched query; safe to call with empty slug list (returns empty map).
 */
export function useFranchiseDrivers(slugs: string[], weekStart: string | undefined) {
  // Stable cache key from slug list (sorted to dedupe order variance).
  const slugKey = [...slugs].sort().join(',');

  return useQuery({
    queryKey: ['franchise-drivers', slugKey, weekStart],
    queryFn: async (): Promise<Map<string, FranchiseDriver | null>> => {
      const result = new Map<string, FranchiseDriver | null>();
      if (!weekStart || slugs.length === 0) return result;

      // Tournament-week window: [weekStart, weekStart + 7 days).
      // sr_tournaments.end_date is technically nullable but 0 nulls in practice
      // (verified at audit time). Inclusive lower, exclusive upper.
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);
      const weekEndIso = weekEndDate.toISOString().slice(0, 10);

      // Step 1 — find tournaments ending in the week window.
      const { data: tournaments, error: tErr } = await supabase
        .from('sr_tournaments')
        .select('id')
        .gte('end_date', weekStart)
        .lt('end_date', weekEndIso);

      if (tErr) {
        console.error('[useFranchiseDrivers] tournaments query error:', tErr);
        throw tErr;
      }
      const tournamentIds = (tournaments || []).map(t => t.id);
      if (tournamentIds.length === 0) {
        slugs.forEach(s => result.set(s, null));
        return result;
      }

      // Step 2 — single batched leaderboards query joined to players, filtered
      // to alumni of the supplied franchises and non-cut finishers.
      const { data: rows, error: lErr } = await supabase
        .from('sr_leaderboards')
        .select(`
          position,
          position_tied,
          money,
          status,
          sr_players!inner (
            full_name,
            college_normalized
          )
        `)
        .in('tournament_id', tournamentIds)
        .in('sr_players.college_normalized', slugs)
        .not('position', 'is', null)
        .order('money', { ascending: false, nullsFirst: false });

      if (lErr) {
        console.error('[useFranchiseDrivers] leaderboards query error:', lErr);
        throw lErr;
      }

      // Step 3 — pick highest-money finisher per franchise.
      // Rows are already money-desc sorted; first-seen wins.
      for (const row of (rows || []) as Array<{
        position: number | null;
        position_tied: boolean | null;
        money: number | null;
        status: string | null;
        sr_players: { full_name: string; college_normalized: string } | null;
      }>) {
        const player = row.sr_players;
        if (!player?.college_normalized || !player?.full_name) continue;
        if (row.position == null) continue;
        if (row.status && NON_FINISHER_STATUSES.has(row.status)) continue;

        const slug = player.college_normalized;
        if (result.has(slug)) continue; // first (highest-money) wins

        const lastName = captainShortName(player.full_name);
        const finishText = formatFinish(row.position, row.position_tied === true);
        result.set(slug, {
          displayText: `${lastName} ${finishText}`,
          lastName,
          finishText,
        });
      }

      // Fill nulls for franchises with no qualifying finisher.
      slugs.forEach(s => {
        if (!result.has(s)) result.set(s, null);
      });

      return result;
    },
    enabled: slugs.length > 0 && !!weekStart,
    // Driver data only meaningfully changes when a tournament completes (Sunday).
    // Intra-tournament (Thu-Sun), the leader can shuffle as positions change.
    // 1h staleTime balances freshness during live windows against cache reuse
    // off-tournament. Leaderboard cron runs daily; data is week-stable otherwise.
    staleTime: 60 * 60 * 1000,
  });
}
