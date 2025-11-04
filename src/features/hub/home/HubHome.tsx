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
    <main className="w-full hub-home-container">
      {/* Top 2×2 grid - fixed height tiles */}
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}
      >
        <div className="hub-tile-fixed">
          <NearbyGolfersTile limit={5} />
        </div>
        <div className="hub-tile-fixed">
          <GamesNearYouTile limit={3} enableFilters={false} />
        </div>
      </div>

      {/* Your Games - flex to fill remaining space */}
      <div className="hub-middle-flex">
        <YourGamesTile />
      </div>

      {/* Echo & Swing 2×2 grid - fixed height tiles */}
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}
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
