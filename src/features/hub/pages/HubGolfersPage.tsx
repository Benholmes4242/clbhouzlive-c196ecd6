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
import { useVisibility } from '@/features/nearby/hooks/useVisibility';
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
    <div className="apple-glass-screen">
      {/* Header */}
      <header className="apple-glass-header">
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

      {/* Main Content */}
      <main className="nearby-golfers-main">
        <section className="apple-glass-panel nearby-golfers-panel">
          {/* Controls Block */}
          <div className="ng-controls">
            {/* Segmented Control - Everyone / Friends / Hidden */}
            <div className="ng-segmented">
              <button 
                className={`ng-segmented__item ${visibilityMode === 'all' ? 'ng-segmented__item--active' : ''}`}
                onClick={() => setVisibilityMode('all')}
              >
                Everyone
              </button>
              <button 
                className={`ng-segmented__item ${visibilityMode === 'friends' ? 'ng-segmented__item--active' : ''}`}
                onClick={() => setVisibilityMode('friends')}
              >
                Friends
              </button>
              <button 
                className={`ng-segmented__item ${visibilityMode === 'hidden' ? 'ng-segmented__item--active' : ''}`}
                onClick={() => setVisibilityMode('hidden')}
              >
                Hidden
              </button>
            </div>

            {/* Visibility Label */}
            <p className="ng-visibility-label">
              {visibilityMode === 'all' && 'Visible to everyone'}
              {visibilityMode === 'friends' && 'Visible to your friends only'}
              {visibilityMode === 'hidden' && 'Hidden from all golfers'}
            </p>

            {/* Open to Play Banner */}
            <div className="ng-otp-banner">
              <span className="ng-otp-emoji">🏌️‍♂️</span>
              <span className="ng-otp-label">Open to Play</span>
            </div>

            {/* Distance Chips */}
            <div className="ng-distance-row">
              <button 
                className={`ng-chip ${filters.radiusKm === 0.5 ? 'ng-chip--active' : ''}`}
                onClick={() => setFilters({ ...filters, radiusKm: 0.5 })}
              >
                500m
              </button>
              <button 
                className={`ng-chip ${filters.radiusKm === 1 ? 'ng-chip--active' : ''}`}
                onClick={() => setFilters({ ...filters, radiusKm: 1 })}
              >
                1km
              </button>
              <button 
                className={`ng-chip ${filters.radiusKm === 3 ? 'ng-chip--active' : ''}`}
                onClick={() => setFilters({ ...filters, radiusKm: 3 })}
              >
                3km
              </button>
            </div>

            {/* Filter Row - Dropdown + Open to Play CTA */}
            <div className="ng-filter-row">
              <button className="ng-filter-select">
                All Golfers
                <span className="ng-filter-chevron">⌄</span>
              </button>
              <button className="ng-primary-btn">
                Open to Play
              </button>
            </div>
          </div>

          {/* Players Block */}
          <div className="ng-player-list">
            {isLoading ? (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </>
            ) : golfers.length === 0 ? (
              <div className="ng-empty-state">
                <p className="ng-empty-title">No golfers nearby</p>
                <p className="ng-empty-subtitle">
                  Check back soon to see who's nearby.
                </p>
              </div>
            ) : (
              <>
                {golfers.map((golfer, index) => (
                  <NearbyGolferCard 
                    key={golfer.id ?? index} 
                    golfer={golfer} 
                    index={index} 
                  />
                ))}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
