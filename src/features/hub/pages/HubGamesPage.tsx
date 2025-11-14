/**
 * Hub Games Page
 * Full-screen glass page overlaying the origin page.
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GamesTab } from '@/features/nearby/GamesTab';
import { useHub } from '@/features/hub/useHub';
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
      // Deep link fallback - return to Hub
      nav('/hub', { replace: true });
    }
  };

  const handleOpenCreate = () => {
    navigateFromHub('/hub/create-game');
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
      {/* Minimal top bar with back only */}
      <header 
        className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 h-12 border-b"
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
        <div className="w-16" />
      </header>

      {/* Content area - GamesTab content */}
      <div className="overflow-y-auto h-screen pt-[calc(3rem+env(safe-area-inset-top,0px))]">
        <GamesTab onOpenCreate={handleOpenCreate} />
      </div>
    </div>
  );
}
