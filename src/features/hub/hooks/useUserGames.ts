import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// MOCK DATA FLAG - Set to false after testing
// ============================================
const USE_MOCK_GAMES = true;

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

// ============================================
// MOCK DATA - Remove after testing
// ============================================
function generateMockGames(): UserGames {
  const mockPlayers: Profile[] = [
    { display_name: 'Benjamin Holmes', profile_photo_url: null, eg_handicap_index: 4.2, home_club: 'Ardglass Golf Club' },
    { display_name: 'James McCarthy', profile_photo_url: null, eg_handicap_index: 12.5, home_club: 'Royal County Down' },
    { display_name: 'Sarah O\'Connor', profile_photo_url: null, eg_handicap_index: 8.1, home_club: 'Portrush' },
    { display_name: 'Michael Brennan', profile_photo_url: null, eg_handicap_index: 15.3, home_club: 'Ballybunion' },
    { display_name: 'Emma Walsh', profile_photo_url: null, eg_handicap_index: 6.7, home_club: 'Lahinch' },
    { display_name: 'Ciarán Murphy', profile_photo_url: null, eg_handicap_index: 18.2, home_club: 'Druids Glen' },
    { display_name: 'Aoife Kelly', profile_photo_url: null, eg_handicap_index: 10.4, home_club: 'The K Club' },
    { display_name: 'Patrick Ryan', profile_photo_url: null, eg_handicap_index: 22.0, home_club: 'Adare Manor' },
    { display_name: 'Niamh Doyle', profile_photo_url: null, eg_handicap_index: 5.5, home_club: 'Mount Juliet' },
    { display_name: 'Sean Fitzgerald', profile_photo_url: null, eg_handicap_index: 14.8, home_club: 'Waterville' },
  ];

  const courses = [
    'Ardglass Golf Club',
    'Royal County Down',
    'Portrush - Dunluce Links',
    'Ballybunion Old Course',
    'Lahinch Golf Club',
    'Old Head Golf Links',
    'Tralee Golf Club',
    'Waterville Golf Links',
  ];

  const hostUserId = 'mock-host-benjamin';
  const baseDate = new Date();

  // Generate 8 games
  const hosting: UserGame[] = [];
  const joined: UserGame[] = [];

  for (let i = 0; i < 8; i++) {
    const gameDate = new Date(baseDate);
    gameDate.setDate(gameDate.getDate() + i + 1); // Each game on consecutive days
    gameDate.setHours(9 + (i % 4) * 2, 0, 0, 0); // Vary tee times: 9am, 11am, 1pm, 3pm

    const expiryDate = new Date(gameDate);
    expiryDate.setHours(expiryDate.getHours() + 6);

    // Pick 4 unique players for this game (always include Benjamin as host for hosting games)
    const playerIndices = [0]; // Benjamin is always first
    while (playerIndices.length < 4) {
      const idx = Math.floor(Math.random() * mockPlayers.length);
      if (!playerIndices.includes(idx)) {
        playerIndices.push(idx);
      }
    }

    const participants: Participant[] = playerIndices.map((idx, pIdx) => ({
      user_id: `mock-user-${idx}`,
      user_profiles: mockPlayers[idx],
    }));

    const game: UserGame = {
      id: `mock-game-${i + 1}`,
      host_user_id: i < 4 ? hostUserId : `mock-user-${playerIndices[1]}`, // First 4 hosting, last 4 joined
      course_name: courses[i],
      start_time: gameDate.toISOString(),
      expires_at: expiryDate.toISOString(),
      status: 'active',
      slots_total: 4,
      slots_open: 0, // Full games for visual testing
      participants,
      kind: i < 4 ? 'Hosting' : 'Joined',
    };

    if (i < 4) {
      game.host_user_id = hostUserId;
      game.participants[0].user_id = hostUserId;
      hosting.push(game);
    } else {
      game.host_user_id = participants[1].user_id;
      joined.push(game);
    }
  }

  return { hosting, joined };
}

export function useUserGames() {
  return useQuery<UserGames>({
    queryKey: ['userGames:v2'],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      // Return mock data if flag is enabled
      if (USE_MOCK_GAMES) {
        return generateMockGames();
      }

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
