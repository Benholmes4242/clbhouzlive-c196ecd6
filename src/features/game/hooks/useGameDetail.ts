import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Game, GameParticipant } from '@/features/nearby/types';

export function useGameDetail(gameId: string | null) {
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setIsLoading(false);
      return;
    }

    fetchGameDetail();
  }, [gameId]);

  const fetchGameDetail = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Fetch game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('id, host_user_id, course_name, course_id, start_time, expires_at, status, slots_total, slots_open, visibility, note, lat, lng, created_at, updated_at')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      // Fetch participants with profiles
      const { data: participantsData, error: participantsError } = await supabase
        .from('game_participants')
        .select(`
          id, 
          game_id, 
          user_id, 
          role, 
          state, 
          reserves_slot, 
          joined_at, 
          created_at, 
          updated_at
        `)
        .eq('game_id', gameId)
        .eq('state', 'accepted')
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (participantsError) throw participantsError;

      // Enrich with user profiles
      const enrichedParticipants = await Promise.all(
        (participantsData || []).map(async (p) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, display_name, username, profile_photo_url')
            .eq('id', p.user_id)
            .single();

          return {
            ...p,
            user_profiles: profile || undefined,
          } as GameParticipant;
        })
      );

      setGame({
        ...gameData,
        isHost: user?.id === gameData.host_user_id,
      } as Game);
      setParticipants(enrichedParticipants);
    } catch (error) {
      console.error('Error fetching game detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    game,
    participants,
    isLoading,
    currentUserId,
    refetch: fetchGameDetail,
  };
}
