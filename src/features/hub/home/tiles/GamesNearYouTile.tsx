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
  const openSheet = useOpenSheet();
  const { data: allGames = [], isLoading } = useGamesQuery();
  
  const games = allGames.slice(0, limit);
  
  // Adaptive subtitle and action
  const subtitle = games.length === 0 ? 'No active games nearby' : 'Find a game to join';
  const actionLabel = games.length === 0 ? 'Create a Game' : 'View all';
  const onAction = () => {
    if (games.length === 0) {
      nav('/hub?sheet=create-game');
    } else {
      openSheet('games');
    }
  };

  return (
    <Tile 
      title="Games Near You" 
      subtitle={subtitle}
    >
      <div className="flex flex-col h-full" style={{ ['--tile-x' as any]: '16px' }}>
        {/* Game list or empty state */}
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
        </div>

        {/* Bottom region: divider + text CTA */}
        <div className="mt-auto pt-4">
          <div 
            className="h-px"
            style={{
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '1px',
              width: '100%',
            }}
          />
          <button
            onClick={onAction}
            className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium hover:opacity-90 active:opacity-80 transition"
            aria-label={actionLabel}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{actionLabel}</span>
            {games.length === 0 && <span aria-hidden="true">+</span>}
          </button>
        </div>
      </div>
    </Tile>
  );
}
