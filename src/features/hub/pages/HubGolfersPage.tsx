/**
 * Hub Golfers Page
 * 
 * Full-screen glass page showing nearby golfers with filters.
 * Opens as an overlay above the origin page.
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveGolfers, type GolferFilters } from '@/hooks/useActiveGolfers';
import { NearbyGolferCard } from '@/features/nearby/components/NearbyGolferCard';
import { GolferStatusBar } from '@/features/nearby/components/GolferStatusBar';
import { EmptyNearbyState } from '@/features/nearby/components/EmptyNearbyState';
import { NearbySkeletonRow } from '@/features/nearby/components/NearbySkeletonRow';
import { OpenToPlayButton } from '@/features/nearby/components/OpenToPlayButton';
import { NearbyFilterBar } from '@/features/nearby/components/NearbyFilterBar';
import { useVisibility } from '@/features/nearby/hooks/useVisibility';
import { PullToRefresh } from '@/components/PullToRefresh';
import '../home/hubTheme.css';

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
    isOpenToPlay: true,
    sameHomeClub: false,
    is_following: false,
    handicap: 2.1,
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
    isOpenToPlay: true,
    sameHomeClub: true,
    is_following: true,
    handicap: 1.8,
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
    isOpenToPlay: false,
    sameHomeClub: false,
    is_following: false,
    handicap: 3.2,
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
    isOpenToPlay: true,
    sameHomeClub: false,
    is_following: false,
    handicap: 2.5,
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
    isOpenToPlay: false,
    sameHomeClub: false,
    is_following: true,
    handicap: 1.9,
  },
  {
    id: 'mock-6',
    username: 'dustin_johnson',
    display_name: 'Dustin Johnson',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dustin',
    home_club: 'The Bears Club',
    distance_km: 5.0,
    eg_handicap_index: 2.0,
    is_online: true,
    isOpenToPlay: true,
    sameHomeClub: false,
    is_following: false,
    handicap: 2.0,
  },
];

export function HubGolfersPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const queryClient = useQueryClient();
  const { visibilityMode, setVisibilityMode } = useVisibility();
  const headerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Filter state
  const [filters, setFilters] = useState<GolferFilters>({
    radiusKm: 0.5,
    onlyOpen: false,
    visibility: 'all',
  });

  // Real data fetch - wrapped in guard
  const realData = useActiveGolfers({ limit: 50, filters });
  
  // Use mock or real data
  const golfers = useMockData ? mockGolfers : realData.golfers;
  const isLoading = useMockData ? false : realData.isLoading;

  const handleBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      // Return to Hub overlay
      nav(-1);
    } else {
      // Deep link fallback
      nav('/clubhouse', { replace: true });
    }
  };

  // Refetch on foreground/focus
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['activeGolfers'] });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [queryClient]);


  const handleRefresh = () => {
    return queryClient.invalidateQueries({ queryKey: ['activeGolfers'] });
  };

  return (
    <>
      {/* Environment Layer - Same as Hub */}
      <div
        className="hub-environment-layer"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 900,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'saturate(0.8)',
          WebkitBackdropFilter: 'saturate(0.8)',
          opacity: 1,
          pointerEvents: 'none',
        }}
      >
        {/* Vignette overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.25) 55%, rgba(0, 0, 0, 0.45) 100%)',
          }}
        />
      </div>

      {/* Content Container */}
      <div
        className="golfers-page fixed inset-0"
        style={{
          zIndex: 910,
        }}
      >
        {/* Header - Transparent like Hub */}
        <header 
          ref={headerRef}
          className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 h-14"
          style={{
            zIndex: 10,
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            transition: 'all 160ms ease-out',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <button
            onClick={handleBack}
            className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
            aria-label="Back to Hub"
          >
            ‹ Back
          </button>
          <h1 className="text-white/90 text-[17px] font-semibold">Golfers</h1>
          <div className="w-16" />
        </header>

        {/* Content */}
        <div ref={listRef} className="overflow-y-auto h-screen pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="pb-6" style={{ paddingTop: '28px' }}>
            {/* Visibility segmented control (profile visibility) - PRIMARY */}
            <div className="px-4" style={{ marginBottom: '18px' }}>
              <GolferStatusBar 
                value={visibilityMode}
                onChange={setVisibilityMode}
              />
            </div>

            {/* Open to Play CTA - SECONDARY */}
            <div className="px-4" style={{ marginBottom: '18px' }}>
              <OpenToPlayButton />
            </div>

            {/* Filter Bar - TERTIARY */}
            <div style={{ marginBottom: '28px' }}>
              <NearbyFilterBar 
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* Golfers List */}
            {isLoading ? (
              <NearbySkeletonRow count={5} />
            ) : golfers.length === 0 ? (
              <EmptyNearbyState />
            ) : (
              <div className="space-y-2.5">
                {golfers.map((golfer, index) => (
                  <NearbyGolferCard 
                    key={golfer.id ?? index} 
                    golfer={golfer} 
                    index={index} 
                  />
                ))}
              </div>
            )}
          </div>
        </PullToRefresh>
        </div>
      </div>
    </>
  );
}
