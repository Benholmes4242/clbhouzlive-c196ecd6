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
    <div className="hub-grid">
      {/* Top row - fixed height */}
      <section className="tile tile--fixed hub-top-left">
        <NearbyGolfersTile limit={5} />
      </section>

      <section className="tile tile--fixed hub-top-right">
        <GamesNearYouTile limit={3} enableFilters={false} />
      </section>

      {/* Middle - grows to fill */}
      <section className="tile tile--flex hub-middle-wide">
        <div className="tile-body">
          <YourGamesTile />
        </div>
      </section>

      {/* Bottom row - fixed height */}
      <section className="tile tile--fixed hub-bottom-left">
        <EchoQuickTile />
      </section>

      <section className="tile tile--fixed hub-bottom-right">
        <SwingQuickTile />
      </section>
    </div>
  );
}
