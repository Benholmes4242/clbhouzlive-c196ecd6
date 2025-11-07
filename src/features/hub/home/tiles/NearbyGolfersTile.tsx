/**
 * Nearby Golfers Tile
 * Compact tile showing golfers open to play
 */

import React, { useRef, useLayoutEffect } from 'react';
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

  const vpRef = useRef<HTMLDivElement>(null);
  const firstRowRef = useRef<HTMLButtonElement>(null);
  const hasMoreThanTwo = golfers.length > 2;
  
  const sortedGolfers = [...golfers].sort((a, b) => {
    const da = a.distance_km ?? Number.POSITIVE_INFINITY;
    const db = b.distance_km ?? Number.POSITIVE_INFINITY;
    return da - db;
  });

  // Dynamically measure and set 2.1-row height (clamped to prevent wrap inflation)
  useLayoutEffect(() => {
    if (!vpRef.current || !firstRowRef.current || !hasMoreThanTwo) return;

    const calc = () => {
      if (!vpRef.current || !firstRowRef.current) return;
      const measured = firstRowRef.current.getBoundingClientRect().height || 56;
      const rowH = Math.min(56, Math.round(measured)); // clamp to 56px
      const gap = 8; // controlled by space-y-2
      const target = (rowH * 2.1) + gap;
      vpRef.current.style.height = `${Math.round(target)}px`;
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(firstRowRef.current);
    window.addEventListener('resize', calc);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', calc);
    };
  }, [hasMoreThanTwo, golfers.length]);

  return (
    <Tile 
      title="Nearby Golfers"
      align="center"
      footer={
        <>
          <div 
            className="NearbyDivider mt-1 h-px w-full"
            style={{
              background: 'rgba(255,255,255,0.18)',
            }}
          />
          <div className="NearbyFooter mt-1">
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                navigateFromHub('/hub/golfers'); 
              }}
              className="ml-auto block text-[15px] font-medium transition"
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
        .mask-fade-right {
          -webkit-mask-image: linear-gradient(to right, black 75%, transparent 100%);
          mask-image: linear-gradient(to right, black 75%, transparent 100%);
        }
      `}</style>
      
      <div 
        ref={vpRef}
        className="nearby-golfers-scroll overflow-y-auto pb-0 mb-0"
        style={{
          height: 'auto',
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
            {sortedGolfers.map((g, i) => (
              <button 
                key={g.id} 
                ref={i === 0 ? firstRowRef : undefined}
                className="h-14 w-full flex items-center overflow-hidden text-left"
                onClick={() => nav(`/profile/${g.username}`)}
              >
                <img 
                  src={g.avatar_url || '/placeholder.svg'} 
                  alt="" 
                  className="h-10 w-10 block rounded-full object-cover flex-shrink-0"
                />
                <div className="ml-3 min-w-0 w-full">
                  <p className="mask-fade-right whitespace-nowrap overflow-hidden text-[13px] font-medium" style={{ color: 'var(--hub-text)' }}>
                    {g.display_name || g.username}
                  </p>
                  <p className="mask-fade-right whitespace-nowrap overflow-hidden text-[12px]" style={{ color: 'var(--hub-text-dim)' }}>
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
