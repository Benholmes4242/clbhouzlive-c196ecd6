import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Game } from '../types';

export function useGamesQuery(clubId?: string) {
  return useQuery({
    queryKey: ['games', 'public', clubId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('games')
        .select(`
          id,
          course_name,
          start_time,
          slots_total,
          slots_open,
          host_user_id,
          visibility,
          status
        `)
        .eq('visibility', 'public')
        .eq('status', 'active')
        .neq('host_user_id', user.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (clubId) {
        query = query.eq('course_id', clubId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
