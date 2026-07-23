import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useViewerListContext(railKey)
 *
 * Wraps RPC `get_discover_viewer_context(p_rail_key text)` returning:
 *   { on_list boolean, viewer_rank int, viewer_value numeric,
 *     delta_kind ('circle'|'band'|'next_rung'|null), delta_label text,
 *     empty boolean }
 *
 * Silent-fail contract (per BRIEF_G2): if the RPC 404s / errors, the hook
 * returns { empty: true } so Discover never surfaces an error state. Bounded
 * (no polling, no refetchOnFocus). Signed-out callers can pass `null` for
 * railKey — the query is disabled and returns { empty: true }.
 */

export type DeltaKind = 'circle' | 'band' | 'next_rung' | null;

export interface ViewerListContext {
  on_list: boolean;
  viewer_rank: number | null;
  viewer_value: number | null;
  delta_kind: DeltaKind;
  delta_label: string;
  empty: boolean;
}

const EMPTY: ViewerListContext = {
  on_list: false,
  viewer_rank: null,
  viewer_value: null,
  delta_kind: null,
  delta_label: '',
  empty: true,
};

export function useViewerListContext(railKey: string | null) {
  return useQuery<ViewerListContext>({
    queryKey: ['discover-viewer-context', railKey],
    enabled: !!railKey,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      if (!railKey) return EMPTY;
      try {
        const { data, error } = await supabase.rpc(
          'get_discover_viewer_context' as any,
          { p_rail_key: railKey } as any,
        );
        if (error) return EMPTY;
        const row: any = Array.isArray(data) ? data[0] : data;
        if (!row) return EMPTY;
        return {
          on_list: !!row.on_list,
          viewer_rank: row.viewer_rank ?? null,
          viewer_value: row.viewer_value ?? null,
          delta_kind: (row.delta_kind ?? null) as DeltaKind,
          delta_label: typeof row.delta_label === 'string' ? row.delta_label : '',
          empty: !!row.empty,
        };
      } catch {
        return EMPTY;
      }
    },
  });
}

export default useViewerListContext;
