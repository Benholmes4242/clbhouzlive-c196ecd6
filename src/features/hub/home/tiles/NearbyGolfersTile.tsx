import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useNearbyGolfers } from '@/features/nearby/useNearbyGolfers';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { useHub } from '@/features/hub/useHub';
import { formatDistanceHcpClub } from '@/features/golfers/format';
import { Squircle } from '@/components/ui/squircle';

interface NearbyGolfersTileProps {
  limit?: number;
}

export function NearbyGolfersTile({ limit = 20 }: NearbyGolfersTileProps) {
  const nav = useNavigate();
  const { navigateFromHub } = useHub();
  const { currentLocation } = useLocationPermission();
  
  const { data: golfers = [], isLoading } = useNearbyGolfers({
    radiusKm: 0.5,
    onlyOpen: false,
    visibilityMode: 'all',
    limit,
    userLat: currentLocation?.lat,
    userLng: currentLocation?.lng,
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);
  
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
    <Tile title={
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <h3>Nearby Golfers</h3>
        <button
          onClick={(e) => { e.stopPropagation(); navigateFromHub('/hub/golfers'); }}
          className="text-[15px] font-medium transition"
          style={{ background: 'transparent', border: 'none', color: 'var(--hub-text-body)', padding: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
        >
          See all →
        </button>
      </div>
    }>
      <div ref={scrollRef} className="h-full overflow-y-auto ng-scroll" style={{ scrollSnapType: 'y mandatory' }}>
        <div className="ng-tiles">
          {isLoading && <div className="text-white/70 p-3">Loading...</div>}
          {!isLoading && golfers.slice(0, 5).map(g => (
            <button key={g.id} className="ng-row py-[10px]" onClick={() => nav(`/profile/${g.id}`)}>
              <div className="shrink-0">
                <Squircle width={42} height={42}>
                  <img src={g.avatar_url || '/placeholder.svg'} alt={g.display_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </Squircle>
              </div>
              <div className="ng-main">
                <div className="hub-ellipsis-fade ng-name text-white/90 font-semibold">{g.display_name}</div>
                <div className="h-[2px]" />
                <div className="ng-distance text-white/70 hub-ellipsis-fade">
                  {formatDistanceHcpClub(g.distance_km ? g.distance_km * 1000 : undefined, g.handicap, g.home_club)}
                </div>
              </div>
            </button>
          ))}
          {!isLoading && golfers.length === 0 && (
            <div className="flex flex-col items-center text-center mt-8 px-4">
              <h2 className="text-[20px] font-semibold mb-1" style={{ color: 'var(--hub-text)' }}>No golfers in range</h2>
              <p className="text-[14px] leading-[1.5]" style={{ color: 'var(--hub-text-muted)' }}>Try increasing your distance or checking back later.</p>
            </div>
          )}
        </div>
      </div>
    </Tile>
  );
}
