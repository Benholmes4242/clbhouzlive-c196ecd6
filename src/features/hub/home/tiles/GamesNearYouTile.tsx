/**
 * Games Near You Tile
 * Shows nearby games to join
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TileHeader } from '../parts/TileHeader';
import { InlineFilters, GamesFilters } from '../parts/InlineFilters';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { formatDistanceToNow } from 'date-fns';

interface GamesNearYouTileProps {
  className?: string;
  limit?: number;
  viewAllTo: string;
  enableFilters?: boolean;
}

export function GamesNearYouTile({ 
  className, 
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
    <section className={className}>
      <TileHeader 
        title="Games Near You" 
        subtitle="Find a game to join" 
        viewAllTo={viewAllTo}
      />
      {enableFilters && <InlineFilters value={filters} onChange={setFilters} />}

      <div className="list" style={{ marginTop: 10 }}>
        {isLoading && Array.from({ length: limit }).map((_, i) => (
          <div className="skel" key={i} />
        ))}
        {!isLoading && games.map(g => {
          const availableSlots = g.slots_open || 0;
          return (
            <button 
              key={g.id} 
              className="row text-left w-full p-2 rounded-lg hover:bg-white/03 transition-colors"
              onClick={() => nav(`/game/${g.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{g.course_name}</div>
                <div className="eyebrow text-xs">
                  {g.start_time ? formatDistanceToNow(new Date(g.start_time), { addSuffix: true }) : 'TBD'}
                </div>
              </div>
              <div className="chip text-xs whitespace-nowrap" aria-pressed="false">
                {availableSlots} {availableSlots === 1 ? 'spot' : 'spots'}
              </div>
            </button>
          );
        })}
        {!isLoading && games.length === 0 && (
          <div className="eyebrow">
            Be the first to start one — <span className="link" onClick={() => nav('/hub/games')}>Create a Game</span>.
          </div>
        )}
      </div>
    </section>
  );
}
