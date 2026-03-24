import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SeasonalPodiumEntry, PodiumScope } from '@/types/podium';

interface UsePodiumSeasonalParams {
  scope: PodiumScope;
  divisionId?: string;
  clubId?: string | null;
  country?: string | null;
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

export function usePodiumSeasonal({
  scope,
  divisionId,
  clubId,
  country,
  currentUserId,
  enabled = true,
}: UsePodiumSeasonalParams) {
  return useQuery({
    queryKey: ['podium', 'seasonal', scope, divisionId, clubId, country, currentUserId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_podium_seasonal', {
        p_scope: scope as string,
        p_current_user_id: currentUserId ? String(currentUserId) : null,
        p_club_id: clubId ? String(clubId) : null,
        p_country: country ? String(country) : null,
        p_division_id: divisionId ? String(divisionId) : null,
      });

      if (error) {
        console.error('Error fetching seasonal podium:', error);
        throw error;
      }

      // Transform RPC response to match SeasonalPodiumEntry type
      const rows = (data ?? []) as RpcPodiumRow[];
      
      return rows.map((row): SeasonalPodiumEntry => ({
        podium_position: row.rank as 1 | 2 | 3,
        user_id: row.user_id,
        display_name: row.display_name || 'Unknown',
        username: row.display_name || '', // Fallback - RPC doesn't return username
        avatar_url: row.avatar_url,
        narrative_text: null,
        courses_logged: row.courses_count,
        division_id: '', // Not returned by this RPC
        division_name: '',
        streak_days: 0,
        is_on_streak: false,
        rank_change_today: 0,
      }));
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
