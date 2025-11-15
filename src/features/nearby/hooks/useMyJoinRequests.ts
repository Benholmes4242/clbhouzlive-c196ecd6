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
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.warn('[useMyJoinRequests] No active session, skipping');
          return [];
        }

        // Call the edge function with explicit Authorization header
        const { data, error } = await supabase.functions.invoke('get-my-join-requests', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        // Handle Edge Function errors explicitly
        if (error) {
          console.error('[useMyJoinRequests] Edge function error:', error);
          return [];
        }

        // Return data safely with fallback
        return data?.requests ?? [];
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
