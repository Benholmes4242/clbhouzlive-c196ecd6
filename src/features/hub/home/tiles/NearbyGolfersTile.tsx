/**
 * Nearby Golfers Tile
 * Compact tile showing golfers open to play
 */

import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { useHub } from '@/features/hub/useHub';
import { formatDistanceHcp } from '@/features/golfers/format';
import SquircleImage from '@/components/ui/SquircleImage';

// Mock data toggle
const useMockData = false;

const mockGolfers = [
  {
    id: 'mock-1',
    username: 'tiger_woods',
    display_name: 'Tiger Woods',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tiger',
    home_club: 'Augusta National',
    distance_km: 0.8,
    eg_handicap_index: 2.1,
    is_online: true,
  },
  {
    id: 'mock-2',
    username: 'rory_mcilroy',
    display_name: 'Rory McIlroy',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rory',
    home_club: 'Royal County Down',
    distance_km: 1.2,
    eg_handicap_index: 1.8,
    is_online: true,
  },
  {
    id: 'mock-3',
    username: 'phil_mickelson',
    display_name: 'Phil Mickelson',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Phil',
    home_club: 'Torrey Pines',
    distance_km: 2.5,
    eg_handicap_index: 3.2,
    is_online: true,
  },
  {
    id: 'mock-4',
    username: 'jordan_spieth',
    display_name: 'Jordan Spieth',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    home_club: 'Dallas National',
    distance_km: 3.1,
    eg_handicap_index: 2.5,
    is_online: true,
  },
  {
    id: 'mock-5',
    username: 'brooks_koepka',
    display_name: 'Brooks Koepka',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Brooks',
    home_club: 'Jupiter Hills',
    distance_km: 4.2,
    eg_handicap_index: 1.9,
    is_online: true,
  },
];

interface NearbyGolfersTileProps {
  limit?: number;
}

export function NearbyGolfersTile({ limit = 999 }: NearbyGolfersTileProps) {
  const nav = useNavigate();
  const { navigateFromHub } = useHub();
  
  const lightTap = () => {
    try {
      (window.navigator as any)?.vibrate?.(5);
    } catch {}
  };
  
  // Real data fetch - wrapped in guard
  const realData = useActiveGolfers({ limit });
  
  // Use mock or real data
  const golfers = useMockData ? mockGolfers : realData.golfers;
  const isLoading = useMockData ? false : realData.isLoading;
  
  // Calculate open to play count
  const openCount = golfers.filter(g => 'isOpenToPlay' in g && g.isOpenToPlay).length;
  
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
      footer={
        <button 
          className="row link hub-tile-pressable" 
          onClick={() => {
            lightTap();
            navigateFromHub('/hub/golfers');
          }}
          aria-label="View all nearby golfers"
        >
          View all <span className="chev">›</span>
        </button>
      }
    >
      {/* Peek bar - Avatar preview */}
      <div className="mt-1 flex items-center gap-2 mb-2">
        <div className="flex -space-x-2">
          {golfers.slice(0, 4).map((g) => (
            <div
              key={g.id}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/70 bg-black/40 overflow-hidden"
            >
              {g.profile_photo_url ? (
                <img 
                  src={g.profile_photo_url} 
                  alt={g.display_name || 'Golfer'} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <span className="text-[11px] font-semibold text-white/80">
                  {(g.display_name || 'U').substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          ))}
          {golfers.length > 4 && (
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/70 bg-white/10 text-[10px] font-medium text-[color:var(--hub-text-muted)]">
              +{golfers.length - 4}
            </div>
          )}
        </div>

        <p className="ml-1 flex-1 truncate text-[12px] text-[color:var(--hub-text-muted)]">
          {golfers.length === 0
            ? 'No one nearby just yet.'
            : `${golfers.length} golfer${golfers.length === 1 ? '' : 's'} nearby • ${openCount} open to play`}
        </p>
      </div>
      
      <div className="flex flex-col h-full" style={{ position: 'relative' }}>
          <div 
          ref={scrollRef} 
          className="space-y-0.5 hub-golfers-list-scroll flex flex-col"
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            maxHeight: 'calc(2.4 * 52px)', // Show 2.4 rows visible
            maskImage: 'linear-gradient(180deg, #000 88%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, #000 88%, transparent 100%)',
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
              aria-label={`${g.display_name || g.username}, ${formatDistanceHcp(g.distance_km ? g.distance_km * 1000 : undefined, g.eg_handicap_index)}`}
            >
              <div className="shrink-0">
                <SquircleImage
                  size={38}
                  src={g.avatar_url || '/placeholder.svg'}
                  alt={`${g.display_name || g.username} profile photo`}
                  ringColor="rgba(255,255,255,0.28)"
                  ringWidth={1}
                />
              </div>
              <div className="ng-main">
                <div className="hub-ellipsis-fade ng-name text-white/90 font-semibold" title={g.display_name || g.username}>
                  {g.display_name || g.username}
                </div>
                <div className="h-[2px]" />
                <div className="ng-distance text-white/70">
                  {formatDistanceHcp(g.distance_km ? g.distance_km * 1000 : undefined, g.eg_handicap_index)}
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
