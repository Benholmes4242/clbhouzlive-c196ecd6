import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ListProgress {
  listId: string;
  listSlug: string;
  listName: string;
  played: number;
  total: number;
}

export function useUserTop100Progress(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-top100-progress', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_top100_progress_view' as any)
        .select('list_id, list_slug, list_name, courses_played_in_list, total_courses_in_list')
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        listId: row.list_id,
        listSlug: row.list_slug,
        listName: row.list_name,
        played: row.courses_played_in_list || 0,
        total: row.total_courses_in_list || 0,
      })) as ListProgress[];
    },
    staleTime: 60_000,
  });
}
