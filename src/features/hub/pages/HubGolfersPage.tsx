/**
 * Hub Golfers Page
 * 
 * Full-screen glass page showing nearby golfers.
 * Opens as an overlay above the origin page.
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { GolferRow } from '@/features/nearby/components/GolferRow';
import { VisibilitySegmentedControl } from '@/features/nearby/components/VisibilitySegmentedControl';
import { OpenToPlayButton } from '@/features/nearby/components/OpenToPlayButton';
import { useVisibility } from '@/features/nearby/hooks/useVisibility';
import { PullToRefresh } from '@/components/PullToRefresh';
import { GlassPanel } from '../components/GlassPanel';
import '../home/hubTheme.css';

export function HubGolfersPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { golfers, isLoading } = useActiveGolfers({ limit: 50 });
  const { visibilityMode, setVisibilityMode } = useVisibility();
  
  // Read initial scope from URL parameter
  useEffect(() => {
    const scopeParam = searchParams.get('scope');
    if (scopeParam) {
      // Map URL param to VisibilityMode
      const modeMap: Record<string, 'all' | 'friends' | 'hidden'> = {
        'everyone': 'all',
        'friends': 'friends',
        'hidden': 'hidden',
      };
      const mappedMode = modeMap[scopeParam];
      if (mappedMode) {
        setVisibilityMode(mappedMode);
      }
    }
  }, [searchParams, setVisibilityMode]);

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
      className="min-h-[100dvh]"
      style={{ background: '#0a0a0a' }}
    >
      <div className="mx-auto max-w-[720px] px-4 pt-3 pb-20">
        <PullToRefresh onRefresh={handleRefresh}>
          {/* Header */}
          <GlassPanel className="p-4 mb-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-[var(--hub-text-sub)] hover:text-[var(--hub-text)] text-[15px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 rounded-xl px-2 py-1 -ml-2"
                aria-label="Back to Hub"
              >
                ‹ Back
              </button>
              <h1 className="text-[22px] font-semibold">Golfers</h1>
              <div className="w-16" />
            </div>
          </GlassPanel>

          {/* Visibility Control */}
          <VisibilitySegmentedControl 
            value={visibilityMode}
            onChange={setVisibilityMode}
          />

          {/* Open to Play CTA */}
          <OpenToPlayButton />

          {/* Golfers List */}
          {isLoading ? (
            <GlassPanel className="p-3 mt-3">
              <div className="py-10 text-center">
                <div className="text-[15px] font-medium text-[var(--hub-text)]">Loading active golfers…</div>
                <div className="text-[13px] text-[var(--hub-text-dim)] mt-1">Checking who's nearby</div>
              </div>
            </GlassPanel>
          ) : golfers.length === 0 ? (
            <GlassPanel className="p-3 mt-3">
              <div className="py-10 text-center">
                <div className="text-[56px] mb-2" aria-hidden="true">
                  {visibilityMode === 'hidden' ? '🔒' : visibilityMode === 'friends' ? '👥' : '🏌️'}
                </div>
                <div className="text-[15px] text-[var(--hub-text-dim)]">
                  {visibilityMode === 'hidden' 
                    ? "You're hidden. Switch to Everyone or Friends to appear nearby."
                    : visibilityMode === 'friends'
                    ? "No friends nearby. Invite friends to Clbhouz to see them here."
                    : "No other active golfers nearby"}
                </div>
              </div>
            </GlassPanel>
          ) : (
            <GlassPanel className="p-3 mt-3">
              <ul className="divide-y divide-[var(--hub-stroke)]/40">
                {golfers.map((golfer, index) => (
                  <GolferRow key={golfer.id ?? index} golfer={golfer} index={index} />
                ))}
              </ul>
            </GlassPanel>
          )}
        </PullToRefresh>
      </div>
    </div>
  );
}
