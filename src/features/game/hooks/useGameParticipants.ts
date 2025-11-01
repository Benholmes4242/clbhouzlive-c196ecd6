import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GameParticipant {
  user_id: string | null;
  role: 'host' | 'player';
  state: 'invited' | 'accepted' | 'declined' | 'removed';
  display_name: string;
  username?: string;
  profile_photo_url?: string;
  eg_handicap_index?: number | null;
  show_handicap?: boolean;
  home_club?: string | null;
  guest_name?: string | null;
  is_guest?: boolean;
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
          guest_name,
          user_profiles:user_id (
            id,
            display_name,
            username,
            profile_photo_url,
            eg_handicap_index,
            show_handicap,
            home_club
          )
        `)
        .eq('game_id', gameId);

      if (error) {
        console.error('Error fetching game participants:', error);
        return [];
      }

      return (data || [])
        .filter((p: any) => {
          const s = (p.state || '').toLowerCase();
          return s === 'invited' || s === 'accepted';
        })
        .map((p: any) => ({
          user_id: p.user_id ?? null,
          role: p.role,
          state: p.state,
          display_name: p.user_profiles?.display_name || p.guest_name || 'Unknown',
          username: p.user_profiles?.username,
          profile_photo_url: p.user_profiles?.profile_photo_url,
          eg_handicap_index: p.user_profiles?.eg_handicap_index,
          show_handicap: p.user_profiles?.show_handicap,
          home_club: p.user_profiles?.home_club,
          guest_name: p.guest_name ?? null,
          is_guest: !p.user_id,
        }));
    },
    enabled: !!gameId,
    staleTime: 30_000,
  });
}
