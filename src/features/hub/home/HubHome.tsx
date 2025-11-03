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
      {/* Top 2×2 grid */}
      <section 
        className="grid gap-4 sm:gap-5"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
      >
        <EchoQuickTile />
        <SwingQuickTile />
        <NearbyGolfersTile limit={5} />
        <GamesNearYouTile limit={3} enableFilters={false} />
      </section>

      {/* Full-width stack */}
      <section className="mt-6 grid gap-4 sm:gap-5">
        <YourGamesTile />
        <EchoHistoryTile limitChat={1} limitSwing={2} />
      </section>
    </main>
  );
}
