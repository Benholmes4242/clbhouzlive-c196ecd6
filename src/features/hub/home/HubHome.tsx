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
    <main className="hub-grid">
      <EchoQuickTile className="glass tile-pad" />
      <SwingQuickTile className="glass tile-pad" />

      <NearbyGolfersTile 
        className="glass tile-pad" 
        limit={5} 
        viewAllTo="/hub/golfers" 
      />

      <GamesNearYouTile 
        className="glass tile-pad"
        limit={3}
        viewAllTo="/hub/games"
        enableFilters
      />

      <YourGamesTile 
        className="glass tile-pad" 
        viewAllTo="/hub/your-games" 
      />

      <EchoHistoryTile 
        className="glass tile-pad"
        limitChat={3}
        limitSwing={2}
        viewAllTo="/hub/echo/history"
      />
    </main>
  );
}
