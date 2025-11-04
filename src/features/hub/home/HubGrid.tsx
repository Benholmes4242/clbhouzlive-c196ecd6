/**
 * Hub Grid - 2–1–2 Control-Center Layout
 * Top 2 tiles → Middle full-width flex tile → Bottom 2 tiles
 */

import React from 'react';
import { NearbyGolfersTile } from './tiles/NearbyGolfersTile';
import { GamesNearYouTile } from './tiles/GamesNearYouTile';
import { YourGamesTile } from './tiles/YourGamesTile';
import { EchoTile } from './tiles/EchoTile';
import { SwingCoachTile } from './tiles/SwingCoachTile';

export default function HubGrid() {
  return (
    <main className="hub-grid">
      <section className="tile tile--fixed hub-top-left">
        <NearbyGolfersTile />
      </section>
      <section className="tile tile--fixed hub-top-right">
        <GamesNearYouTile />
      </section>
      <section className="tile tile--flex hub-middle-wide">
        <YourGamesTile />
      </section>
      <section className="tile tile--fixed hub-bottom-left">
        <EchoTile />
      </section>
      <section className="tile tile--fixed hub-bottom-right">
        <SwingCoachTile />
      </section>
    </main>
  );
}
