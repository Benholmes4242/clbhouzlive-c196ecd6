/**
 * Nearby Golfers Tile
 * Shows golfers nearby who are open to play
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TileHeader } from '../parts/TileHeader';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';

interface NearbyGolfersTileProps {
  className?: string;
  limit?: number;
  viewAllTo: string;
}

export function NearbyGolfersTile({ 
  className, 
  limit = 5, 
  viewAllTo 
}: NearbyGolfersTileProps) {
  const nav = useNavigate();
  const { golfers, isLoading } = useActiveGolfers({ limit });

  return (
    <section className={className}>
      <TileHeader 
        title="Nearby Golfers" 
        subtitle="Open to Play" 
        viewAllTo={viewAllTo}
      />
      <div className="list">
        {isLoading && Array.from({ length: limit }).map((_, i) => (
          <div className="skel" key={i} />
        ))}
        {!isLoading && golfers.map(g => (
          <button 
            key={g.id} 
            className="row text-left w-full p-2 rounded-lg hover:bg-white/03 transition-colors"
            onClick={() => nav(`/profile/${g.username}`)}
          >
            <img 
              src={g.avatar_url || '/placeholder.svg'} 
              alt="" 
              className="w-9 h-9 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {g.display_name || g.username} 
                <span className="eyebrow ml-2">· Open to Play</span>
              </div>
              <div className="eyebrow text-xs truncate">{g.distanceText ?? ''}</div>
            </div>
            <span className="chev">›</span>
          </button>
        ))}
        {!isLoading && golfers.length === 0 && (
          <div className="eyebrow">No active golfers nearby</div>
        )}
      </div>
    </section>
  );
}
