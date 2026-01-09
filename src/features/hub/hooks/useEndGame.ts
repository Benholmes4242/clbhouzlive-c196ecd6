/**
 * useEndGame - Hook for ending a game
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSendGameCompletedNotification } from './useGameNotifications';

export function useEndGame() {
  const queryClient = useQueryClient();
  const sendGameCompletedNotification = useSendGameCompletedNotification();

  return useMutation({
    mutationFn: async (gameId: string) => {
      // Get game info and participants before ending
      const { data: game } = await supabase
        .from('games')
        .select('course_name, host_user_id')
        .eq('id', gameId)
        .single();

      const { data: participants } = await supabase
        .from('game_participants')
        .select('user_id')
        .eq('game_id', gameId)
        .not('user_id', 'is', null);

      const { error } = await supabase
        .from('games')
        .update({
          status: 'completed',
          ends_at: new Date().toISOString(),
        })
        .eq('id', gameId);

      if (error) throw error;

      // Disable reminders for all participants
      await supabase
        .from('game_reminders')
        .update({ enabled: false })
        .eq('game_id', gameId);

      return {
        gameId,
        courseName: game?.course_name || 'Golf Game',
        hostUserId: game?.host_user_id,
        participantUserIds: participants?.map(p => p.user_id).filter(Boolean) as string[] || [],
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['game', result.gameId] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });

      // Send game completed notification to all participants (actor excluded by hook)
      if (result.participantUserIds.length > 0) {
        // Include host if not already in participants
        const allRecipients = result.hostUserId 
          ? [...new Set([result.hostUserId, ...result.participantUserIds])]
          : result.participantUserIds;

        sendGameCompletedNotification.mutate({
          gameId: result.gameId,
          participantUserIds: allRecipients,
          courseName: result.courseName,
        });
      }
    },
  });
}
