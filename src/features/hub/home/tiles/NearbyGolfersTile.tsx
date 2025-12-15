import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useNearbyGolfers } from '@/features/nearby/useNearbyGolfers';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { useHub } from '@/features/hub/useHub';
import { formatDistanceHcpClub } from '@/features/golfers/format';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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
        <h3 style={{ color: 'var(--hub-light-text-primary)' }}>Nearby Golfers</h3>
        <button
          onClick={(e) => { e.stopPropagation(); navigateFromHub('/hub/golfers'); }}
          className="hub-light-card-link text-[15px] font-medium transition"
        >
          See all →
        </button>
      </div>
    }>
      <div ref={scrollRef} className="h-full overflow-y-auto ng-scroll" style={{ scrollSnapType: 'y mandatory' }}>
        <div className="ng-tiles">
          {isLoading && <div style={{ color: 'var(--hub-light-text-secondary)', padding: '12px' }}>Loading...</div>}
          {!isLoading && golfers.slice(0, 5).map(g => (
            <button 
              key={g.id} 
              className="ng-row py-[10px]" 
              onClick={() => nav(`/profile/${g.id}`)}
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-light-pill-bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="shrink-0">
                <SquircleAvatar
                  size={42}
                  src={g.avatar_url}
                  alt={g.display_name}
                  fallback={g.display_name?.charAt(0).toUpperCase() || '?'}
                />
              </div>
              <div className="ng-main">
                <div className="hub-ellipsis-fade ng-name font-semibold" style={{ color: 'var(--hub-light-text-primary)' }}>{g.display_name}</div>
                <div className="h-[2px]" />
                <div className="ng-distance hub-ellipsis-fade" style={{ color: 'var(--hub-light-text-secondary)' }}>
                  {formatDistanceHcpClub(g.distance_km ? g.distance_km * 1000 : undefined, g.handicap, g.home_club)}
                </div>
              </div>
            </button>
          ))}
          {!isLoading && golfers.length === 0 && (
            <div className="hub-light-empty flex flex-col items-center text-center mt-8 px-4">
              <h2 className="hub-light-empty-title text-body-lg font-semibold leading-snug mb-1">No golfers in range</h2>
              <p className="hub-light-empty-body text-body-md font-normal leading-relaxed">Try increasing your distance or checking back later.</p>
            </div>
          )}
        </div>
      </div>
    </Tile>
  );
}
