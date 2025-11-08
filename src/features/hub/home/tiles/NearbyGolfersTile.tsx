/**
 * Nearby Golfers Tile
 * Compact tile showing golfers open to play
 */

import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { useHub } from '@/features/hub/useHub';
import { formatHcp } from '@/lib/formatHcp';

interface NearbyGolfersTileProps {
  limit?: number;
}

export function NearbyGolfersTile({ limit = 999 }: NearbyGolfersTileProps) {
  const nav = useNavigate();
  const { navigateFromHub } = useHub();
  const { golfers, isLoading } = useActiveGolfers({ limit });
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, []);
  // Reset scroll to top when data loads to ensure first profile is visible
  useEffect(() => {
    if (!isLoading && scrollRef.current) {
      const el = scrollRef.current;
      el.classList.add('no-snap');
      requestAnimationFrame(() => {
        el.scrollTop = 0;
        requestAnimationFrame(() => {
          el.scrollTop = 0;
          el.classList.remove('no-snap');
        });
      });
    }
  }, [isLoading, golfers.length]);

  return (
    <Tile 
      title="Nearby Golfers"
      align="center"
    >
      <div className="flex flex-col h-full" style={{ position: 'relative' }}>
          <div 
          ref={scrollRef} 
          className="space-y-0.5 hub-golfers-list-scroll flex flex-col"
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            maxHeight: 'calc(2.4 * 52px)', // Show 2.4 rows visible
            maskImage: 'linear-gradient(180deg, transparent 0%, #000 8%, #000 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 8%, #000 92%, transparent 100%)',
          }}
        >
          {isLoading && Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
            <div key={i} className="h-12 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
          ))}
          {!isLoading && [...golfers].sort((a, b) => {
            const da = a.distance_km ?? Number.POSITIVE_INFINITY;
            const db = b.distance_km ?? Number.POSITIVE_INFINITY;
            return da - db;
          }).map(g => (
            <button 
              key={g.id} 
              className="ng-row py-[10px]"
              onClick={() => nav(`/profile/${g.username}`)}
              aria-label={`${g.display_name || g.username}, handicap ${formatHcp(g.eg_handicap_index)}, ${g.distanceText} away`}
            >
              <div className="shrink-0 rounded-full overflow-hidden w-[38px] h-[38px]">
                <img 
                  src={g.avatar_url || '/placeholder.svg'} 
                  alt={`${g.display_name || g.username} profile photo`}
                  className="w-full h-full object-cover rounded-full"
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,.15)' }}
                />
              </div>
              <div className="ng-main">
                <div className="hub-ellipsis-fade ng-name text-white/90 font-semibold" title={g.display_name || g.username}>
                  {g.display_name || g.username}
                </div>
                <div className="h-[2px]" />
                <div className="ng-distance text-white/70">
                  {g.distanceText} · HCP {formatHcp(g.eg_handicap_index)}
                </div>
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
          className="text-[15px] font-medium transition"
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
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
