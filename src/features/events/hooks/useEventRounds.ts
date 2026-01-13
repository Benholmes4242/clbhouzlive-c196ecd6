import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateRoundInput {
  event_id: string;
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

export function useCreateEventRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRoundInput) => {
      // Get the next round number
      const { data: existingRounds } = await supabase
        .from('event_rounds')
        .select('round_number')
        .eq('event_id', input.event_id)
        .order('round_number', { ascending: false })
        .limit(1);

      const nextRoundNumber = (existingRounds?.[0]?.round_number || 0) + 1;

      const { data, error } = await supabase
        .from('event_rounds')
        .insert({
          ...input,
          round_number: nextRoundNumber,
          holes: input.holes || 18,
          tee_time_interval: input.tee_time_interval || 8,
          par: input.par || 72,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', data.event_id] });
      toast.success('Round added', { description: data.course_name });
    },
    onError: (error) => {
      toast.error('Failed to add round', { description: error.message });
    },
  });
}

export function useUpdateEventRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roundId,
      updates,
    }: {
      roundId: string;
      updates: Partial<Omit<CreateRoundInput, 'event_id'>>;
    }) => {
      const { data, error } = await supabase
        .from('event_rounds')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roundId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', data.event_id] });
      toast.success('Round updated');
    },
    onError: (error) => {
      toast.error('Failed to update round', { description: error.message });
    },
  });
}

export function useDeleteEventRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roundId,
      eventId,
    }: {
      roundId: string;
      eventId: string;
    }) => {
      const { error } = await supabase
        .from('event_rounds')
        .delete()
        .eq('id', roundId);

      if (error) throw error;
      return { roundId, eventId };
    },
    onSuccess: ({ eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
      toast.success('Round removed');
    },
    onError: (error) => {
      toast.error('Failed to remove round', { description: error.message });
    },
  });
}

export function useReorderEventRounds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      roundIds,
    }: {
      eventId: string;
      roundIds: string[];
    }) => {
      // Update each round with its new position
      const updates = roundIds.map((id, index) => ({
        id,
        round_number: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('event_rounds')
          .update({ round_number: update.round_number })
          .eq('id', update.id);

        if (error) throw error;
      }

      return true;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
    },
    onError: (error) => {
      toast.error('Failed to reorder rounds', { description: error.message });
    },
  });
}

export function useStartRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roundId,
      eventId,
    }: {
      roundId: string;
      eventId: string;
    }) => {
      const { data, error } = await supabase
        .from('event_rounds')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', roundId)
        .select()
        .single();

      if (error) throw error;
      return { round: data, eventId };
    },
    onSuccess: ({ eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
      toast.success('Round started!');
    },
    onError: (error) => {
      toast.error('Failed to start round', { description: error.message });
    },
  });
}

export function useCompleteRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roundId,
      eventId,
    }: {
      roundId: string;
      eventId: string;
    }) => {
      const { data, error } = await supabase
        .from('event_rounds')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', roundId)
        .select()
        .single();

      if (error) throw error;
      return { round: data, eventId };
    },
    onSuccess: ({ eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
      toast.success('Round completed!');
    },
    onError: (error) => {
      toast.error('Failed to complete round', { description: error.message });
    },
  });
}
