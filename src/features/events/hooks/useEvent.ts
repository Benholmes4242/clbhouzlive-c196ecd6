import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  role: string;
  invitation_status: string;
  handicap_index: number | null;
  playing_handicap: number | null;
  payment_status: string | null;
  created_at: string;
  user?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    handicap: number | null;
  } | null;
}

export interface TeeTimeGroupPlayer {
  id: string;
  group_id: string;
  participant_id: string;
  position: number;
  playing_handicap: number | null;
  participant?: EventParticipant;
}

export interface TeeTimeGroup {
  id: string;
  round_id: string;
  group_number: number;
  tee_time: string;
  starting_hole: number;
  group_name: string | null;
  status: string;
  players?: TeeTimeGroupPlayer[];
}

export interface EventRound {
  id: string;
  event_id: string;
  course_id: string | null;
  course_name: string;
  course_location: string | null;
  round_number: number;
  round_date: string;
  first_tee_time: string;
  tee_time_interval: number;
  tee_color: string | null;
  course_rating: number | null;
  slope_rating: number | null;
  par: number;
  holes: number;
  shotgun_start: boolean;
  status: string;
  groups?: TeeTimeGroup[];
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  event_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  scoring_format: string | null;
  handicap_allowance: number | null;
  max_handicap: number | null;
  max_participants: number | null;
  registration_deadline: string | null;
  allow_waitlist: boolean;
  visibility: string;
  created_by: string;
  club_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  share_code: string | null;
  creator?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
  rounds?: EventRound[];
  participants?: EventParticipant[];
}

export interface EventWithDetails extends Event {
  currentParticipant?: EventParticipant;
  isOrganizer: boolean;
  acceptedCount: number;
  waitlistedCount: number;
  invitedCount: number;
}

export function useEvent(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data as unknown as Event;
    },
    enabled: !!eventId,
  });
}

export function useEventWithDetails(eventId: string | null | undefined) {
  const { user } = useSupabaseSession();

  return useQuery({
    queryKey: ['event-details', eventId],
    queryFn: async () => {
      if (!eventId) return null;

      // Fetch event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Fetch creator profile separately
      let creator = null;
      if (event.created_by) {
        const { data: creatorData } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .eq('id', event.created_by)
          .single();
        creator = creatorData;
      }

      // Fetch rounds
      const { data: rounds, error: roundsError } = await supabase
        .from('event_rounds')
        .select('*')
        .eq('event_id', eventId)
        .order('round_number');

      if (roundsError) {
        console.error('Error fetching rounds:', roundsError);
      }

      // Fetch participants
      const { data: participants, error: participantsError } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at');

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
      }

      // Fetch user profiles for participants
      const participantsWithUsers: EventParticipant[] = await Promise.all(
        (participants || []).map(async (p) => {
          let userData = null;
          if (p.user_id) {
            const { data } = await supabase
              .from('user_profiles')
              .select('id, display_name, username, profile_photo_url, handicap')
              .eq('id', p.user_id)
              .single();
            userData = data;
          }
          return {
            ...p,
            user: userData,
          } as EventParticipant;
        })
      );

      // Fetch tee time groups for each round
      const roundsWithGroups: EventRound[] = await Promise.all(
        (rounds || []).map(async (round) => {
          const { data: groups, error: groupsError } = await supabase
            .from('tee_time_groups')
            .select('*')
            .eq('round_id', round.id)
            .order('group_number');

          if (groupsError) {
            console.error('Error fetching groups:', groupsError);
          }

          // Fetch players for each group
          const groupsWithPlayers: TeeTimeGroup[] = await Promise.all(
            (groups || []).map(async (group) => {
              const { data: players } = await supabase
                .from('tee_time_group_players')
                .select('*')
                .eq('group_id', group.id)
                .order('position');

              // Attach participant info to each player
              const playersWithParticipants: TeeTimeGroupPlayer[] = (players || []).map((player) => {
                const participant = participantsWithUsers.find((p) => p.id === player.participant_id);
                return {
                  ...player,
                  participant,
                } as TeeTimeGroupPlayer;
              });

              return {
                ...group,
                players: playersWithParticipants,
              } as TeeTimeGroup;
            })
          );

          return {
            ...round,
            groups: groupsWithPlayers,
          } as EventRound;
        })
      );

      // Find current user's participant record
      const currentParticipant = participantsWithUsers.find(
        (p) => p.user_id === user?.id
      );

      // Determine if current user is an organizer
      const isOrganizer =
        currentParticipant?.role === 'organizer' ||
        currentParticipant?.role === 'co_organizer' ||
        event.created_by === user?.id;

      // Count participants by status
      const acceptedCount = participantsWithUsers.filter(
        (p) => p.invitation_status === 'accepted'
      ).length;
      const waitlistedCount = participantsWithUsers.filter(
        (p) => p.invitation_status === 'waitlisted'
      ).length;
      const invitedCount = participantsWithUsers.filter(
        (p) => p.invitation_status === 'invited'
      ).length;

      return {
        ...event,
        creator,
        rounds: roundsWithGroups,
        participants: participantsWithUsers,
        currentParticipant,
        isOrganizer,
        acceptedCount,
        waitlistedCount,
        invitedCount,
      } as EventWithDetails;
    },
    enabled: !!eventId,
  });
}

export function useUserEvents() {
  const { user } = useSupabaseSession();

  return useQuery({
    queryKey: ['user-events', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get events where user is a participant
      const { data: participations, error: participationsError } = await supabase
        .from('event_participants')
        .select('event_id')
        .eq('user_id', user.id);

      if (participationsError) throw participationsError;

      const eventIds = participations?.map((p) => p.event_id) || [];

      if (eventIds.length === 0) return [];

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('start_date', { ascending: true });

      if (eventsError) throw eventsError;
      
      // Fetch creators for each event
      const eventsWithCreators: Event[] = await Promise.all(
        (events || []).map(async (event) => {
          let creator = null;
          if (event.created_by) {
            const { data } = await supabase
              .from('user_profiles')
              .select('id, display_name, username, profile_photo_url')
              .eq('id', event.created_by)
              .single();
            creator = data;
          }
          return { ...event, creator } as Event;
        })
      );

      return eventsWithCreators;
    },
    enabled: !!user?.id,
  });
}

export function useDiscoverEvents() {
  return useQuery({
    queryKey: ['discover-events'],
    queryFn: async () => {
      // Get public events that haven't ended
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('visibility', 'public')
        .eq('status', 'published')
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(50);

      if (error) throw error;
      
      // Fetch creators for each event
      const eventsWithCreators: Event[] = await Promise.all(
        (data || []).map(async (event) => {
          let creator = null;
          if (event.created_by) {
            const { data: creatorData } = await supabase
              .from('user_profiles')
              .select('id, display_name, username, profile_photo_url')
              .eq('id', event.created_by)
              .single();
            creator = creatorData;
          }
          return { ...event, creator } as Event;
        })
      );

      return eventsWithCreators;
    },
  });
}

export function useEventByShareCode(shareCode: string | null | undefined) {
  return useQuery({
    queryKey: ['event-share', shareCode],
    queryFn: async () => {
      if (!shareCode) return null;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('share_code', shareCode)
        .single();

      if (error) throw error;
      
      // Fetch creator
      let creator = null;
      if (data.created_by) {
        const { data: creatorData } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .eq('id', data.created_by)
          .single();
        creator = creatorData;
      }

      return { ...data, creator } as Event;
    },
    enabled: !!shareCode,
  });
}
