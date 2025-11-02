/**
 * Hub Your Games Page
 * 
 * Wrapper for existing Your Games tab content.
 */

import React from 'react';
import { YourGamesList } from '@/features/nearby/components/YourGamesList';
import { supabase } from '@/integrations/supabase/client';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { useNavigate } from 'react-router-dom';

export function HubYourGamesPage() {
  const { cancelBeacon } = useGameBeacon({});
  const navigate = useNavigate();

  const handleLeaveGame = async (gameId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
      .from('game_participants')
      .delete()
      .eq('game_id', gameId)
      .eq('user_id', user.id);
  };

  return (
    <YourGamesList
      activeTab="your-games"
      onCancelGame={cancelBeacon}
      onLeaveGame={handleLeaveGame}
      onCreateGame={() => navigate('/hub/create-game')}
      onFindGame={() => navigate('/hub/games')}
    />
  );
}
