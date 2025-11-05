/**
 * Hub Games Page
 * 
 * Games discovery tab with normalized UI (Phase 3).
 */

import React, { useEffect } from 'react';
import { GamesTab } from '@/features/nearby/GamesTab';
import { useNavigate } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function HubGamesPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Track Games tab view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.games_view.event, {
        event_category: analyticsEvents.hub.games_view.category,
        event_label: analyticsEvents.hub.games_view.label,
      });
    }
  }, []);

  return (
    <GamesTab 
      onOpenCreate={() => navigate('/hub/create-game')} 
    />
  );
}
