/**
 * Nearby Golfers Tile
 * Compact tile showing golfers open to play
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { useHub } from '@/features/hub/useHub';

interface NearbyGolfersTileProps {
  limit?: number;
}

export function NearbyGolfersTile({ limit = 5 }: NearbyGolfersTileProps) {
  const nav = useNavigate();
  const { navigateFromHub } = useHub();
  const { golfers, isLoading } = useActiveGolfers({ limit });

  return (
    <Tile 
      title="Nearby Golfers"
      align="center"
    >
      <div className="flex flex-col h-full">
        <div className="space-y-0.5 hub-golfers-list-scroll flex flex-col justify-center">
          {isLoading && Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
            <div key={i} className="h-12 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
          ))}
          {!isLoading && [...golfers].sort((a, b) => {
            const da = a.distance_km ?? Number.POSITIVE_INFINITY;
            const db = b.distance_km ?? Number.POSITIVE_INFINITY;
            return da - db;
          }).slice(0, 3).map(g => (
            <button 
              key={g.id} 
              className="ng-row"
              onClick={() => nav(`/profile/${g.username}`)}
            >
              <img 
                src={g.avatar_url || '/placeholder.svg'} 
                alt="" 
                className="ng-avatar"
              />
              <div className="ng-main">
                <div className="hub-ellipsis-fade ng-name" title={g.display_name || g.username}>
                  {g.display_name || g.username}
                </div>
                <div className="ng-distance">{g.distanceText}</div>
              </div>
            </button>
          ))}
          {!isLoading && golfers.length === 0 && (
            <div className="text-[13px] py-2 text-center" style={{ color: 'var(--hub-text-sub)' }}>
              No active golfers nearby
            </div>
          )}
        </div>
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            navigateFromHub('/hub/golfers'); 
          }}
          className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium transition"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--hub-text-body)',
            padding: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
          aria-label="View all golfers"
        >
          View all →
        </button>
      </div>
    </Tile>
  );
}
