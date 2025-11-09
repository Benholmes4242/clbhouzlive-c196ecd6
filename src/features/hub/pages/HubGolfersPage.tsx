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
    visibility: 'everyone',
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
        className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 border-b"
        style={{
          height: '56px',
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
        <h1 className="text-white/90 text-[28px] font-semibold">Golfers</h1>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div ref={listRef} className="overflow-y-auto h-screen pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="pb-6 pt-4 px-4">
            {/* Visibility segmented control (profile visibility) - 16px top margin */}
            <div className="mb-2">
              <GolferStatusBar 
                value={visibilityMode}
                onChange={setVisibilityMode}
              />
            </div>

            {/* Visibility status text - 8px gap from segmented */}
            <p className="text-[13px] text-white/60 mb-6">
              {visibilityMode === 'all' ? 'You\'re visible to everyone nearby' : 
               visibilityMode === 'friends' ? 'You\'re visible to friends only' : 
               'You\'re hidden from nearby golfers'}
            </p>

            {/* Open to Play CTA - 24px gap from status text */}
            <div className="mb-8">
              <OpenToPlayButton />
            </div>

            {/* Filter Bar - 32px gap from button/helper */}
            <div className="mb-10 opacity-0 animate-in fade-in duration-200">
              <NearbyFilterBar 
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* Golfers List - 40px gap from filters */}
            <div className="opacity-0 animate-in fade-in duration-300 delay-100">
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
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}
