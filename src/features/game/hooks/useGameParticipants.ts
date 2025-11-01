import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GameParticipant {
  user_id: string | null;
  guest_name: string | null;
  role: 'host' | 'player' | 'guest';
  state: 'invited' | 'accepted' | 'declined' | 'removed' | string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  home_club: string | null;
  eg_handicap_index: number | null;
  show_handicap: boolean | null;
  is_guest: boolean;
}

export function useGameParticipants(gameId: string | null) {
  return useQuery({
    queryKey: ['gameParticipants', gameId],
    queryFn: async (): Promise<GameParticipant[]> => {
      if (!gameId) return [];

      try {
        // 1) Fetch participants (avoid fragile nested joins)
        const { data: raw, error } = await supabase
          .from('game_participants')
          .select('user_id, role, state, guest_name')
          .eq('game_id', gameId);

        if (error) {
          console.error('[useGameParticipants] participants error', error);
          return [];
        }

        // 2) Client-filter to invited/accepted (case-insensitive)
        const filtered = (raw ?? []).filter((p: any) => {
          const s = String(p.state || '').toLowerCase();
          return s === 'invited' || s === 'accepted';
        });

        // 3) Hydrate user profiles in a second pass (no nested joins)
        const userIds = Array.from(
          new Set(filtered.map((p: any) => p.user_id).filter(Boolean))
        ) as string[];

        let profileMap = new Map<string, any>();
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select(
              'id, display_name, username, profile_photo_url, eg_handicap_index, show_handicap, home_club'
            )
            .in('id', userIds);

          if (profilesError) {
            console.error('[useGameParticipants] profiles error', profilesError);
          } else {
            profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
          }
        }

        // 4) Merge into a uniform participant shape
        const merged: GameParticipant[] = filtered.map((p: any) => {
          const prof = p.user_id ? profileMap.get(p.user_id) : null;
          return {
            user_id: p.user_id ?? null,
            guest_name: p.guest_name ?? null,
            role: p.role,
            state: p.state,
            display_name: prof?.display_name ?? p.guest_name ?? null,
            username: prof?.username ?? null,
            profile_photo_url: prof?.profile_photo_url ?? null,
            home_club: prof?.home_club ?? null,
            eg_handicap_index: prof?.eg_handicap_index ?? null,
            show_handicap: prof?.show_handicap ?? null,
            is_guest: !p.user_id,
          };
        });

        return merged;
      } catch (error) {
        console.error('[useGameParticipants] unexpected error', error);
        return [];
      }
    },
    enabled: !!gameId,
    staleTime: 30_000,
  });
}
