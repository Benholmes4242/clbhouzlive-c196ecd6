import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { FeatOwnerRow, FeatRarityRow } from '@/features/explore-magazine/featRarity';

/**
 * THE OWNER FIELDS ARE READ ONCE PER PAGE, NEVER ONCE PER CARD.
 *
 * get_round_feat_owner_lines takes the whole id array a surface is rendering.
 * Explore mounts FeatRarityProvider with the ids of the rounds currently in the
 * stream; each card then reads its own row out of that single response. A card
 * mounted outside the provider simply has no owner rows and draws no strip.
 *
 * The three FROZEN figures are NOT in this RPC: they are columns on
 * gam_round_feat_rarity, embedded into the gam_round_stats select Explore
 * already makes, so they cost no round trip at all.
 */

interface OwnerLinesResult {
  rowsFor: (scoreId: string | null | undefined) => FeatOwnerRow[] | null;
}

const EMPTY: OwnerLinesResult = { rowsFor: () => null };

const FeatRarityContext = createContext<OwnerLinesResult>(EMPTY);

export function useFeatOwnerRows(ids: string[], enabled = true) {
  const { user } = useSupabaseSession();
  const key = useMemo(() => Array.from(new Set(ids.filter(Boolean))).sort(), [ids]);
  const query = useQuery({
    queryKey: ['feat-rarity-owner-lines', user?.id ?? 'anon', key],
    enabled: enabled && !!user?.id && key.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<FeatOwnerRow[]> => {
      const { data, error } = await supabase.rpc('get_round_feat_owner_lines' as never, {
        p_round_ids: key,
      } as never);
      if (error) {
        console.warn('[featRarity] owner lines failed', error.message);
        return [];
      }
      return ((data ?? []) as unknown) as FeatOwnerRow[];
    },
  });

  return useMemo<OwnerLinesResult>(() => {
    const byScore = new Map<string, FeatOwnerRow[]>();
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
  const value = useFeatOwnerRows(ids);
  return <FeatRarityContext.Provider value={value}>{children}</FeatRarityContext.Provider>;
}

/** Owner rows for one round, or null outside a provider. */
export function useFeatOwnerRowsFor(scoreId: string | null | undefined): FeatOwnerRow[] | null {
  return useContext(FeatRarityContext).rowsFor(scoreId);
}

/**
 * THE ROUND DETAIL PAGE reads one round, so it reads both halves for that one
 * id: the frozen row and, when the viewer owns it, the owner fields.
 */
export function useRoundFeatRarity(scoreId: string | null | undefined, enabled = true) {
  const { user } = useSupabaseSession();
  const frozen = useQuery({
    queryKey: ['feat-rarity-frozen', scoreId],
    enabled: enabled && !!scoreId,
    staleTime: 60 * 60_000,
    queryFn: async (): Promise<FeatRarityRow[]> => {
      const { data, error } = await supabase
        .from('gam_round_feat_rarity' as never)
        .select('feat_kind, global_ordinal, total_rounds_at_detection, distinct_members_at_detection')
        .eq('whs_score_id', scoreId as string);
      if (error) {
        console.warn('[featRarity] frozen read failed', error.message);
        return [];
      }
      return ((data ?? []) as unknown) as FeatRarityRow[];
    },
  });
  const ids = useMemo(() => (scoreId ? [scoreId] : []), [scoreId]);
  const owner = useFeatOwnerRows(ids, enabled && !!user?.id);

  return useMemo(
    () => ({ rows: frozen.data ?? [], owner: owner.rowsFor(scoreId) ?? [] }),
    [frozen.data, owner, scoreId],
  );
}
