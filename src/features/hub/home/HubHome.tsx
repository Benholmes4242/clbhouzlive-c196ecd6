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
    <main className="w-full overflow-x-hidden px-3 pb-6">
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 'var(--hub-gap)',
        }}
      >
        <style>{`
          @media (max-width: 360px) {
            main > div {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* Row 1 — Echo + Swing (same height) */}
        <EchoQuickTile />
        <SwingQuickTile />

        {/* Row 2 — Nearby + Games */}
        <NearbyGolfersTile limit={5} viewAllTo="/hub/golfers" />
        <GamesNearYouTile limit={3} viewAllTo="/hub/games" enableFilters={false} />

        {/* Row 3 — Your Games + Recent Echo */}
        <YourGamesTile viewAllTo="/hub/your-games" />
        <EchoHistoryTile limitChat={1} limitSwing={2} viewAllTo="/hub/echo/history" />
      </div>
    </main>
  );
}
