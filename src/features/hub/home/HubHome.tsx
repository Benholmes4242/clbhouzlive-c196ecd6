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
import { EchoHistoryTile } from './tiles/EchoHistoryTile';

export default function HubHome() {
  return (
    <main className="w-full overflow-x-hidden px-3.5 pb-6 mt-3">
      {/* Top 2×2 grid */}
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.875rem' }}
      >
        <EchoQuickTile />
        <SwingQuickTile />
        <NearbyGolfersTile limit={5} />
        <GamesNearYouTile limit={3} enableFilters={false} />
      </div>

      {/* Full-width stack */}
      <div className="mt-3.5 space-y-3.5">
        <YourGamesTile />
        <EchoHistoryTile limitChat={1} limitSwing={2} />
      </div>
    </main>
  );
}
