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
      // Deep link fallback - return to Hub
      nav('/hub', { replace: true });
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
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'var(--hub-stroke)',
          background: 'rgba(22, 24, 27, 0.98)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          paddingTop: 'env(safe-area-inset-top, 0px)',
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
      <div className="overflow-y-auto h-screen pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
        <YourGamesList
          onCreateGame={handleCreateGame}
          onFindGame={handleFindGame}
        />
      </div>
    </div>
  );
}
