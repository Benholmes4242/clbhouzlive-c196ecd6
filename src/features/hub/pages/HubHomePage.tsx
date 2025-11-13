/**
 * Hub Home Page
 * Standalone glass page showing Hub dashboard with tiles
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { EchoTile } from '../home/tiles/EchoTile';
import { QuickActionsTile } from '../home/tiles/QuickActionsTile';
import { NearbyGolfersTile } from '../home/tiles/NearbyGolfersTile';
import { YourGamesTile } from '../home/tiles/YourGamesTile';
import { SwingQuickTile } from '../home/tiles/SwingQuickTile';
import '../home/hubTheme.css';

export function HubHomePage() {
  const nav = useNavigate();
  const loc = useLocation();
  const [isAnimating, setIsAnimating] = React.useState(true);

  // Mark hub-open on html while mounted
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    document.body.classList.add('hub-open');
    // Trigger animation
    setTimeout(() => setIsAnimating(false), 10);
    
    return () => {
      document.documentElement.classList.remove('hub-open');
      document.body.classList.remove('hub-open');
    };
  }, []);

  // Track Hub open on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.opened.event, {
        event_category: analyticsEvents.hub.opened.category,
        event_label: analyticsEvents.hub.opened.label,
      });
    }
  }, []);

  const handleBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      // Return to origin page
      nav(-1);
    } else {
      // Deep link fallback
      nav('/clubhouse', { replace: true });
    }
  };

  return (
    <>
      {/* Environment Layer - Dimmed background */}
      <div
        className={`hub-environment-layer ${isAnimating ? '' : 'hub-environment-layer--visible'}`}
        onClick={handleBack}
        aria-label="Close hub"
      />

      {/* Hub Cards Wrapper */}
      <div
        className={`hub-wrapper ${isAnimating ? '' : 'hub-wrapper--visible'}`}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 910,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between mb-4"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            pointerEvents: 'auto',
          }}
        >
          <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
            <img
              src="/assets/logomark-orange.png"
              alt="Logo mark"
              className="h-10 md:h-12 w-auto object-contain"
            />
            <img
              src="/assets/clbhouz-white.png"
              alt="clbhouz"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </div>
          
          <TapButton
            onPointerDown={handleBack}
            className="transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -mr-2"
            style={{ color: 'var(--hub-close-idle)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-close-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-close-idle)'}
            aria-label="Close hub"
          >
            <X className="w-5 h-5" />
          </TapButton>
        </header>

        {/* Hub Dashboard - Viewport locked */}
        <main 
          className="w-full overflow-hidden flex-1"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex flex-col h-full">
            {/* Top 2×2 grid - Fixed */}
            <div
              className="mb-4"
              style={{ flex: '0 0 auto' }}
            >
              <div
                className="grid"
                style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.875rem', gridAutoRows: 'var(--hub-tile-fixed-h)' }}
              >
                <div className="hub-tile-fixed hub-floating-card">
                  <NearbyGolfersTile />
                </div>
                <div className="hub-tile-fixed hub-floating-card">
                  <EchoTile />
                </div>
              </div>
            </div>

            {/* Your Games - Flexible */}
            <div 
              className="hub-floating-card mb-4" 
              style={{ flex: '1 1 auto', minHeight: '200px', overflow: 'hidden' }}
            >
              <YourGamesTile />
            </div>

            {/* Bottom 2×2 grid - Fixed at bottom */}
            <div
              style={{ flex: '0 0 auto' }}
            >
              <div
                className="grid"
                style={{ 
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
                  gap: '0.875rem',
                }}
              >
                <div className="hub-tile-square hub-floating-card">
                  <SwingQuickTile />
                </div>
                <div className="hub-tile-square hub-floating-card">
                  <QuickActionsTile />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
