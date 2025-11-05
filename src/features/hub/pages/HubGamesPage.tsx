/**
 * Hub Games Page
 * 
 * Full-screen Games page with glass background, rendered over origin page.
 */

import React, { useEffect } from 'react';
import { GamesTab } from '@/features/nearby/GamesTab';
import { useNavigate } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HubPageHeader } from '../components/HubPageHeader';
import { useHub } from '../useHub';
import { Z } from '@/config/zIndex';
import '../home/hubTheme.css';

export function HubGamesPage() {
  const navigate = useNavigate();
  const { navigateFromHub } = useHub();

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
        <HubPageHeader title="Games" />

        <div className="flex-1 overflow-y-auto">
          <GamesTab 
            onOpenCreate={() => navigateFromHub('/hub/create-game')} 
          />
        </div>
      </div>
    </>
  );
}
