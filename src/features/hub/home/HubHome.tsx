/**
 * Hub Home Dashboard
 * Apple-style dashboard with glass morphism tiles
 */

import React from 'react';
import { EchoTile } from './tiles/EchoTile';
import { QuickActionsTile } from './tiles/QuickActionsTile';
import { NearbyGolfersTile } from './tiles/NearbyGolfersTile';
import { GamesNearYouTile } from './tiles/GamesNearYouTile';
import { YourGamesTile } from './tiles/YourGamesTile';

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
          <GamesNearYouTile limit={3} enableFilters={false} />
        </div>
      </div>

      {/* Your Games - full width, fixed height */}
      <div className="mt-3.5" style={{ height: 'var(--hub-tile-fixed-h)' }}>
        <YourGamesTile />
      </div>

      {/* Echo & Quick Actions 2×2 grid (pinned to bottom for verification) */}
      <div
        className="grid mt-3.5"
        style={{ 
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
          gap: '0.875rem', 
          gridAutoRows: 'var(--hub-tile-fixed-h)',
          position: 'sticky',
          bottom: '12px',
          zIndex: 1,
        }}
        data-bottom-pinned
      >
        <div className="hub-tile-fixed">
          <EchoTile />
        </div>
        <div className="hub-tile-fixed">
          <QuickActionsTile />
        </div>
      </div>
      <div style={{ height: '12px' }} aria-hidden="true" />
    </main>
  );
}
