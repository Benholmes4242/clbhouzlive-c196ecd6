/**
 * Games Near You Tile
 * Shows nearby games to join
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InlineFilters, GamesFilters } from '../parts/InlineFilters';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { formatDistanceToNow } from 'date-fns';
import { Tile } from '../components/Tile';
import { TileHeader } from '../components/TileHeader';
import { Chip } from '../components/Chip';

interface GamesNearYouTileProps {
  limit?: number;
  viewAllTo: string;
  enableFilters?: boolean;
}

export function GamesNearYouTile({ 
  limit = 3, 
  viewAllTo,
  enableFilters 
}: GamesNearYouTileProps) {
  const nav = useNavigate();
  const [filters, setFilters] = useState<GamesFilters>({ 
    when: 'today', 
    distance: '10', 
    sort: 'soonest' 
  });
  const { data: allGames = [], isLoading } = useGamesQuery();
  
  // Simple client-side filtering (can be enhanced)
  const games = allGames.slice(0, limit);

  return (
    <Tile className="col-span-2">
      <TileHeader 
        title="Games Near You" 
        subtitle="Find a game to join" 
        onViewAll={() => nav(viewAllTo)}
      />
      {enableFilters && <InlineFilters value={filters} onChange={setFilters} />}

      <div className="space-y-2 mt-2">
        {isLoading && Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white/04 animate-pulse" />
        ))}
        {!isLoading && games.map(g => {
          const availableSlots = g.slots_open || 0;
          return (
            <button 
              key={g.id} 
              className="flex items-center justify-between gap-2.5 w-full p-2.5 rounded-2xl hover:bg-white/06 transition-colors text-left"
              onClick={() => nav(`/game/${g.id}`)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-medium text-white truncate" title={g.course_name}>
                    🏌️‍♂️ {g.course_name || 'Golf Course'}
                  </span>
                </div>
                <div className="text-[12px] text-white/60">
                  {g.start_time ? formatDistanceToNow(new Date(g.start_time), { addSuffix: true }) : 'TBD'}
                </div>
              </div>
              <Chip className="shrink-0">
                {availableSlots} {availableSlots === 1 ? 'spot' : 'spots'}
              </Chip>
            </button>
          );
        })}
        {!isLoading && games.length === 0 && (
          <div className="text-[13px] text-white/60 py-2">
            Be the first!{' '}
            <button 
              onClick={() => nav('/hub/create-game')}
              className="text-[#FF8C32] hover:underline"
            >
              Create a Game
            </button>
          </div>
        )}
      </div>
    </Tile>
  );
}
