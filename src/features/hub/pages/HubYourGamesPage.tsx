/**
 * Hub Your Games Page
 * 
 * Full-screen Your Games page with glass background, rendered over origin page.
 */

import React, { useEffect } from 'react';
import { YourGamesList } from '@/features/nearby/components/YourGamesList';
import { supabase } from '@/integrations/supabase/client';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { useNavigate } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HubPageHeader } from '../components/HubPageHeader';
import { useHub } from '../useHub';
import { Z } from '@/config/zIndex';
import '../home/hubTheme.css';

export function HubYourGamesPage() {
  const { cancelBeacon } = useGameBeacon({});
  const navigate = useNavigate();
  const { navigateFromHub } = useHub();

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
    <>
      {/* Glass background */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(120px)',
          WebkitBackdropFilter: 'blur(120px)',
          zIndex: Z.hub,
        }}
      />

      {/* Content */}
      <div
        className="fixed inset-0 flex flex-col"
        style={{
          zIndex: Z.hub,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <HubPageHeader title="Your Games" />

        <div className="flex-1 overflow-y-auto">
          <YourGamesList
            activeTab="your-games"
            onCancelGame={cancelBeacon}
            onLeaveGame={handleLeaveGame}
            onCreateGame={() => navigateFromHub('/hub/create-game')}
            onFindGame={() => navigateFromHub('/hub/games')}
          />
        </div>
      </div>
    </>
  );
}
