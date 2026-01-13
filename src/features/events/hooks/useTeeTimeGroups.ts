import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAutoGenerateGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roundId,
      playersPerGroup = 4,
    }: {
      roundId: string;
      playersPerGroup?: number;
    }) => {
      const { data, error } = await supabase.rpc('generate_tee_time_groups', {
        p_round_id: roundId,
        p_players_per_group: playersPerGroup,
      });

      if (error) throw error;
      return data as number;
    },
    onSuccess: (groupCount) => {
      queryClient.invalidateQueries({ queryKey: ['event-details'] });
      toast.success(`${groupCount} tee time group${groupCount !== 1 ? 's' : ''} created`);
    },
    onError: (error) => {
      toast.error('Failed to generate groups', { description: error.message });
    },
  });
}

export function useCreateTeeTimeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roundId,
      groupNumber,
      teeTime,
      startingHole = 1,
      groupName,
    }: {
      roundId: string;
      groupNumber: number;
      teeTime: string;
      startingHole?: number;
      groupName?: string;
    }) => {
      const { data, error } = await supabase
        .from('tee_time_groups')
        .insert({
          round_id: roundId,
          group_number: groupNumber,
          tee_time: teeTime,
          starting_hole: startingHole,
          group_name: groupName || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-details'] });
      toast.success('Tee time group created');
    },
    onError: (error) => {
      toast.error('Failed to create group', { description: error.message });
    },
  });
}

export function useUpdateTeeTimeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      updates,
    }: {
      groupId: string;
      updates: {
        tee_time?: string;
        starting_hole?: number;
        group_name?: string;
        status?: string;
      };
    }) => {
      const { data, error } = await supabase
        .from('tee_time_groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-details'] });
      toast.success('Group updated');
    },
    onError: (error) => {
      toast.error('Failed to update group', { description: error.message });
    },
  });
}

export function useDeleteTeeTimeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('tee_time_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-details'] });
      toast.success('Group deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete group', { description: error.message });
    },
  });
}

export function useAddPlayerToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      participantId,
      position,
      playingHandicap,
    }: {
      groupId: string;
      participantId: string;
      position: number;
      playingHandicap?: number;
    }) => {
      const { data, error } = await supabase
        .from('tee_time_group_players')
        .insert({
          group_id: groupId,
          participant_id: participantId,
          position,
          playing_handicap: playingHandicap || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-details'] });
    },
    onError: (error) => {
      toast.error('Failed to add player to group', { description: error.message });
    },
  });
}

export function useRemovePlayerFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      participantId,
    }: {
      groupId: string;
      participantId: string;
    }) => {
      const { error } = await supabase
        .from('tee_time_group_players')
        .delete()
        .eq('group_id', groupId)
        .eq('participant_id', participantId);

      if (error) throw error;
      return { groupId, participantId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-details'] });
    },
    onError: (error) => {
      toast.error('Failed to remove player from group', { description: error.message });
    },
  });
}

export function useMovePlayerToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantId,
      fromGroupId,
      toGroupId,
      position,
    }: {
      participantId: string;
      fromGroupId: string;
      toGroupId: string;
      position: number;
    }) => {
      // Delete from old group
      await supabase
        .from('tee_time_group_players')
        .delete()
        .eq('group_id', fromGroupId)
        .eq('participant_id', participantId);

      // Add to new group
      const { data, error } = await supabase
        .from('tee_time_group_players')
        .insert({
          group_id: toGroupId,
          participant_id: participantId,
          position,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-details'] });
    },
    onError: (error) => {
      toast.error('Failed to move player', { description: error.message });
    },
  });
}

export function useSwapPlayers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      player1GroupId,
      player1ParticipantId,
      player1Position,
      player2GroupId,
      player2ParticipantId,
      player2Position,
    }: {
      player1GroupId: string;
      player1ParticipantId: string;
      player1Position: number;
      player2GroupId: string;
      player2ParticipantId: string;
      player2Position: number;
    }) => {
      // Delete both players from their groups
      await supabase
        .from('tee_time_group_players')
        .delete()
        .eq('group_id', player1GroupId)
        .eq('participant_id', player1ParticipantId);

      await supabase
        .from('tee_time_group_players')
        .delete()
        .eq('group_id', player2GroupId)
        .eq('participant_id', player2ParticipantId);

      // Add players to swapped groups
      await supabase.from('tee_time_group_players').insert([
        {
          group_id: player2GroupId,
          participant_id: player1ParticipantId,
          position: player2Position,
        },
        {
          group_id: player1GroupId,
          participant_id: player2ParticipantId,
          position: player1Position,
        },
      ]);

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-details'] });
      toast.success('Players swapped');
    },
    onError: (error) => {
      toast.error('Failed to swap players', { description: error.message });
    },
  });
}
