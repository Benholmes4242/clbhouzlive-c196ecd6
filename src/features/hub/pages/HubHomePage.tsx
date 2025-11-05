/**
 * Hub Home Page - Standalone Glass Overlay
 * Apple-style dashboard with glass morphism tiles
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { EchoTile } from '../home/tiles/EchoTile';
import { QuickActionsTile } from '../home/tiles/QuickActionsTile';
import { NearbyGolfersTile } from '../home/tiles/NearbyGolfersTile';
import { YourGamesTile } from '../home/tiles/YourGamesTile';
import { SwingQuickTile } from '../home/tiles/SwingQuickTile';
import '../home/hubTheme.css';

export default function HubHomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleClose = () => {
    const state = location.state as { backgroundLocation?: Location } | null;
    if (state?.backgroundLocation) {
      navigate(-1); // Go back to origin page
    } else {
      navigate('/clubhouse', { replace: true });
    }
  };

  return (
    <>
      {/* Glass backdrop */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(120px)',
          WebkitBackdropFilter: 'blur(120px)',
          zIndex: 9999,
        }}
        onClick={handleClose}
      />

      {/* Glass page content */}
      <div
        className="fixed inset-0 flex flex-col"
        style={{
          zIndex: 10000,
          pointerEvents: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full h-full flex flex-col overflow-hidden pointer-events-auto"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header */}
          <div className="shrink-0 px-5 pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/logomark-orange.png"
                  alt="Logo mark"
                  className="h-10 w-auto object-contain"
                />
                <img
                  src="/assets/clbhouz-white.png"
                  alt="clbhouz"
                  className="h-10 w-auto object-contain"
                />
              </div>
              
              <button
                onClick={handleClose}
                className="w-11 h-11 flex items-center justify-center -mr-2 transition-colors active:scale-95"
                style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                aria-label="Close hub"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content - scrollable tiles */}
          <div className="flex-1 overflow-y-auto px-3.5 pb-4">
            {/* Top 2×2 grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '0.875rem',
                gridAutoRows: 'var(--hub-tile-fixed-h)',
              }}
            >
              <div className="hub-tile-fixed">
                <NearbyGolfersTile limit={5} />
              </div>
              <div className="hub-tile-fixed">
                <EchoTile />
              </div>
            </div>

            {/* Your Games */}
            <div className="mt-3.5">
              <YourGamesTile />
            </div>

            {/* Bottom 2×2 grid */}
            <div
              className="grid mt-3.5"
              style={{
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '0.875rem',
                gridAutoRows: 'var(--hub-tile-fixed-h)',
              }}
            >
              <div className="hub-tile-fixed">
                <SwingQuickTile />
              </div>
              <div className="hub-tile-fixed">
                <QuickActionsTile />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
