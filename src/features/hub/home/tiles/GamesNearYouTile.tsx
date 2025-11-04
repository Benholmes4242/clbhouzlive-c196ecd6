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
  const openSheet = useOpenSheet();
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
      onViewAll={() => openSheet('games')}
      footer={enableFilters ? <InlineFilters value={filters} onChange={setFilters} /> : undefined}
    >
      <div className="space-y-2">
        {isLoading && Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
        ))}
        {!isLoading && games.map(g => {
          const availableSlots = g.slots_open || 0;
          return (
            <button 
              key={g.id} 
              className="flex items-center gap-3 w-full py-2 rounded-xl transition-colors text-left"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-glass-bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => nav(`/game/${g.id}`)}
            >
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <span role="img" aria-label="golf">⛳</span>
                <div className="min-w-0">
                  <div className="text-[16px] truncate" style={{ color: 'var(--hub-text-bright)' }} title={g.course_name}>
                    {g.course_name || 'Golf Course'}
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--hub-text-sub)' }}>
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
          <p className="text-[15px]" style={{ color: 'var(--hub-text-sub)' }}>
            Be the first!{' '}
            <button 
              onClick={() => openSheet('create-game')}
              className="underline-offset-2 hover:underline"
              style={{ color: 'var(--hub-accent-orange)' }}
            >
              Create a Game
            </button>
          </p>
        )}
      </div>
    </Tile>
  );
}
