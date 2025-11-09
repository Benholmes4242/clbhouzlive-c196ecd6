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

  const { golfers, isLoading } = useActiveGolfers({ limit: 50, filters });

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
    <div
      className="golfers-page hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Glass Header */}
      <header 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'var(--hub-stroke)',
          background: 'var(--hub-glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
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
  );
}
