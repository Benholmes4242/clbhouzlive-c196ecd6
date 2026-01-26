import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AllTimePodiumEntry, PodiumScope } from '@/types/podium';

interface UsePodiumAllTimeParams {
  scope: PodiumScope;
  clubId?: string | null;
  currentUserId?: string;
  enabled?: boolean;
}

interface RpcPodiumRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  courses_count: number;
  rank: number;
}

export function usePodiumAllTime({
  scope,
  clubId,
  currentUserId,
  enabled = true,
}: UsePodiumAllTimeParams) {
  return useQuery({
    queryKey: ['podium', 'all_time', scope, clubId, currentUserId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_podium_all_time', {
        p_scope: scope,
        p_current_user_id: currentUserId ?? null,
        p_club_id: scope === 'club' ? clubId : null,
      });

      if (error) {
        console.error('Error fetching all-time podium:', error);
        throw error;
      }

      // Transform RPC response to match AllTimePodiumEntry type
      const rows = (data ?? []) as RpcPodiumRow[];
      
      return rows.map((row): AllTimePodiumEntry => ({
        podium_position: row.rank as 1 | 2 | 3,
        user_id: row.user_id,
        display_name: row.display_name || 'Unknown',
        username: row.display_name || '', // Fallback - RPC doesn't return username
        avatar_url: row.avatar_url,
        narrative_text: null,
        all_time_courses: row.courses_count,
        seasons_won: 0, // Not returned by this RPC
        podium_finishes: 0,
      }));
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes (less volatile)
  });
}
