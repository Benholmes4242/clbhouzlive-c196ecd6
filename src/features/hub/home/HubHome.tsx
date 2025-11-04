/**
 * Hub Home Dashboard
 * Compact 2×3 control-center grid with no vertical scroll
 */

import React from 'react';
import { EchoTile } from './tiles/EchoTile';
import { SwingTile } from './tiles/SwingTile';
import { NearbyGolfersTile } from './tiles/NearbyGolfersTile';
import { GamesNearYouTile } from './tiles/GamesNearYouTile';
import { YourGamesTile } from './tiles/YourGamesTile';
import { QuickActionsTile } from './tiles/QuickActionsTile';

export default function HubHome() {
  return (
    <main className="hub-grid-compact">
      <NearbyGolfersTile />
      <GamesNearYouTile />
      <YourGamesTile />
      <EchoTile />
      <SwingTile />
      <QuickActionsTile />
    </main>
  );
}
