import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NemesisHoleRow {
  course_id: string;
  course_name: string;
  hole_no: number;
  par: number;
  my_avg_over: number;
  field_avg_over: number;
  rounds: number;
}

/**
 * Viewer-scoped worst holes. Requires signed-in + WHS gating at the call site.
 */
export function useMyNemesisHoles(userId: string | undefined, limit = 3) {
  return useQuery<NemesisHoleRow[]>({
    queryKey: ['gam', 'my-nemesis-holes', userId ?? 'anon', limit],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_my_nemesis_holes', {
        p_user_id: userId,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as NemesisHoleRow[];
    },
  });
}
