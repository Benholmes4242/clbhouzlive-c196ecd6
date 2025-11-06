/**
 * Hub Your Games Page
 * Full-screen glass page overlaying the origin page.
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { YourGamesList } from '@/features/nearby/components/YourGamesList';
import { useHub } from '@/features/hub/useHub';
import '../home/hubTheme.css';

export function HubYourGamesPage() {
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

  const handleCreateGame = () => {
    navigateFromHub('/hub/create-game');
  };

  const handleFindGame = () => {
    navigateFromHub('/hub/games');
  };

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Simple header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <button
          onClick={goBack}
          className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
          aria-label="Back to Hub"
        >
          ‹ Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">Your Games</h1>
        <div className="w-16" />
      </header>

      {/* Content area - YourGamesList content */}
      <div className="overflow-y-auto h-[calc(100vh-3.5rem)]">
        <YourGamesList
          onCreateGame={handleCreateGame}
          onFindGame={handleFindGame}
        />
      </div>
    </div>
  );
}
