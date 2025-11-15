import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MyJoinRequest {
  id: string;
  game_id: string;
  created_at: string;
  status: 'pending' | 'approved' | 'declined';
  games: {
    id: string;
    course_name: string | null;
    start_time: string;
    slots_total: number;
    slots_open: number;
  } | null;
}

export function useMyJoinRequests() {
  return useQuery({
    queryKey: ['myJoinRequests'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-my-join-requests', {
        body: {},
      });

      if (error) {
        console.error('[useMyJoinRequests] Error:', error);
        return [];
      }

      if (!data?.success) {
        console.error('[useMyJoinRequests] Request failed:', data);
        return [];
      }

      return (data.requests || []) as MyJoinRequest[];
    },
  });
}
