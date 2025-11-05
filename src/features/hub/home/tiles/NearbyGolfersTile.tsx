/**
 * Nearby Golfers Tile
 * Compact tile showing golfers open to play
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { useHub } from '../../useHub';

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
      footer={
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
            onClick={() => navigateFromHub('/hub/golfers')}
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
      }
    >
      <div className="flex flex-col h-full">
        <div className="space-y-2">
          {isLoading && Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
            <div key={i} className="h-12 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
          ))}
          {!isLoading && golfers.slice(0, 3).map(g => (
            <button 
              key={g.id} 
              className="flex items-center gap-3 w-full p-2 rounded-2xl transition-colors text-left"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-glass-bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => nav(`/profile/${g.username}`)}
            >
              <img 
                src={g.avatar_url || '/placeholder.svg'} 
                alt="" 
                className="w-10 h-10 rounded-full object-cover shrink-0"
                style={{ border: '1px solid var(--hub-stroke-avatar)' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium truncate" style={{ color: 'var(--hub-text)' }}>
                  {g.display_name || g.username}
                </div>
                <div className="text-[12px] truncate" style={{ color: 'var(--hub-text-sub)' }}>
                  {g.distanceText}
                </div>
              </div>
              <span className="text-lg" style={{ color: 'var(--hub-text-dimmer)' }}>›</span>
            </button>
          ))}
          {!isLoading && golfers.length === 0 && (
            <div className="text-[13px] py-2" style={{ color: 'var(--hub-text-sub)' }}>
              No active golfers nearby
            </div>
          )}
        </div>
      </div>
    </Tile>
  );
}
