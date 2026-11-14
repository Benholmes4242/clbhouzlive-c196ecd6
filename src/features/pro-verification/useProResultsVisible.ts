/** One client gate for a linked pro's public tour feed. The server already
 * gates his own rows; this rpc answers whether a viewer may see them, so the
 * profile stops asking the per-member-ungated tour feed. The owner is always
 * visible with no read. Fail closed: loading or error means not visible, and
 * settled is true only after a successful read. The key sits under
 * ['pro-profile'] so useShowTourResults' existing invalidation refreshes it. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProResultsVisible(userId: string, isOwner: boolean) {
  const query = useQuery({
    queryKey: ['pro-profile', 'results-visible', userId],
    enabled: !!userId && !isOwner,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('pro_results_visible', { p_user: userId });
      if (error) throw error;
      return data === true;
    },
  });
  const settled = isOwner || (query.isSuccess && !query.isError);
  const visible = isOwner || (settled && query.data === true);
  return { visible, settled };
}
