/**
 * Nearby Golfers Tile
 * Compact tile showing golfers open to play
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { ViewAllPill } from '../components/ViewAllPill';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';

interface NearbyGolfersTileProps {
  limit?: number;
  viewAllTo: string;
}

export function NearbyGolfersTile({ limit = 5, viewAllTo }: NearbyGolfersTileProps) {
  const nav = useNavigate();
  const { golfers, isLoading } = useActiveGolfers({ limit });

  return (
    <Tile 
      title="Nearby Golfers" 
      subtitle="Open to Play" 
      variant="compact"
      right={<ViewAllPill onClick={() => nav(viewAllTo)} />}
    >
      <div className="space-y-2">
        {isLoading && Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
          <div key={i} className="h-12 rounded-2xl bg-white/04 animate-pulse" />
        ))}
        {!isLoading && golfers.slice(0, 3).map(g => (
          <button 
            key={g.id} 
            className="flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-white/06 transition-colors text-left"
            onClick={() => nav(`/profile/${g.username}`)}
          >
            <img 
              src={g.avatar_url || '/placeholder.svg'} 
              alt="" 
              className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-white text-[15px] font-medium truncate">
                {g.display_name || g.username}
              </div>
              <div className="text-[12px] text-white/60 truncate">
                {g.distanceText ?? 'Open to Play'}
              </div>
            </div>
            <span className="text-white/40 text-lg">›</span>
          </button>
        ))}
        {!isLoading && golfers.length === 0 && (
          <div className="text-[13px] text-white/60 py-2">No active golfers nearby</div>
        )}
      </div>
    </Tile>
  );
}
