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

interface GamesNearYouTileProps {
  limit?: number;
  enableFilters?: boolean;
}

export function GamesNearYouTile({ 
  limit = 3,
  enableFilters 
}: GamesNearYouTileProps) {
  const nav = useNavigate();
  const { data: allGames = [], isLoading } = useGamesQuery();
  
  const games = allGames.slice(0, limit);
  
  const comingSoon = () => {
    alert('Coming soon');
  };

  return (
    <Tile 
      title="Games Near You"
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
          {!isLoading && games.length === 0 && (
            <div className="text-[13px] py-2" style={{ color: 'var(--hub-text-sub)' }}>
              No active games nearby
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={comingSoon}
            className="flex-1 h-10 rounded-2xl px-4 flex items-center justify-center text-[15px] transition focus:outline-none focus-visible:ring-2"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
              color: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            Search games
          </button>
          <button
            onClick={() => nav('/hub/your-games')}
            className="flex-1 h-10 rounded-2xl px-4 flex items-center justify-center text-[15px] transition focus:outline-none focus-visible:ring-2"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
              color: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            Your games
          </button>
        </div>
      </div>
    </Tile>
  );
}
