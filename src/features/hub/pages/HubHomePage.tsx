/**
 * Hub Home Page
 * Standalone glass page showing Hub dashboard with tiles
 */

import React, { useEffect } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { EchoTile } from '../home/tiles/EchoTile';
import { QuickActionsTile } from '../home/tiles/QuickActionsTile';
import { NearbyGolfersTile } from '../home/tiles/NearbyGolfersTile';
import { YourGamesTile } from '../home/tiles/YourGamesTile';
import '../home/hubTheme.css';

export function HubHomePage() {
  
  // Subscribe to realtime join request notifications
  useJoinRequestNotifications();

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

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Hub Dashboard */}
      <main className="w-full overflow-y-auto h-screen pt-[env(safe-area-inset-top,0px)] px-3.5">
        <div className="pt-1.5">
        {/* Nearby Golfers - Full width */}
        <div style={{ height: 'var(--hub-tile-fixed-h)' }}>
          <NearbyGolfersTile />
        </div>

        {/* Your Games - calculated height to push bottom tiles to 12px from edge */}
        <div 
          className="mt-3.5" 
          style={{ 
            height: 'calc(100vh - var(--hub-tile-fixed-h) - 0.875rem - 0.875rem - 0.75rem - 12px - env(safe-area-inset-top, 0px) - ((100vw - 28px - 0.875rem) / 2))' 
          }}
        >
          <YourGamesTile />
        </div>

        {/* Echo & Quick Actions 2×2 grid - Square tiles */}
        <div
          className="grid mt-3.5"
          style={{ 
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
            gap: '0.875rem',
          }}
        >
          <div style={{ aspectRatio: '1', width: '100%' }}>
            <EchoTile />
          </div>
          <div style={{ aspectRatio: '1', width: '100%' }}>
            <QuickActionsTile />
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
