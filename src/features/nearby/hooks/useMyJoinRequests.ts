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
      try {
        // Check if user is authenticated first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('[useMyJoinRequests] No authenticated user, skipping');
          return [];
        }

        const { data, error } = await supabase.functions.invoke('get-my-join-requests', {
          body: {},
        });

        // Handle 401 specifically (auth issues)
        if (error) {
          if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
            console.warn('[useMyJoinRequests] Unauthorized, user may not be logged in');
            return [];
          }
          console.error('[useMyJoinRequests] Error:', error);
          return [];
        }

        if (!data?.success) {
          console.warn('[useMyJoinRequests] Request failed:', data);
          return [];
        }

        return (data.requests || []) as MyJoinRequest[];
      } catch (err: any) {
        // Catch any other errors (network, parsing, etc.)
        if (err?.message?.includes('Unauthorized') || err?.status === 401) {
          console.warn('[useMyJoinRequests] Unauthorized error caught, skipping notifications');
          return [];
        }
        console.error('[useMyJoinRequests] Unexpected error:', err);
        return [];
      }
    },
    retry: false,
    staleTime: 30_000,
  });
}
