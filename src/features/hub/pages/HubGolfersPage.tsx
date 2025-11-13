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
      // Return to previous page
      nav(-1);
    } else {
      // Deep link fallback - return to Hub
      nav('/hub', { replace: true });
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
    <div
      className="golfers-page hub-glass-page fixed inset-0 z-[9999] overflow-hidden"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Opaque Header */}
      <header 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'var(--hub-stroke)',
          background: 'rgba(22, 24, 27, 0.98)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          transition: 'all 160ms ease-out',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          contain: 'paint',
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
      <div ref={listRef} className="h-full overflow-y-auto overscroll-none pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-6 space-y-4">
            {/* A. Availability controls */}
            <div className="space-y-3">
              <GolferStatusBar 
                value={visibilityMode}
                onChange={setVisibilityMode}
              />
              <OpenToPlayButton />
            </div>

            {/* B. Discovery controls */}
            <div className="space-y-3">
              <NearbyFilterBar 
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* Golfers List */}
            {isLoading ? (
              <div className="mt-3">
                <NearbySkeletonRow count={5} />
              </div>
            ) : golfers.length === 0 ? (
              <div className="mt-3">
                <EmptyNearbyState />
              </div>
            ) : (
              <div className="mt-3 space-y-3">
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
  );
}
