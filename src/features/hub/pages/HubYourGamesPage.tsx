/**
 * Hub Your Games Page
 * 
 * Your hosted and joined games with realtime updates (Phase 3).
 */

import React, { useEffect } from 'react';
import { YourGamesList } from '@/features/nearby/components/YourGamesList';
import { supabase } from '@/integrations/supabase/client';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { useNavigate } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function HubYourGamesPage() {
  const { cancelBeacon } = useGameBeacon({});
  const navigate = useNavigate();

  useEffect(() => {
    // Track Your Games tab view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.your_games_view.event, {
        event_category: analyticsEvents.hub.your_games_view.category,
        event_label: analyticsEvents.hub.your_games_view.label,
      });
    }
  }, []);

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
