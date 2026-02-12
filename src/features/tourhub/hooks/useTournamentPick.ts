import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface TournamentPick {
  player_name: string;
  player_id: string | null;
}

export function useTournamentPick(tournamentId: string | null) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const { data: currentPick = null, isLoading } = useQuery({
    queryKey: ['tournament-pick', tournamentId],
    queryFn: async (): Promise<TournamentPick | null> => {
      if (!tournamentId || !userId) return null;
      const { data, error } = await supabase
        .from('tournament_picks')
        .select('player_name, player_id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data) return null;
      return { player_name: data.player_name, player_id: data.player_id };
    },
    enabled: !!tournamentId && !!userId,
  });

  const mutation = useMutation({
    mutationFn: async ({ playerName, playerId }: { playerName: string; playerId: string }) => {
      if (!userId || !tournamentId) return;
      const { error } = await supabase
        .from('tournament_picks')
        .upsert(
          {
            user_id: userId,
            tournament_id: tournamentId,
            player_name: playerName,
            player_id: playerId,
            picked_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,tournament_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-pick', tournamentId] });
    },
  });

  const makePick = (playerName: string, playerId: string) => {
    if (!userId) return;
    mutation.mutate({ playerName, playerId });
  };

  return { currentPick, makePick, isLoading, isAuthenticated: !!userId };
}
