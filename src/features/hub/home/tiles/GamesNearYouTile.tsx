/**
 * Games Near You Tile
 * Content tile showing nearby games to join
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InlineFilters, GamesFilters } from '../parts/InlineFilters';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { formatDistanceToNow } from 'date-fns';
import { Tile } from '../components/Tile';
import { ViewAllPill } from '../components/ViewAllPill';
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
  
  const games = allGames.slice(0, limit);

  return (
    <Tile 
      title="Games Near You" 
      subtitle="Find a game to join" 
      variant="content"
      right={<ViewAllPill onClick={() => nav(viewAllTo)} />}
    >
      {enableFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          <InlineFilters value={filters} onChange={setFilters} />
        </div>
      )}

      <div className="space-y-2">
        {isLoading && Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white/04 animate-pulse" />
        ))}
        {!isLoading && games.map(g => {
          const availableSlots = g.slots_open || 0;
          return (
            <button 
              key={g.id} 
              className="flex items-center gap-3 w-full py-2 hover:bg-white/06 rounded-xl transition-colors text-left"
              onClick={() => nav(`/game/${g.id}`)}
            >
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <span role="img" aria-label="golf">⛳</span>
                <div className="min-w-0">
                  <div className="text-[16px] text-white/95 truncate" title={g.course_name}>
                    {g.course_name || 'Golf Course'}
                  </div>
                  <div className="text-[12px] text-white/60">
                    {g.start_time ? formatDistanceToNow(new Date(g.start_time), { addSuffix: true }) : 'TBD'}
                  </div>
                </div>
              </div>
              <Chip className="shrink-0">
                {availableSlots} {availableSlots === 1 ? 'spot' : 'spots'}
              </Chip>
            </button>
          );
        })}
        {!isLoading && games.length === 0 && (
          <p className="text-[15px] text-white/70">
            Be the first!{' '}
            <button 
              onClick={() => nav('/hub/create-game')}
              className="text-[#ff8e2b] underline-offset-2 hover:underline"
            >
              Create a Game
            </button>
          </p>
        )}
      </div>
    </Tile>
  );
}
