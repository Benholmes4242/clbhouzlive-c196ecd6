import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

export type EventType = 'single_round' | 'society_day' | 'multi_day' | 'tournament';
export type ScoringFormat = 'stroke_gross' | 'stroke_net' | 'stableford' | 'modified_stableford' | 'match_play' | 'skins' | 'best_ball' | 'none';
export type EventVisibility = 'public' | 'friends' | 'club' | 'invite_only' | 'private';
export type EventStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';

export interface CreateEventInput {
  name: string;
  description?: string;
  event_type: EventType;
  start_date: string;
  end_date?: string;
  scoring_format?: ScoringFormat;
  handicap_allowance?: number;
  max_handicap?: number;
  max_participants?: number;
  visibility?: EventVisibility;
  club_id?: string;
}

export interface CreateRoundInput {
  course_id?: string;
  course_name: string;
  course_location?: string;
  round_date: string;
  first_tee_time: string;
  tee_time_interval?: number;
  holes?: 9 | 18;
  shotgun_start?: boolean;
  course_rating?: number;
  slope_rating?: number;
  par?: number;
  tee_color?: string;
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();

  return useMutation({
    mutationFn: async ({ 
      event, 
      rounds 
    }: { 
      event: CreateEventInput; 
      rounds: CreateRoundInput[];
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Create the event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          ...event,
          created_by: user.id,
          status: 'draft',
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Add creator as organizer
      const { error: participantError } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventData.id,
          user_id: user.id,
          role: 'organizer',
          invitation_status: 'accepted',
        });

      if (participantError) {
        console.error('Failed to add creator as participant:', participantError);
      }

      // Create rounds if provided
      if (rounds.length > 0) {
        const roundsData = rounds.map((round, index) => ({
          ...round,
          event_id: eventData.id,
          round_number: index + 1,
        }));

        const { error: roundsError } = await supabase
          .from('event_rounds')
          .insert(roundsData);

        if (roundsError) {
          console.error('Failed to create rounds:', roundsError);
        }
      }

      return eventData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast.success('Event created!', { description: data.name });
    },
    onError: (error) => {
      toast.error('Failed to create event', { description: error.message });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      updates,
    }: {
      eventId: string;
      updates: Partial<CreateEventInput> & { status?: EventStatus };
    }) => {
      const { data, error } = await supabase
        .from('events')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-details', data.id] });
      toast.success('Event updated');
    },
    onError: (error) => {
      toast.error('Failed to update event', { description: error.message });
    },
  });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase
        .from('events')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-details', data.id] });
      toast.success('Event published!', { description: 'Invitations can now be sent' });
    },
    onError: (error) => {
      toast.error('Failed to publish event', { description: error.message });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return eventId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast.success('Event deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete event', { description: error.message });
    },
  });
}
