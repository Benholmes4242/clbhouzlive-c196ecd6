import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { FeatOwnerRow, FeatRarityRow } from '@/features/explore-magazine/featRarity';

/**
 * ONE SOURCE FOR THE WHOLE FEATURE, READ ONCE PER PAGE.
 *
 * public.get_round_feat_lines(p_round_ids uuid[]) returns BOTH halves in one
 * batched call: the three frozen figures, which are public and ungated because
 * the viewer line is shown to everyone, and the three member_* fields, which
 * SQL NULLs for anyone who is not the round's owner.
 *
 * There is no second source. The frozen figures used to ride along on the
 * client-path round select, which meant a round rendered its lines on one path
 * and a bare tag on another. That join is gone. Every surface - the server
 * stream, the client fallback, Courses search, place selection, My circle and
 * round detail - reads this one function and therefore renders identically.
 *
 * The call takes the whole id array a surface is rendering: never one per card.
 * A card mounted outside the provider has no rows and draws no lines.
 */

export interface FeatLinesRow extends FeatRarityRow, FeatOwnerRow {
  whs_score_id?: string;
}

interface FeatLinesResult {
  rowsFor: (scoreId: string | null | undefined) => FeatLinesRow[] | null;
}

const EMPTY: FeatLinesResult = { rowsFor: () => null };

const FeatRarityContext = createContext<FeatLinesResult>(EMPTY);

export function useFeatLines(ids: string[], enabled = true) {
  const key = useMemo(() => Array.from(new Set(ids.filter(Boolean))).sort(), [ids]);
  const query = useQuery({
    queryKey: ['feat-rarity-lines', key],
    enabled: enabled && key.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<FeatLinesRow[]> => {
      const { data, error } = await supabase.rpc('get_round_feat_lines' as never, {
        p_round_ids: key,
      } as never);
      if (error) {
        console.warn('[featRarity] feat lines failed', error.message);
        return [];
      }
      return ((data ?? []) as unknown) as FeatLinesRow[];
    },
  });

  return useMemo<FeatLinesResult>(() => {
    const byScore = new Map<string, FeatLinesRow[]>();
    for (const row of query.data ?? []) {
      const id = row.whs_score_id;
      if (!id) continue;
      const list = byScore.get(id) ?? [];
      list.push(row);
      byScore.set(id, list);
    }
    return { rowsFor: (scoreId) => (scoreId ? byScore.get(scoreId) ?? null : null) };
  }, [query.data]);
}

export function FeatRarityProvider({ ids, children }: { ids: string[]; children: React.ReactNode }) {
  const value = useFeatLines(ids);
  return <FeatRarityContext.Provider value={value}>{children}</FeatRarityContext.Provider>;
}

/** Frozen plus owner rows for one round, or null outside a provider. */
export function useFeatLinesFor(scoreId: string | null | undefined): FeatLinesRow[] | null {
  return useContext(FeatRarityContext).rowsFor(scoreId);
}

/**
 * ROUND DETAIL reads one round, so it asks the same function for one id. The
 * frozen figures come back for any viewer; the member_* fields only for the
 * owner.
 */
export function useRoundFeatRarity(scoreId: string | null | undefined, enabled = true) {
  const ids = useMemo(() => (scoreId ? [scoreId] : []), [scoreId]);
  const lines = useFeatLines(ids, enabled && !!scoreId);
  return useMemo(() => {
    const rows = lines.rowsFor(scoreId) ?? [];
    return { rows: rows as FeatRarityRow[], owner: rows as FeatOwnerRow[] };
  }, [lines, scoreId]);
}
