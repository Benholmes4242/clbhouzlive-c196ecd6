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
 * DEDUPE (a real fault in the RPC, handled here): detect_shared_rounds joins
 * whs_scores on (play_date, course_id) with no cardinality guard, so a member
 * with two rounds the same day at the same course against a rival with two
 * produces four rows. We collapse on (play_date, course_id) and keep the first.
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  fetchSharedRounds,
  fetchSharedRoundCounts,
  type SharedRoundResult,
} from '@/lib/whs/api';

export interface SharedGround {
  /** Rounds played together, most recent first, deduped. */
  rounds: SharedRoundResult[];
  count: number;
  lastCourseName: string | null;
  lastPlayDate: string | null;
}

const EMPTY: SharedGround = {
  rounds: [],
  count: 0,
  lastCourseName: null,
  lastPlayDate: null,
};

export function dedupeSharedRounds(rounds: SharedRoundResult[]): SharedRoundResult[] {
  const seen = new Set<string>();
  const out: SharedRoundResult[] = [];
  for (const r of rounds) {
    const key = `${r.play_date}|${r.course_id ?? r.course_name ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out.sort((a, b) => (a.play_date < b.play_date ? 1 : -1));
}

function toGround(rounds: SharedRoundResult[]): SharedGround {
  const deduped = dedupeSharedRounds(rounds);
  if (deduped.length === 0) return EMPTY;
  return {
    rounds: deduped,
    count: deduped.length,
    lastCourseName: deduped[0].course_name ?? null,
    lastPlayDate: deduped[0].play_date ?? null,
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
