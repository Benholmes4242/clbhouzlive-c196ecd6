import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Profile = { 
  display_name?: string | null; 
  profile_photo_url?: string | null; 
  eg_handicap_index?: number | null;
  home_club?: string | null;
};

type Participant = { 
  user_id: string; 
  user_profiles: Profile | null;
};

export type UserGame = {
  id: string;
  host_user_id: string;
  course_name: string | null;
  start_time: string;
  expires_at: string;
  status: string;
  slots_total: number;
  slots_open: number;
  participants: Participant[];
  kind: 'Hosting' | 'Joined';
};

type UserGames = { 
  hosting: UserGame[]; 
  joined: UserGame[];
};

export function useUserGames() {
  return useQuery<UserGames>({
    queryKey: ['userGames:v2'],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!user) return { hosting: [], joined: [] };

      const nowIso = new Date().toISOString();

      // HOSTING: games where user is the host
      const { data: hostingRaw = [] } = await supabase
        .from('games')
        .select(`
          id, host_user_id, course_name, start_time, expires_at, status,
          slots_total, slots_open,
          participants:game_participants(
            user_id,
            user_profiles(display_name, profile_photo_url, eg_handicap_index, home_club)
          )
        `)
        .eq('host_user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', nowIso)
        .order('start_time', { ascending: true })
        .throwOnError();

      // JOINED: games where user is a participant (but not host)
      const { data: participantRows = [] } = await supabase
        .from('game_participants')
        .select('game_id')
        .eq('user_id', user.id)
        .throwOnError();

      const joinedIds = participantRows.map(p => p.game_id);
      let joinedRaw: any[] = [];
      
      if (joinedIds.length > 0) {
        const { data } = await supabase
          .from('games')
          .select(`
            id, host_user_id, course_name, start_time, expires_at, status,
            slots_total, slots_open,
            participants:game_participants(
              user_id,
              user_profiles(display_name, profile_photo_url, eg_handicap_index, home_club)
            )
          `)
          .in('id', joinedIds)
          .neq('host_user_id', user.id)
          .eq('status', 'active')
          .gte('expires_at', nowIso)
          .order('start_time', { ascending: true })
          .throwOnError();
        
        joinedRaw = data || [];
      }

      const hosting = (hostingRaw as any[]).map(g => ({ ...g, kind: 'Hosting' as const }));
      const joined = (joinedRaw as any[]).map(g => ({ ...g, kind: 'Joined' as const }));

      return { hosting, joined };
    },
  });
}
