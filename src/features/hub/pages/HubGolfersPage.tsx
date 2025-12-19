import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useNearbyGolfers } from '@/features/nearby/useNearbyGolfers';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { NearbyGolferCard } from '@/features/nearby/components/NearbyGolferCard';
import { GolferStatusBar } from '@/features/nearby/components/GolferStatusBar';
import { EmptyNearbyState } from '@/features/nearby/components/EmptyNearbyState';
import { NearbySkeletonRow } from '@/features/nearby/components/NearbySkeletonRow';
import { OpenToPlayButton } from '@/features/nearby/components/OpenToPlayButton';
import { NearbyFilterBar } from '@/features/nearby/components/NearbyFilterBar';
import { useVisibility } from '@/features/nearby/hooks/useVisibility';
import { GolferFilters } from '@/hooks/useActiveGolfers';
import { HubHeader } from '../components/HubHeader';
import '../home/hubThemeLight.css';

export function HubGolfersPage() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const { visibilityMode, setVisibilityMode } = useVisibility();
  const { currentLocation } = useLocationPermission();
  const listRef = React.useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<GolferFilters>({ radiusKm: 0.5, onlyOpen: false, visibility: 'all' });

  const { data: golfers = [], isLoading } = useNearbyGolfers({
    radiusKm: filters.radiusKm || 0.5,
    onlyOpen: filters.onlyOpen || false,
    visibilityMode: filters.visibility === 'friends' ? 'friends' : 'all',
    limit: 999,
    userLat: currentLocation?.lat,
    userLng: currentLocation?.lng,
  });

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: 'var(--hub-backdrop)',
          backdropFilter: `blur(var(--hub-backdrop-blur))`,
          WebkitBackdropFilter: `blur(var(--hub-backdrop-blur))`,
        }} 
      />
      
      {/* Glass Sheet */}
      <div
        className="hub-glass-page fixed inset-0"
        style={{
          background: 'var(--hub-bg-start)',
          border: '1px solid var(--hub-stroke-subtle)',
          boxShadow: 'var(--hub-shadow-main)',
        }}
      >
        <HubHeader title="Golfers" onBack={() => nav(-1)} />
        
        <div ref={listRef} className="overflow-y-auto h-screen pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
          <div className="px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-6 space-y-4">
            <div className="space-y-3">
              <GolferStatusBar value={visibilityMode} onChange={setVisibilityMode} />
              <OpenToPlayButton />
            </div>
            <div className="space-y-3">
              <NearbyFilterBar filters={filters} onFiltersChange={setFilters} />
            </div>
            {isLoading ? (
              <div className="mt-3"><NearbySkeletonRow count={5} /></div>
            ) : golfers.length === 0 ? (
              <div className="mt-3"><EmptyNearbyState variant={visibilityMode === 'hidden' ? 'hidden' : 'default'} /></div>
            ) : (
              <div className="mt-3 space-y-3">
                {golfers.map((golfer, index) => <NearbyGolferCard key={golfer.id ?? index} golfer={golfer} index={index} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
