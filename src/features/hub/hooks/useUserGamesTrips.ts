/**
 * useUserGamesTrips - Hooks for fetching user's games and trips
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RsvpStatus = 'going' | 'maybe' | 'declined' | 'invited';
export type GameStatus = 'scheduled' | 'live' | 'completed' | 'canceled';
export type TripStatus = 'upcoming' | 'ongoing' | 'completed';

export interface UserGame {
  id: string;
  courseName: string;
  courseId?: string;
  startsAt: string;
  endsAt?: string;
  status: GameStatus;
  tripId?: string;
  visibility: 'public' | 'friends' | 'club';
  // Current user's RSVP
  currentUserRsvp: RsvpStatus | null;
  // Counts
  goingCount: number;
  maybeCount: number;
  declinedCount: number;
  invitedCount: number;
  // Host info
  hostUserId: string;
  isHost: boolean;
  // Reminders
  remindersEnabled: boolean;
}

export interface UserTrip {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  visibility: string;
  coverImageUrl?: string;
  createdBy: string;
  isCreator: boolean;
  // Derived counts
  gamesCount: number;
  participantCount: number;
  // Status
  status: TripStatus;
}

export function useUserUpcomingGames() {
  return useQuery({
    queryKey: ['user-games', 'upcoming'],
    queryFn: async (): Promise<UserGame[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Games where user is host OR participant
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      // First get games where user is host
      const { data: hostedGames, error: hostError } = await supabase
        .from('games')
        .select(`
          id,
          course_name,
          course_id,
          start_time,
          ends_at,
          status,
          trip_id,
          visibility,
          host_user_id
        `)
        .eq('host_user_id', user.id)
        .in('status', ['active', 'scheduled', 'live'])
        .gte('start_time', sixHoursAgo)
        .order('start_time', { ascending: true })
        .limit(30);

      if (hostError) throw hostError;

      // Then get games where user is participant
      const { data: participantGames, error: partError } = await supabase
        .from('game_participants')
        .select(`
          game_id,
          games!inner (
            id,
            course_name,
            course_id,
            start_time,
            ends_at,
            status,
            trip_id,
            visibility,
            host_user_id
          )
        `)
        .eq('user_id', user.id)
        .in('games.status', ['active', 'scheduled', 'live'])
        .gte('games.start_time', sixHoursAgo)
        .limit(30);

      if (partError) throw partError;

      // Merge and dedupe
      const gameMap = new Map<string, any>();
      
      hostedGames?.forEach(g => gameMap.set(g.id, g));
      participantGames?.forEach(p => {
        const g = p.games as any;
        if (g && !gameMap.has(g.id)) {
          gameMap.set(g.id, g);
        }
      });

      const allGameIds = Array.from(gameMap.keys());
      if (allGameIds.length === 0) return [];

      // Get participant counts for all games
      const { data: participants, error: countsError } = await supabase
        .from('game_participants')
        .select('game_id, user_id, rsvp_status')
        .in('game_id', allGameIds);

      if (countsError) throw countsError;

      // Get reminders for current user
      const { data: reminders, error: remindersError } = await supabase
        .from('game_reminders')
        .select('game_id, enabled')
        .eq('user_id', user.id)
        .in('game_id', allGameIds);

      if (remindersError) throw remindersError;

      const reminderMap = new Map(reminders?.map(r => [r.game_id, r.enabled]) || []);

      // Build final result
      const games: UserGame[] = Array.from(gameMap.values())
        .map((g): UserGame => {
          const gameParticipants = participants?.filter(p => p.game_id === g.id) || [];
          const myParticipant = gameParticipants.find(p => p.user_id === user.id);
          
          const goingCount = gameParticipants.filter(p => p.rsvp_status === 'going').length;
          const maybeCount = gameParticipants.filter(p => p.rsvp_status === 'maybe').length;
          const declinedCount = gameParticipants.filter(p => p.rsvp_status === 'declined').length;
          const invitedCount = gameParticipants.filter(p => p.rsvp_status === 'invited').length;

          // Map status
          let status: GameStatus = 'scheduled';
          const now = new Date();
          const startTime = new Date(g.start_time);
          const endsAt = g.ends_at ? new Date(g.ends_at) : null;
          
          if (g.status === 'completed') {
            status = 'completed';
          } else if (g.status === 'canceled') {
            status = 'canceled';
          } else if (startTime <= now && (!endsAt || endsAt > now)) {
            status = 'live';
          }

          return {
            id: g.id,
            courseName: g.course_name || 'Unknown Course',
            courseId: g.course_id,
            startsAt: g.start_time,
            endsAt: g.ends_at,
            status,
            tripId: g.trip_id,
            visibility: g.visibility || 'friends',
            currentUserRsvp: myParticipant?.rsvp_status as RsvpStatus || (g.host_user_id === user.id ? 'going' : null),
            goingCount: goingCount + (g.host_user_id === user.id ? 1 : 0), // Host is always going
            maybeCount,
            declinedCount,
            invitedCount,
            hostUserId: g.host_user_id,
            isHost: g.host_user_id === user.id,
            remindersEnabled: reminderMap.get(g.id) || false,
          };
        })
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

      return games;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useUserPastGames() {
  return useQuery({
    queryKey: ['user-games', 'past'],
    queryFn: async (): Promise<UserGame[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      // Get completed games where user is host - also fetch course info if course_name is null
      const { data: hostedGames, error: hostError } = await supabase
        .from('games')
        .select(`
          id,
          course_name,
          course_id,
          start_time,
          ends_at,
          status,
          trip_id,
          visibility,
          host_user_id,
          golf_courses:course_id (
            name
          )
        `)
        .eq('host_user_id', user.id)
        .or(`status.eq.completed,start_time.lt.${sixHoursAgo}`)
        .order('start_time', { ascending: false })
        .limit(30);

      if (hostError) throw hostError;

      // Get games where user is participant
      const { data: participantGames, error: partError } = await supabase
        .from('game_participants')
        .select(`
          game_id,
          games!inner (
            id,
            course_name,
            course_id,
            start_time,
            ends_at,
            status,
            trip_id,
            visibility,
            host_user_id,
            golf_courses:course_id (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .limit(50);

      if (partError) throw partError;

      // Filter and merge
      const gameMap = new Map<string, any>();
      
      hostedGames?.forEach(g => gameMap.set(g.id, g));
      participantGames?.forEach(p => {
        const g = p.games as any;
        if (g && !gameMap.has(g.id)) {
          if (g.status === 'completed' || new Date(g.start_time) < new Date(Date.now() - 6 * 60 * 60 * 1000)) {
            gameMap.set(g.id, g);
          }
        }
      });

      const allGameIds = Array.from(gameMap.keys());
      if (allGameIds.length === 0) return [];

      // FIX: Fetch participant counts for past games (was hardcoded to 0)
      const { data: participants, error: participantsError } = await supabase
        .from('game_participants')
        .select('game_id, user_id, rsvp_status')
        .in('game_id', allGameIds);

      if (participantsError) {
        console.error('[useUserPastGames] Error fetching participants:', participantsError);
        // Non-fatal, continue with 0 counts
      }

      // Group counts by game_id
      const countsByGame: Record<string, { going: number; maybe: number; declined: number; invited: number }> = {};
      participants?.forEach(p => {
        if (!countsByGame[p.game_id]) {
          countsByGame[p.game_id] = { going: 0, maybe: 0, declined: 0, invited: 0 };
        }
        if (p.rsvp_status === 'going') countsByGame[p.game_id].going++;
        else if (p.rsvp_status === 'maybe') countsByGame[p.game_id].maybe++;
        else if (p.rsvp_status === 'declined') countsByGame[p.game_id].declined++;
        else if (p.rsvp_status === 'invited') countsByGame[p.game_id].invited++;
      });

      const games: UserGame[] = Array.from(gameMap.values())
        .map((g): UserGame => {
          const counts = countsByGame[g.id] || { going: 0, maybe: 0, declined: 0, invited: 0 };
          const myParticipant = participants?.find(p => p.game_id === g.id && p.user_id === user.id);
          
          // Get course name from course_name or fallback to golf_courses join
          const courseName = g.course_name || (g.golf_courses as any)?.name || 'Unknown Course';
          
          return {
            id: g.id,
            courseName,
            courseId: g.course_id,
            startsAt: g.start_time,
            endsAt: g.ends_at,
            status: 'completed',
            tripId: g.trip_id,
            visibility: g.visibility || 'friends',
            currentUserRsvp: myParticipant?.rsvp_status as RsvpStatus || (g.host_user_id === user.id ? 'going' : null),
            goingCount: counts.going + (g.host_user_id === user.id && !participants?.some(p => p.game_id === g.id && p.user_id === user.id) ? 1 : 0),
            maybeCount: counts.maybe,
            declinedCount: counts.declined,
            invitedCount: counts.invited,
            hostUserId: g.host_user_id,
            isHost: g.host_user_id === user.id,
            remindersEnabled: false,
          };
        })
        .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

      return games;
    },
    staleTime: 60000,
  });
}

export function useUserTrips() {
  return useQuery({
    queryKey: ['user-trips'],
    queryFn: async (): Promise<UserTrip[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get trips created by user (exclude cancelled)
      const { data: createdTrips, error: createdError } = await supabase
        .from('trips')
        .select(`
          id,
          name,
          description,
          start_date,
          end_date,
          visibility,
          cover_image_url,
          created_by,
          status
        `)
        .eq('created_by', user.id)
        .neq('status', 'cancelled')
        .order('start_date', { ascending: false })
        .limit(30);

      if (createdError) {
        console.error('[useUserTrips] Error fetching created trips:', createdError);
        throw createdError;
      }

      // Get trips where user is participant - use two-step approach for robustness
      const { data: participantData, error: partError } = await supabase
        .from('trip_participants')
        .select('trip_id')
        .eq('user_id', user.id)
        .limit(30);

      if (partError) {
        console.error('[useUserTrips] Error fetching trip participants:', partError);
        throw partError;
      }

      // Get trip details for participant trips
      const participantTripIds = participantData?.map(p => p.trip_id).filter(Boolean) || [];
      let participantTrips: any[] = [];
      
      if (participantTripIds.length > 0) {
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select(`
            id,
            name,
            description,
            start_date,
            end_date,
            visibility,
            cover_image_url,
            created_by,
            status
          `)
          .in('id', participantTripIds)
          .neq('status', 'cancelled');

        if (tripError) {
          console.error('[useUserTrips] Error fetching participant trip details:', tripError);
          throw tripError;
        }
        
        participantTrips = tripData || [];
      }

      // Merge and dedupe
      const tripMap = new Map<string, any>();
      createdTrips?.forEach(t => tripMap.set(t.id, t));
      participantTrips.forEach(t => {
        if (t && !tripMap.has(t.id)) {
          tripMap.set(t.id, t);
        }
      });

      const allTripIds = Array.from(tripMap.keys());
      if (allTripIds.length === 0) return [];
      
      // Get game counts for trips
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('trip_id')
        .in('trip_id', allTripIds);

      if (gamesError) {
        console.error('[useUserTrips] Error fetching trip games:', gamesError);
        throw gamesError;
      }

      const gameCountMap = new Map<string, number>();
      gamesData?.forEach(g => {
        if (g.trip_id) {
          gameCountMap.set(g.trip_id, (gameCountMap.get(g.trip_id) || 0) + 1);
        }
      });

      // Get participant counts for trips
      const { data: participantsData, error: participantsError } = await supabase
        .from('trip_participants')
        .select('trip_id')
        .in('trip_id', allTripIds);

      if (participantsError) {
        console.error('[useUserTrips] Error fetching trip participant counts:', participantsError);
        // Non-fatal, continue with 0 counts
      }

      const participantCountMap = new Map<string, number>();
      participantsData?.forEach(p => {
        if (p.trip_id) {
          participantCountMap.set(p.trip_id, (participantCountMap.get(p.trip_id) || 0) + 1);
        }
      });

      const now = new Date();

      const trips: UserTrip[] = Array.from(tripMap.values())
        .map((t): UserTrip => {
          const startDate = new Date(t.start_date);
          const endDate = new Date(t.end_date);
          
          let status: TripStatus = 'upcoming';
          if (endDate < now) {
            status = 'completed';
          } else if (startDate <= now && endDate >= now) {
            status = 'ongoing';
          }

          return {
            id: t.id,
            name: t.name || 'Untitled Trip',
            description: t.description,
            startDate: t.start_date,
            endDate: t.end_date,
            visibility: t.visibility || 'invite',
            coverImageUrl: t.cover_image_url,
            createdBy: t.created_by,
            isCreator: t.created_by === user.id,
            gamesCount: gameCountMap.get(t.id) || 0,
            participantCount: (participantCountMap.get(t.id) || 0) + 1, // +1 for creator
            status,
          };
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      return trips;
    },
    staleTime: 60000,
  });
}

// Helper hook to get trips separated by status
export function useUserTripsByStatus() {
  const { data: trips, isLoading, error } = useUserTrips();

  const upcomingTrips = trips?.filter(t => t.status === 'upcoming' || t.status === 'ongoing') || [];
  const pastTrips = trips?.filter(t => t.status === 'completed') || [];

  // Sort upcoming by nearest first, past by most recent first
  upcomingTrips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  pastTrips.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  return {
    upcomingTrips,
    pastTrips,
    allTrips: trips || [],
    isLoading,
    error,
  };
}
