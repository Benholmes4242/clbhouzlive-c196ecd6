/**
 * useGameReminders - Hook for managing game reminder settings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface GameReminderSettings {
  id: string;
  enabled: boolean;
  remind24h: boolean;
  remind2h: boolean;
}

export function useGameReminders(gameId: string | undefined) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['game-reminders', gameId, user?.id],
    queryFn: async (): Promise<GameReminderSettings | null> => {
      if (!gameId || !user?.id) return null;

      const { data, error } = await supabase
        .from('game_reminders')
        .select('id, enabled, remind_24h, remind_2h')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // No settings yet - return defaults
        return null;
      }

      return {
        id: data.id,
        enabled: data.enabled,
        remind24h: data.remind_24h,
        remind2h: data.remind_2h,
      };
    },
    enabled: !!gameId && !!user?.id,
  });

  const upsertMutation = useMutation({
    mutationFn: async (settings: Partial<Omit<GameReminderSettings, 'id'>>) => {
      if (!gameId || !user?.id) throw new Error('Missing game or user');

      const { data: existing } = await supabase
        .from('game_reminders')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('game_reminders')
          .update({
            enabled: settings.enabled,
            remind_24h: settings.remind24h,
            remind_2h: settings.remind2h,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('game_reminders')
          .insert({
            game_id: gameId,
            user_id: user.id,
            enabled: settings.enabled ?? true,
            remind_24h: settings.remind24h ?? true,
            remind_2h: settings.remind2h ?? true,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-reminders', gameId, user?.id] });
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: upsertMutation.mutateAsync,
    isUpdating: upsertMutation.isPending,
  };
}
