/**
 * Hub Golfers Page
 * 
 * Full-screen glass page showing nearby golfers.
 * Opens as an overlay above the origin page.
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHub } from '@/features/hub/useHub';
import { GolfersScreen } from '@/features/hub/sheets/GolfersScreen';
import '../home/hubTheme.css';

export function HubGolfersPage() {
  const { open } = useHub();
  const nav = useNavigate();
  const loc = useLocation();

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
        <h1 className="text-white/90 text-[17px] font-semibold">Golfers</h1>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="overflow-y-auto h-[calc(100vh-3.5rem)] px-4 pt-4">
        <GolfersScreen onClose={handleBack} />
      </div>
    </div>
  );
}
