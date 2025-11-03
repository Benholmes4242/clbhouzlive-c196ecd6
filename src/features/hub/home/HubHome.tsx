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
    <main className="w-full overflow-x-hidden px-3.5 pb-6">
      {/* Row 1 — Echo + Swing (2-up) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <EchoQuickTile />
        <SwingQuickTile />
      </div>

      {/* Row 2 — Nearby + Games (2-up) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 mt-3.5">
        <NearbyGolfersTile limit={5} />
        <GamesNearYouTile limit={3} enableFilters={false} />
      </div>

      {/* Row 3 — Your Games (full-width) */}
      <div className="mt-3.5">
        <YourGamesTile />
      </div>

      {/* Row 4 — Recent Echo (full-width) */}
      <div className="mt-3.5">
        <EchoHistoryTile limitChat={1} limitSwing={2} />
      </div>
    </main>
  );
}
