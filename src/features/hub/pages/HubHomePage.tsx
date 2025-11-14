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
import '../home/hubTheme.css';

export function HubHomePage() {
  const nav = useNavigate();
  const loc = useLocation();

  // Mark hub-open on html while mounted
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => {
      document.documentElement.classList.remove('hub-open');
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
        className="fixed top-0 left-0 right-0 z-[10000] px-5 pt-4 pb-3"
        style={{
          background: 'transparent',
          borderBottom: '1px solid var(--hub-header-stroke)',
          paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center justify-between" style={{ userSelect: 'none' }}>
          <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* Hub Dashboard */}
      <main className="w-full overflow-y-auto h-screen pt-[calc(80px+env(safe-area-inset-top,0px))] px-3.5 pb-3.5">
        <div className="pt-1.5 flex flex-col gap-3.5">
          {/* 1. Nearby Golfers - Full width */}
          <section aria-label="Nearby golfers">
            <NearbyGolfersTile />
          </section>

          {/* 2. Your Games - Middle section */}
          <section aria-label="Your games">
            <YourGamesTile />
          </section>

          {/* 3. Bottom row: Echo + Quick Actions */}
          <section 
            aria-label="Echo and quick actions"
            className="grid gap-3.5 grid-cols-1 md:grid-cols-2"
          >
            <EchoTile />
            <QuickActionsTile />
          </section>
        </div>
      </main>
    </div>
  );
}
