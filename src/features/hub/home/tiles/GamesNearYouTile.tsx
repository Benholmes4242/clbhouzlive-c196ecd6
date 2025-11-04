/**
 * Games Near You Tile
 * Content tile showing nearby games to join
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { formatDistanceToNow } from 'date-fns';
import { Tile } from '../components/Tile';
import { Chip } from '../components/Chip';
import { useOpenSheet } from '@/features/hub/sheets/useOpenSheet';

interface GamesNearYouTileProps {
  limit?: number;
  enableFilters?: boolean;
}

export function GamesNearYouTile({ 
  limit = 3,
  enableFilters 
}: GamesNearYouTileProps) {
  const nav = useNavigate();

  return (
    <Tile 
      title="Games Near You"
      className="flex flex-col h-full"
    >
      {/* body */}
      <div className="grow px-4 sm:px-5 pt-1">
        <p className="text-[15px] text-white/70">No active games nearby</p>
      </div>

      {/* divider (match Echo) */}
      <div className="px-4 sm:px-5">
        <div className="h-px rounded bg-white/20" />
      </div>

      {/* footer link, bottom-right (text only) */}
      <button
        onClick={() => nav('/hub?sheet=create-game')}
        className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium hover:opacity-90 focus:outline-none"
        aria-label="Create a Game"
      >
        Create a Game
      </button>
    </Tile>
  );
}
