import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Per-list Top 100 progress for the signed-in member, straight from the
 * existing user_top100_progress_view. No new RPC.
 */

export interface Top100ListProgress {
  list_id: string;
  list_slug: string;
  list_name: string;
  total: number;
  played: number;
  rated: number;
}

export function useUserTop100Progress(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-top100-progress', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Top100ListProgress[]> => {
      const { data, error } = await supabase
        .from('user_top100_progress_view' as any)
        .select(
          'list_id, list_slug, list_name, total_courses_in_list, courses_played_in_list, courses_rated_in_list',
        )
        .eq('user_id', userId!);

      if (error) throw error;

      return ((data ?? []) as any[]).map((r) => ({
        list_id: r.list_id as string,
        list_slug: r.list_slug as string,
        list_name: r.list_name as string,
        total: Number(r.total_courses_in_list ?? 0),
        played: Number(r.courses_played_in_list ?? 0),
        rated: Number(r.courses_rated_in_list ?? 0),
      }));
    },
  });
}
