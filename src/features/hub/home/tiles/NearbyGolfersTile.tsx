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

  // Design tokens for 2.1 row peek
  const ROW = 56;   // row height in px
  const GAP = 8;    // vertical gap between rows in px
  const peekHeightPx = 126; // 2.1*56 + 8 = 126
  const hasMoreThanTwo = golfers.length > 2;
  
  const sortedGolfers = [...golfers].sort((a, b) => {
    const da = a.distance_km ?? Number.POSITIVE_INFINITY;
    const db = b.distance_km ?? Number.POSITIVE_INFINITY;
    return da - db;
  });

  return (
    <Tile 
      title="Nearby Golfers"
      align="center"
      footer={
        <>
          <div 
            className="NearbyDivider mt-2 h-px w-full"
            style={{
              background: 'rgba(255,255,255,0.18)',
            }}
          />
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              navigateFromHub('/hub/golfers'); 
            }}
            className="NearbyFooter ml-auto mt-2 block text-[15px] font-medium transition"
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
        </>
      }
    >
      <style>{`
        .nearby-golfers-scroll::-webkit-scrollbar { 
          display: none; 
        }
        .nearby-golfers-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .nearby-golfers-scroll > *:last-child {
          margin-bottom: 0 !important;
        }
        .nearby-golfers-scroll img {
          display: block;
        }
      `}</style>
      
      <div 
        className="nearby-golfers-scroll overflow-y-auto pb-0 mb-0"
        style={{
          height: hasMoreThanTwo ? `${peekHeightPx}px` : 'auto',
          maskImage: hasMoreThanTwo ? 'linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)' : 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {isLoading && (
          <div className="flex flex-col space-y-2 pb-0 mb-0">
            {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
              <div 
                key={i} 
                className="h-14 rounded-2xl animate-pulse" 
                style={{ background: 'var(--hub-glass-bg-subtle)' }} 
              />
            ))}
          </div>
        )}
        
        {!isLoading && sortedGolfers.length > 0 && (
          <div className="flex flex-col space-y-2 pb-0 mb-0">
            {sortedGolfers.map(g => (
              <button 
                key={g.id} 
                className="h-14 flex items-center w-full text-left"
                onClick={() => nav(`/profile/${g.username}`)}
              >
                <img 
                  src={g.avatar_url || '/placeholder.svg'} 
                  alt="" 
                  className="h-10 w-10 block rounded-full object-cover flex-shrink-0"
                />
                <div className="ml-3 min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium" style={{ color: 'var(--hub-text)' }}>
                    {g.display_name || g.username}
                  </p>
                  <p className="truncate text-[12px]" style={{ color: 'var(--hub-text-dim)' }}>
                    {g.distanceText}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {!isLoading && golfers.length === 0 && (
          <div className="text-[13px] py-2" style={{ color: 'var(--hub-text-mute)' }}>
            No active golfers nearby
          </div>
        )}
      </div>
    </Tile>
  );
}
