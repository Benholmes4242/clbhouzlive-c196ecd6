/**
 * useUpdateGame - Hook for updating game details
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UpdateGameParams {
  gameId: string;
  updates: {
    course_id?: string | null;
    course_name?: string;
    start_time?: string;
    visibility?: string;
    note?: string | null;
    slots_total?: number;
  };
}

export function useUpdateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId, updates }: UpdateGameParams) => {
      const { data, error } = await supabase
        .from('games')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
      queryClient.invalidateQueries({ queryKey: ['game-detail', variables.gameId] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
      queryClient.invalidateQueries({ queryKey: ['discover-games'] });
    },
  });
}
