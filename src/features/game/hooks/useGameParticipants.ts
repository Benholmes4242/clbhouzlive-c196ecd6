import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GameParticipant {
  user_id: string;
  role: 'host' | 'player';
  state: 'invited' | 'accepted' | 'declined' | 'removed';
  display_name: string;
  username?: string;
  profile_photo_url?: string;
  eg_handicap_index?: number | null;
  show_handicap?: boolean;
  home_club_name?: string | null;
}

export function useGameParticipants(gameId: string | null) {
  return useQuery({
    queryKey: ['gameParticipants', gameId],
    queryFn: async (): Promise<GameParticipant[]> => {
      if (!gameId) return [];

      const { data, error } = await supabase
        .from('game_participants')
        .select(`
          user_id,
          role,
          state,
          user_profiles:user_id (
            id,
            display_name,
            username,
            profile_photo_url,
            eg_handicap_index,
            show_handicap,
            home_club_name
          )
        `)
        .eq('game_id', gameId)
        .in('state', ['invited', 'accepted']);

      if (error) {
        console.error('Error fetching game participants:', error);
        return [];
      }

      return (data || [])
        .map((p: any) => ({
          user_id: p.user_id,
          role: p.role,
          state: p.state,
          display_name: p.user_profiles?.display_name || 'Unknown',
          username: p.user_profiles?.username,
          profile_photo_url: p.user_profiles?.profile_photo_url,
          eg_handicap_index: p.user_profiles?.eg_handicap_index,
          show_handicap: p.user_profiles?.show_handicap,
          home_club_name: p.user_profiles?.home_club_name,
        }))
        .filter((p: GameParticipant) => p.state === 'accepted' || p.role === 'host');
    },
    enabled: !!gameId,
    staleTime: 30_000,
  });
}
