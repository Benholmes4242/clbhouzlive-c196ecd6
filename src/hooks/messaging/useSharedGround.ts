/**
 * BRIEF_MESSAGES_ECHO_PALETTE §2.3 / §4.2 — the golf you have played together.
 *
 * §4.2 USE THE SHARED-ROUND DATA THAT ALREADY EXISTS. It does:
 *   count_shared_rounds_batch  — ONE request for the whole visible list.
 *   detect_shared_rounds       — the actual rounds for ONE pair.
 * Both are already shipped for the compare sheet, and this module reuses their
 * exact query keys (['whs-shared-round-counts', ...] / ['whs-shared-rounds',
 * ...]) so a member who opened Compare this session pays nothing here.
 *
 * COST, MEASURED HONESTLY: the inbox issues ONE batched count query for every
 * direct thread, then ONE detail query per thread that actually HAS shared
 * rounds, capped at the twelve rows that fit on screen. Threads with a zero
 * count never issue a detail query, which is the common case.
 *
 * DEDUPE (MS2 §1): detect_shared_rounds joins whs_scores on (play_date,
 * course_id) with no cardinality guard, so a member with two rounds the same
 * day at the same course against a rival with two produces four rows.
 * fetchSharedRounds now dedupes before counting, so the count, the records
 * and the 90-day figure all describe real rounds.
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  fetchSharedRounds,
  fetchSharedRoundCounts,
  dedupeSharedRounds,
  type SharedRoundResult,
} from '@/lib/whs/api';

// MS2 §1 — the helper moved to lib/whs/api; re-export so existing imports
// (ms1MessagesHeadToHead.test) keep working.
export { dedupeSharedRounds };

export interface SharedGround {
  /** Rounds played together, most recent first, deduped. */
  rounds: SharedRoundResult[];
  count: number;
  lastCourseName: string | null;
  lastPlayDate: string | null;
  /** MS1 §1 — the head-to-head record from the deduped rounds; null when none. */
  record: HeadToHeadRecord | null;
}

/** MS1 §1 — W/L/H tallies; H is a halved round (the RPC's T). */
export interface HeadToHeadRecord {
  points: { w: number; l: number; h: number };
  gross: { w: number; l: number; h: number };
  /** Newest first, at most five, from stableford_outcome (T → H). */
  lastFive: ('W' | 'L' | 'H')[];
}

const EMPTY: SharedGround = {
  rounds: [],
  count: 0,
  lastCourseName: null,
  lastPlayDate: null,
  record: null,
};

/**
 * MS1 §1 — the record is computed from the DEDUPED rounds. MS2 §1: the count
 * is now the same deduped figure, so record and count always agree. Returns
 * null when there are no rounds.
 */
export function headToHead(rounds: SharedRoundResult[]): HeadToHeadRecord | null {
  const deduped = dedupeSharedRounds(rounds);
  if (deduped.length === 0) return null;
  const points = { w: 0, l: 0, h: 0 };
  const gross = { w: 0, l: 0, h: 0 };
  for (const r of deduped) {
    if (r.stableford_outcome === 'W') points.w++;
    else if (r.stableford_outcome === 'L') points.l++;
    else points.h++;
    if (r.gross_outcome === 'W') gross.w++;
    else if (r.gross_outcome === 'L') gross.l++;
    else gross.h++;
  }
  return {
    points,
    gross,
    lastFive: deduped
      .slice(0, 5)
      .map((r) => (r.stableford_outcome === 'T' ? 'H' : r.stableford_outcome)),
  };
}

/**
 * MS2 §1 — the count ALWAYS equals the deduped rounds. fetchSharedRounds
 * dedupes before counting, so Messages and the compare sheet read the same
 * real-round figure; there is no pairing-based server count to prefer.
 */
function toGround(rounds: SharedRoundResult[]): SharedGround {
  const deduped = dedupeSharedRounds(rounds);
  if (deduped.length === 0) return EMPTY;
  return {
    rounds: deduped,
    count: deduped.length,
    lastCourseName: deduped[0].course_name ?? null,
    lastPlayDate: deduped[0].play_date ?? null,
    record: headToHead(deduped),
  };
}

/**
 * Shared ground for a LIST of members (the inbox context line).
 * `detailIds` is the subset allowed to fetch full rounds — pass only the rows
 * on screen.
 */
export function useSharedGroundBatch(
  viewerUserId: string | undefined,
  targetIds: string[],
  detailLimit = 12,
): { byUserId: Record<string, SharedGround>; isLoading: boolean } {
  const sortedKey = useMemo(() => [...new Set(targetIds)].sort().join(','), [targetIds]);

  const countsQuery = useQueries({
    queries: [
      {
        queryKey: ['whs-shared-round-counts', viewerUserId ?? '', sortedKey],
        queryFn: () =>
          fetchSharedRoundCounts(viewerUserId as string, sortedKey ? sortedKey.split(',') : []),
        enabled: !!viewerUserId && sortedKey.length > 0,
        staleTime: 5 * 60 * 1000,
      },
    ],
  })[0];

  const counts = (countsQuery.data ?? {}) as Record<string, number>;

  // Only threads with a real shared history, only as far as the eye reaches.
  const detailIds = useMemo(
    () =>
      targetIds
        .filter((id) => (counts[id] ?? 0) > 0)
        .slice(0, detailLimit),
    // counts is a fresh object each render; key off its content instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetIds.join(','), JSON.stringify(counts), detailLimit],
  );

  const details = useQueries({
    queries: detailIds.map((id) => ({
      queryKey: ['whs-shared-rounds', viewerUserId ?? '', id],
      queryFn: () => fetchSharedRounds(viewerUserId as string, id),
      enabled: !!viewerUserId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const byUserId = useMemo(() => {
    const out: Record<string, SharedGround> = {};
    for (const id of targetIds) {
      out[id] = counts[id] > 0 ? { ...EMPTY, count: counts[id] } : EMPTY;
    }
    detailIds.forEach((id, i) => {
      const rows = (details[i]?.data?.shared_round_results ?? []) as SharedRoundResult[];
      if (rows.length > 0) out[id] = toGround(rows);
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIds.join(','), JSON.stringify(counts), detailIds.join(','), details.map((d) => d.dataUpdatedAt).join(',')]);

  return { byUserId, isLoading: countsQuery.isLoading };
}

/** Shared ground for ONE member (the thread header and its strip). */
export function useSharedGroundOne(
  viewerUserId: string | undefined,
  rivalUserId: string | null,
): { ground: SharedGround; isLoading: boolean } {
  const q = useQueries({
    queries: [
      {
        queryKey: ['whs-shared-rounds', viewerUserId ?? '', rivalUserId ?? ''],
        queryFn: () => fetchSharedRounds(viewerUserId as string, rivalUserId),
        enabled: !!viewerUserId && !!rivalUserId,
        staleTime: 5 * 60 * 1000,
      },
    ],
  })[0];

  const ground = useMemo(
    () => toGround((q.data?.shared_round_results ?? []) as SharedRoundResult[]),
    [q.data],
  );

  return { ground, isLoading: q.isLoading };
}
