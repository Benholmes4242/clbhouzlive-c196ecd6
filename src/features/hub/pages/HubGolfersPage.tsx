import React, { useEffect, useState } from 'react';
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
import { PullToRefresh } from '@/components/PullToRefresh';
import { GolferFilters } from '@/hooks/useActiveGolfers';
import '../home/hubTheme.css';

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

  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['nearbyGolfers', 'live'] });
  };

  return (
    <div className="hub-page hub-glass-page">
      <header className="hub-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)', paddingBottom: '0.5rem', paddingLeft: '1rem', paddingRight: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-[17px] transition-opacity hover:opacity-70" style={{ color: 'var(--hub-link)' }}>
          <svg width="13" height="21" fill="none"><path d="M11.5 1.5L2 10.5l9.5 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">Golfers</h1>
        <div className="w-16" />
      </header>
      <div ref={listRef} className="h-full overflow-y-auto overscroll-none pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
        <PullToRefresh onRefresh={handleRefresh}>
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
        </PullToRefresh>
      </div>
    </div>
  );
}
