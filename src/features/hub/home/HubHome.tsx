/**
 * Hub Home Dashboard
 * Apple-style dashboard with glass morphism tiles
 */

import React from 'react';
import { EchoTile } from './tiles/EchoTile';
import { QuickActionsTile } from './tiles/QuickActionsTile';
import { NearbyGolfersTile } from './tiles/NearbyGolfersTile';
import { YourGamesTile } from './tiles/YourGamesTile';
import { SwingQuickTile } from './tiles/SwingQuickTile';

export default function HubHome() {
  return (
    <main className="w-full overflow-x-hidden px-3.5 mt-3">
      {/* Top 2×2 grid */}
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.875rem', gridAutoRows: 'var(--hub-tile-fixed-h)' }}
      >
      <div className="hub-tile-fixed">
          <NearbyGolfersTile limit={5} />
        </div>
        <div className="hub-tile-fixed">
          <EchoTile />
        </div>
      </div>

      {/* Your Games - calculated height to push bottom tiles to 12px from edge */}
      <div 
        className="mt-3.5" 
        style={{ 
          height: 'calc(100vh - var(--hub-header-h, 80px) - env(safe-area-inset-top) - env(safe-area-inset-bottom) - var(--hub-tile-fixed-h) - var(--hub-tile-fixed-h) - 0.875rem - 0.875rem - 0.75rem - 12px)' 
        }}
      >
        <YourGamesTile />
      </div>

      {/* Echo & Quick Actions 2×2 grid */}
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
    </main>
  );
}
