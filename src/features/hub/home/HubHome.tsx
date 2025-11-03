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
    <main 
      className="w-full max-w-[720px] mx-auto px-4 md:px-5 py-4"
    >
      <div 
        className="grid gap-3 md:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2"
      >
        <style>{`
          @media (max-width: 360px) {
            .grid.grid-cols-1.xs\\:grid-cols-2 {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      
        <EchoQuickTile />
        <SwingQuickTile />
        <NearbyGolfersTile limit={5} viewAllTo="/hub/golfers" />
        <GamesNearYouTile limit={3} viewAllTo="/hub/games" enableFilters />
        <YourGamesTile viewAllTo="/hub/your-games" />
        <EchoHistoryTile limitChat={3} limitSwing={2} viewAllTo="/hub/echo/history" />
      </div>
    </main>
  );
}
