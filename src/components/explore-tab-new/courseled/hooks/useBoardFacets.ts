import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { BoardFilters, BoardKey } from '../boardFilters';
import { boardRpcArgs } from './useBoardPage';

/**
 * THE FACET COUNTS (BRIEF_DISCOVER_FILTER_LED_BOARD S2).
 *
 * ONE CALL PER FILTER-STATE CHANGE, never one per row (S2.1). The counts are
 * FACETED by the RPC — each axis is counted with its OWN predicate excluded — so
 * a row states what the member WOULD get if they picked it. Nothing here
 * re-filters that output (S2.2).
 *
 * UNRESOLVED IS NOT ABSENT (S2.6). While a call is in flight the LAST GOOD
 * counts stand (keepPreviousData) and nothing greys; on the FIRST call of a
 * session there is no count at all, so rows render without one rather than with
 * a zero. `settled` is what the panel reads to decide between those two states.
 *
 * RETURN SHAPE: (axis, key, label, n). axis is one of scope, window,
 * region_country, region_sub, courses, course, band, competition, board.
 */

export type FacetAxis =
  | 'scope'
  | 'window'
  | 'region_country'
  | 'region_sub'
  | 'courses'
  | 'course'
  | 'band'
  | 'competition'
  | 'board';

interface FacetRow {
  axis: FacetAxis;
  key: string;
  label: string | null;
  n: number;
}

export interface FacetOption {
  key: string;
  label: string | null;
  n: number;
}

export interface BoardFacets {
  /** true once at least one facet answer has arrived for this session. */
  settled: boolean;
  /**
   * A FIXED-LIST count. `null` means UNRESOLVED (render no count, grey nothing);
   * 0 means the RPC answered and the option genuinely holds nothing.
   */
  countFor: (axis: FacetAxis, key: string) => number | null;
  /** An OPEN-LIST axis: only the options that HAVE rows, biggest first. */
  openList: (axis: FacetAxis) => FacetOption[];
}

const EMPTY: FacetOption[] = [];

export function useBoardFacets(
  viewerId: string | undefined,
  board: BoardKey,
  filters: BoardFilters,
  /* The rotation parks this read until the landing combination is known, so no
     facet answer is fetched for a combination that is never rendered. */
  options?: { enabled?: boolean },
): BoardFacets {
  const args = boardRpcArgs(viewerId, board, filters);

  const query = useQuery<FacetRow[]>({
    queryKey: ['discover', 'board-facets', args],
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_board_facets' as never, args as never);
      if (error) throw error;
      return (((data ?? []) as unknown) as FacetRow[]).map((r) => ({
        ...r,
        n: Number(r.n ?? 0),
      }));
    },
  });

  return useMemo(() => {
    const rows = query.data;
    /* THE FIRST CALL OF A SESSION: no answer at all, so no counts and no greying. */
    const settled = !!rows;
    const byAxis = new Map<string, Map<string, FacetOption>>();
    for (const r of rows ?? []) {
      const axis = byAxis.get(r.axis) ?? new Map<string, FacetOption>();
      axis.set(r.key, { key: r.key, label: r.label, n: r.n });
      byAxis.set(r.axis, axis);
    }

    return {
      settled,
      countFor: (axis, key) => {
        if (!settled) return null;
        return byAxis.get(axis)?.get(key)?.n ?? 0;
      },
      openList: (axis) => {
        const m = byAxis.get(axis);
        if (!m) return EMPTY;
        return [...m.values()].sort(
          (a, b) => b.n - a.n || (a.label ?? a.key).localeCompare(b.label ?? b.key),
        );
      },
    };
  }, [query.data]);
}
