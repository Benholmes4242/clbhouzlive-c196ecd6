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
import { GolferRow } from '@/features/nearby/components/GolferRow';
import { VisibilitySegmentedControl } from '@/features/nearby/components/VisibilitySegmentedControl';
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
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Simple Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
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
      <div className="overflow-y-auto h-[calc(100vh-3.5rem)] px-4 pt-4">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-4 pb-6">
            {/* Visibility Control */}
            <div className="w-full">
              <VisibilitySegmentedControl 
                value={visibilityMode}
                onChange={setVisibilityMode}
              />
            </div>

            {/* Open to Play Button */}
            <OpenToPlayButton />

            {/* Golfers List */}
            {isLoading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center min-h-[240px]">
                <div className="text-[15px] font-medium text-white/90">Loading active golfers…</div>
                <div className="text-[13px] text-white/60 mt-1">Checking who's nearby</div>
              </div>
            ) : (
              <div className="space-y-2">
                {golfers.map((golfer, index) => (
                  <GolferRow key={golfer.id ?? index} golfer={golfer} index={index} />
                ))}
                
                {golfers.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="text-[13px] text-white/60">No other active golfers nearby</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}
