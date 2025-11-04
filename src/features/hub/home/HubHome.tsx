/**
 * Hub Home Dashboard
 * Apple-style dashboard with glass morphism tiles
 */

import React from 'react';
import { EchoQuickTile } from './tiles/EchoQuickTile';
import { SwingQuickTile } from './tiles/SwingQuickTile';
import { NearbyGolfersTile } from './tiles/NearbyGolfersTile';
import { GamesNearYouTile } from './tiles/GamesNearYouTile';
import { YourGamesTile } from './tiles/YourGamesTile';

export default function HubHome() {
  return (
    <main className="w-full overflow-x-hidden px-3.5 pb-6 mt-3">
      {/* Top 2×2 grid */}
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.875rem' }}
      >
        <div className="hub-tile-fixed">
          <NearbyGolfersTile limit={5} />
        </div>
        <div className="hub-tile-fixed">
          <GamesNearYouTile limit={3} enableFilters={false} />
        </div>
      </div>

      {/* Your Games - full width */}
      <div className="mt-3.5">
        <YourGamesTile />
      </div>

      {/* Echo & Swing 2×2 grid */}
      <div
        className="grid mt-3.5"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.875rem' }}
      >
        <div className="hub-tile-fixed">
          <EchoQuickTile />
        </div>
        <div className="hub-tile-fixed">
          <SwingQuickTile />
        </div>
      </div>
    </main>
  );
}
