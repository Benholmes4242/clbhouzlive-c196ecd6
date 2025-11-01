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
        .select('user_id, role, state, guest_name')
        .eq('game_id', gameId);

      if (error) {
        console.error('Error fetching game participants:', error);
        return [];
      }

      const rows = (data || []) as any[];
      const filtered = rows.filter((p: any) => {
        const s = (p.state || '').toLowerCase();
        return s === 'invited' || s === 'accepted';
      });

      const userIds = Array.from(new Set(filtered.map((p: any) => p.user_id).filter((id: any) => !!id)));
      let profileMap = new Map<string, any>();
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url, eg_handicap_index, show_handicap, home_club')
          .in('id', userIds);
        if (profilesError) {
          console.error('Error fetching participant profiles:', profilesError);
        } else {
          profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        }
      }

      return filtered.map((p: any) => {
        const prof = p.user_id ? profileMap.get(p.user_id) : null;
        return {
          user_id: p.user_id ?? null,
          role: p.role,
          state: p.state,
          display_name: prof?.display_name || p.guest_name || 'Unknown',
          username: prof?.username,
          profile_photo_url: prof?.profile_photo_url,
          eg_handicap_index: prof?.eg_handicap_index ?? null,
          show_handicap: prof?.show_handicap,
          home_club: prof?.home_club ?? null,
          guest_name: p.guest_name ?? null,
          is_guest: !p.user_id,
        } as GameParticipant;
      });
    },
    enabled: !!gameId,
    staleTime: 30_000,
  });
}
