/**
 * Hub Golfers Page
 * 
 * Full-screen glass page showing nearby golfers.
 * Opens as an overlay above the origin page.
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { NearbyGolferCard } from '@/features/nearby/components/NearbyGolferCard';
import { GolferStatusBar } from '@/features/nearby/components/GolferStatusBar';
import { EmptyNearbyState } from '@/features/nearby/components/EmptyNearbyState';
import { NearbySkeletonRow } from '@/features/nearby/components/NearbySkeletonRow';
import { OpenToPlayButton } from '@/features/nearby/components/OpenToPlayButton';
import { useVisibility } from '@/features/nearby/hooks/useVisibility';
import { PullToRefresh } from '@/components/PullToRefresh';
import '../home/hubTheme.css';

export function HubGolfersPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const queryClient = useQueryClient();
  const { golfers, isLoading } = useActiveGolfers({ limit: 50 });
  const { visibilityMode, setVisibilityMode } = useVisibility();
  const headerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

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

  // Scroll-linked header fade + parallax
  useEffect(() => {
    const el = listRef.current;
    const hdr = headerRef.current;
    if (!el || !hdr) return;
    const onScroll = () => {
      const y = Math.min(el.scrollTop, 60);
      hdr.style.setProperty('--blur', String(6 + y / 6)); // 6→16px
      hdr.style.setProperty('--op', String(Math.min(0.92, 0.6 + y / 120)));
      hdr.style.backdropFilter = `blur(var(--blur,12px))`;
      hdr.style.background = `rgba(20,20,20,var(--op,.6))`;
      hdr.style.transform = `translateY(${Math.min(10, y / 8)}px)`; // tiny parallax
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

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
      {/* Sticky Header */}
      <header 
        ref={headerRef}
        className="sticky z-[60] flex items-center justify-between px-4 h-14 border-b backdrop-blur-xl"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px))',
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'rgba(22,22,23,0.32)',
          transition: 'all 160ms ease-out',
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
      <main className="relative">
        <div ref={listRef} className="overflow-y-auto h-[calc(100vh-3.5rem)] pt-2">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-4 pb-6">
            {/* Status Bar (Segmented Control) */}
            <GolferStatusBar 
              value={visibilityMode}
              onChange={setVisibilityMode}
            />

            {/* Open to Play Button */}
            <div className="px-3">
              <OpenToPlayButton />
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
      </main>
    </div>
  );
}
