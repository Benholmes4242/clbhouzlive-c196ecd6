/**
 * Hub Your Games Page
 * 
 * Full-screen glass page showing your hosted and joined games.
 * Opens as an overlay above the origin page.
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHub } from '@/features/hub/useHub';
import { YourGamesList } from '@/features/nearby/components/YourGamesList';
import { supabase } from '@/integrations/supabase/client';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { analyticsEvents } from '@/utils/analyticsEvents';
import '../home/hubTheme.css';

export function HubYourGamesPage() {
  const { open } = useHub();
  const nav = useNavigate();
  const loc = useLocation();
  const { cancelBeacon } = useGameBeacon({});

  useEffect(() => {
    // Track Your Games tab view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.your_games_view.event, {
        event_category: analyticsEvents.hub.your_games_view.category,
        event_label: analyticsEvents.hub.your_games_view.label,
      });
    }
  }, []);

  const handleBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      // Return to Hub overlay
      open();
    } else {
      // Deep link fallback
      nav('/clubhouse', { replace: true });
    }
  };

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
    <div
      className="fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Simple Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <button
          onClick={handleBack}
          className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
          aria-label="Back to Hub"
        >
          ‹ Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">Your Games</h1>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="overflow-y-auto h-[calc(100vh-3.5rem)] px-4 pt-4">
        <YourGamesList
          activeTab="your-games"
          onCancelGame={cancelBeacon}
          onLeaveGame={handleLeaveGame}
          onCreateGame={() => nav('/hub/create-game')}
          onFindGame={() => nav('/hub/games')}
        />
      </div>
    </div>
  );
}
