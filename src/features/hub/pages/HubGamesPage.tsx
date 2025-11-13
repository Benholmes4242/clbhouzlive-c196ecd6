/**
 * Hub Games Page
 * Full-screen glass page overlaying the origin page.
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GamesTab } from '@/features/nearby/GamesTab';
import { useHub } from '@/features/hub/useHub';
import { AppleGlassScreen, AppleGlassHeader } from '../components/AppleGlassScreen';
import '../home/hubTheme.css';

export function HubGamesPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { navigateFromHub } = useHub();

  const goBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      // Navigate back to close this overlay
      nav(-1);
    } else {
      // Deep link fallback
      nav('/clubhouse', { replace: true });
    }
  };

  const handleOpenCreate = () => {
    navigateFromHub('/hub/create-game');
  };

  return (
    <AppleGlassScreen>
      <AppleGlassHeader onBack={goBack} title="Games" />

      {/* Content area - GamesTab content */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
        <GamesTab onOpenCreate={handleOpenCreate} />
      </div>
    </AppleGlassScreen>
  );
}
