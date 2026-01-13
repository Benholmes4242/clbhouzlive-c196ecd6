import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

export type ParticipantRole = 'organizer' | 'co_organizer' | 'player' | 'spectator' | 'caddie';
export type InvitationStatus = 'invited' | 'accepted' | 'declined' | 'waitlisted' | 'removed';

interface InviteParticipantInput {
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  handicapIndex?: number;
  role?: ParticipantRole;
}

export function useInviteParticipant() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();

  return useMutation({
    mutationFn: async ({
      eventId,
      participant,
    }: {
      eventId: string;
      participant: InviteParticipantInput;
    }) => {
      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: participant.userId || null,
          guest_name: participant.guestName || null,
          guest_email: participant.guestEmail || null,
          guest_phone: participant.guestPhone || null,
          handicap_index: participant.handicapIndex || null,
          role: participant.role || 'player',
          invitation_status: 'invited',
          invited_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', variables.eventId] });
      toast.success('Invitation sent!');
    },
    onError: (error) => {
      toast.error('Failed to send invitation', { description: error.message });
    },
  });
}

export function useBulkInviteParticipants() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();

  return useMutation({
    mutationFn: async ({
      eventId,
      participants,
    }: {
      eventId: string;
      participants: InviteParticipantInput[];
    }) => {
      const records = participants.map((p) => ({
        event_id: eventId,
        user_id: p.userId || null,
        guest_name: p.guestName || null,
        guest_email: p.guestEmail || null,
        guest_phone: p.guestPhone || null,
        handicap_index: p.handicapIndex || null,
        role: p.role || 'player',
        invitation_status: 'invited' as const,
        invited_by: user?.id,
      }));

      const { data, error } = await supabase
        .from('event_participants')
        .insert(records)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', variables.eventId] });
      toast.success(`${data.length} invitation${data.length > 1 ? 's' : ''} sent!`);
    },
    onError: (error) => {
      toast.error('Failed to send invitations', { description: error.message });
    },
  });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantId,
      response,
      handicapIndex,
    }: {
      participantId: string;
      response: 'accepted' | 'declined';
      handicapIndex?: number;
    }) => {
      const updateData: Record<string, unknown> = {
        invitation_status: response,
        responded_at: new Date().toISOString(),
      };

      if (handicapIndex !== undefined) {
        updateData.handicap_index = handicapIndex;
      }

      const { data, error } = await supabase
        .from('event_participants')
        .update(updateData)
        .eq('id', participantId)
        .select(`
          *,
          event:events(id, name)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      
      if (data.invitation_status === 'accepted') {
        toast.success("You're in! 🏌️", { description: `See you at ${data.event?.name}` });
      } else {
        toast.info('Invitation declined');
      }
    },
    onError: (error) => {
      toast.error('Failed to respond to invitation', { description: error.message });
    },
  });
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantId,
      updates,
    }: {
      participantId: string;
      updates: {
        role?: ParticipantRole;
        invitation_status?: InvitationStatus;
        handicap_index?: number;
        playing_handicap?: number;
        payment_status?: string;
        amount_due?: number;
        amount_paid?: number;
      };
    }) => {
      const { data, error } = await supabase
        .from('event_participants')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', data.event_id] });
      toast.success('Participant updated');
    },
    onError: (error) => {
      toast.error('Failed to update participant', { description: error.message });
    },
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantId,
      eventId,
    }: {
      participantId: string;
      eventId: string;
    }) => {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;
      return { participantId, eventId };
    },
    onSuccess: ({ eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
      toast.success('Participant removed');
    },
    onError: (error) => {
      toast.error('Failed to remove participant', { description: error.message });
    },
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();

  return useMutation({
    mutationFn: async ({
      eventId,
      handicapIndex,
    }: {
      eventId: string;
      handicapIndex?: number;
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Check if event allows joining (is public and published)
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('visibility, status, max_participants, allow_waitlist')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      if (event.status !== 'published') throw new Error('Event is not open for registration');

      // Check participant count
      const { count, error: countError } = await supabase
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('invitation_status', 'accepted');

      if (countError) throw countError;

      const isWaitlisted = event.max_participants && (count || 0) >= event.max_participants;

      if (isWaitlisted && !event.allow_waitlist) {
        throw new Error('Event is full and not accepting waitlist');
      }

      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: user.id,
          role: 'player',
          invitation_status: isWaitlisted ? 'waitlisted' : 'accepted',
          handicap_index: handicapIndex || null,
          responded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, isWaitlisted };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      
      if (data.isWaitlisted) {
        toast.info("You're on the waitlist", { 
          description: "We'll notify you if a spot opens up" 
        });
      } else {
        toast.success("You're in! 🏌️");
      }
    },
    onError: (error) => {
      toast.error('Failed to join event', { description: error.message });
    },
  });
}

export function useLeaveEvent() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast.success('You have left the event');
    },
    onError: (error) => {
      toast.error('Failed to leave event', { description: error.message });
    },
  });
}
