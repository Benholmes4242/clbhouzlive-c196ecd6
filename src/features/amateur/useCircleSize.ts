import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * DOES THIS MEMBER HAVE A CIRCLE AT ALL?
 * (BRIEF_EXPLORE_FIXED_ENTRY_STATE §2 C1 vs C2.)
 *
 * An empty circle board has TWO different causes and they need different
 * answers: a quiet fortnight (C1) is not a problem to solve, while an empty
 * circle (C2) is the cold start. One head-count read separates them; it is only
 * asked for when the board comes back empty.
 */
export function useCircleSize(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['amateur', 'circle-size', userId],
    enabled: !!userId && enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_user_id', userId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
