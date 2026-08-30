import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';
import { patchEngagement } from '@/lib/engagementCache';

/**
 * useContentReactions (BRIEF_DISCOVER_REACTIONS, section 3).
 *
 * ONE query per visible set, NEVER per card. The caller hands over every
 * (target_type, target_id) pair it is about to render; this hook issues a
 * single `in('target_id', ids)` read of public.content_reactions and joins the
 * rows client-side into a map keyed `${target_type}:${target_id}`. The viewing
 * member's own row comes from the SAME read, so "have I reacted" costs nothing
 * extra.
 *
 * The table is owned by the migration, not by this code: if it is missing at
 * runtime the hook reports `unavailable` and every surface renders NO control
 * (the standing absent-renders-nothing rule) rather than throwing.
 *
 * Notifications are the trigger's job — nothing here writes one.
 */

export type ReactionTargetType = 'round' | 'review';

export interface ReactionTarget {
  type: ReactionTargetType;
  id: string;
}

export interface ReactionState {
  count: number;
  mine: boolean;
}

export const reactionKey = (type: ReactionTargetType, id: string) => `${type}:${id}`;

interface Row {
  target_type: string;
  target_id: string;
  user_id: string;
}

/** Postgres/PostgREST codes for "relation does not exist". */
const MISSING_TABLE = new Set(['42P01', 'PGRST205', 'PGRST204']);
/** Unique violation — a double-fire is harmless, so it counts as success. */
const DUPLICATE_KEY = '23505';

type CacheShape = { rows: Row[]; unavailable: boolean };

const EMPTY: ReactionState = { count: 0, mine: false };

export interface UseContentReactionsOptions {
  /**
   * THE ROUND-POST BRIDGE (BRIEF_ROUND_COMMENTS_EVERYWHERE §S3.3). A round's
   * like is ONE like: content_reactions is canonical and a DB trigger keeps the
   * post's like_count in step. The DATA is unified, but the Clubhouse feed
   * caches are not — so when the caller can resolve the round's post id, the
   * same delta is patched into every feed cache through the canonical helper.
   */
  postIdFor?: (targetId: string) => string | null | undefined;
}

export function useContentReactions(
  targets: readonly ReactionTarget[],
  options: UseContentReactionsOptions = {},
) {
  const { user } = useSupabaseSession();
  const viewerId = user?.id ?? null;
  const queryClient = useQueryClient();

  // Stable key: the sorted set of ids in the visible window.
  const ids = useMemo(() => {
    const seen = new Set<string>();
    for (const t of targets) if (t.id) seen.add(t.id);
    return [...seen].sort();
  }, [targets]);

  const queryKey = useMemo(
    () => ['content-reactions', ids.join(',')] as const,
    [ids],
  );

  const { data } = useQuery<CacheShape>({
    queryKey,
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('content_reactions')
        .select('target_type, target_id, user_id')
        .in('target_id', ids);
      if (error) {
        if (MISSING_TABLE.has(String((error as { code?: string }).code ?? ''))) {
          console.warn('[reactions] content_reactions is unavailable; controls hidden');
          return { rows: [], unavailable: true };
        }
        throw error;
      }
      return { rows: (rows ?? []) as unknown as Row[], unavailable: false };
    },
  });

  const unavailable = data?.unavailable ?? false;

  const map = useMemo(() => {
    const out = new Map<string, ReactionState>();
    for (const r of data?.rows ?? []) {
      const k = `${r.target_type}:${r.target_id}`;
      const prev = out.get(k) ?? { count: 0, mine: false };
      out.set(k, {
        count: prev.count + 1,
        mine: prev.mine || (!!viewerId && r.user_id === viewerId),
      });
    }
    return out;
  }, [data?.rows, viewerId]);

  const stateFor = useCallback(
    (type: ReactionTargetType, id: string | null | undefined): ReactionState =>
      (id ? map.get(reactionKey(type, id)) : undefined) ?? EMPTY,
    [map],
  );

  const mutation = useMutation({
    mutationFn: async ({ type, id, mine }: ReactionTarget & { mine: boolean }) => {
      if (!viewerId) return;
      if (mine) {
        const { error } = await supabase
          .from('content_reactions')
          .delete()
          .eq('user_id', viewerId)
          .eq('target_type', type)
          .eq('target_id', id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from('content_reactions')
        .insert({ user_id: viewerId, target_type: type, target_id: id });
      // The unique constraint makes a double-fire harmless.
      if (error && String((error as { code?: string }).code ?? '') !== DUPLICATE_KEY) throw error;
    },
    /**
     * EVERY CACHE ENTRY HOLDING THIS ID IS PATCHED, not just the caller's.
     *
     * The query key is the sorted id-set of one section's visible window, so
     * two sections rendering the SAME round hold two entries. Patching only
     * `queryKey` left the sibling section stale, and the same heart on the same
     * round read differently on one screen. content_reactions is canonical for
     * rounds, so the write is patched into every window that contains the id
     * and the whole family is invalidated on settle.
     */
    onMutate: ({ type, id, mine }) => {
      if (!viewerId) return { previous: [] as [readonly unknown[], CacheShape | undefined][] };
      const entries = queryClient.getQueriesData<CacheShape>({ queryKey: ['content-reactions'] });
      const previous: [readonly unknown[], CacheShape | undefined][] = [];
      for (const [key, prev] of entries) {
        if (!prev) continue;
        // The id-set lives in the key, so only windows showing this target move.
        const window = String((key as unknown[])[1] ?? '').split(',');
        if (!window.includes(id)) continue;
        previous.push([key, prev]);
        const rows = mine
          ? prev.rows.filter(
              (r) => !(r.target_type === type && r.target_id === id && r.user_id === viewerId),
            )
          : [...prev.rows, { target_type: type, target_id: id, user_id: viewerId }];
        queryClient.setQueryData<CacheShape>(key as readonly unknown[], { ...prev, rows });
      }
      const postId = options.postIdFor?.(id);
      if (postId) {
        patchEngagement(queryClient, postId, {
          isLikedByMe: !mine,
          likeCountDelta: mine ? -1 : +1,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      for (const [key, prev] of ctx?.previous ?? []) queryClient.setQueryData(key, prev);
      toast.error('Could not save that reaction. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['content-reactions'] });
    },
  });

  const toggle = useCallback(
    (type: ReactionTargetType, id: string | null | undefined) => {
      if (!id || !viewerId || unavailable) return;
      mutation.mutate({ type, id, mine: stateFor(type, id).mine });
    },
    [mutation, stateFor, unavailable, viewerId],
  );

  return {
    /** True when the table is missing — every control renders nothing. */
    unavailable,
    /** Null when signed out; the whole layer is inert. */
    viewerId,
    stateFor,
    toggle,
  };
}

export default useContentReactions;
