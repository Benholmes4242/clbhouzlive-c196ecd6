import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { TenBlockData, TenPostBlock } from './topTenModel';
const EMPTY_POST_BLOCKS = new Map<string, TenPostBlock>();

// Viewer identity scopes private server responses. No previous-viewer placeholder data.
export function useTenBlock(ownerId: string) {
  const { user, loading } = useSupabaseSession();
  return useQuery({
    queryKey: ['top-ten-block', ownerId, user?.id ?? null],
    enabled: !!ownerId && !loading,
    staleTime: 30_000,
    queryFn: async (): Promise<TenBlockData | null> => {
      const { data, error } = await supabase.rpc('get_top_ten_block', { p_owner: ownerId });
      if (error) throw error;
      return data as unknown as TenBlockData | null;
    },
  });
}
/** One set-based RPC per loaded host list, never a read inside each FeedCard. */
export function useTenPostBlocks(postIds: string[]) {
  const { user, loading } = useSupabaseSession();
  const ids = [...new Set(postIds)].sort();
  const query = useQuery({
    queryKey: ['top-ten-post-blocks', ids, user?.id ?? null],
    enabled: ids.length > 0 && !loading,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_ten_post_blocks', { p_post_ids: ids });
      if (error) throw error;
      const map = new Map<string, TenPostBlock>();
      for (const row of data ?? []) {
        if (row.block) map.set(row.post_id, { ...row, block: row.block as unknown as TenBlockData, kind: row.kind as TenPostBlock['kind'] });
      }
      return map;
    },
  });
  return { map: query.isError ? EMPTY_POST_BLOCKS : query.data ?? EMPTY_POST_BLOCKS, settled: ids.length === 0 || (!loading && query.isFetched), fetching: query.isFetching };
}