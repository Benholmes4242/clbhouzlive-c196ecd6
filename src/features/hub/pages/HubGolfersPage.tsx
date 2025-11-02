/**
 * Hub Golfers Page
 * 
 * Golfers tab with realtime updates (Phase 3 - Baseline UI).
 */

import React, { useEffect } from 'react';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { GolferRow } from '@/features/nearby/components/GolferRow';
import { VisibilitySegmentedControl } from '@/features/nearby/components/VisibilitySegmentedControl';
import { OpenToPlayButton } from '@/features/nearby/components/OpenToPlayButton';
import { useVisibility } from '@/features/nearby/hooks/useVisibility';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function HubGolfersPage() {
  const { golfers, isLoading } = useActiveGolfers({ limit: 20, mockCount: 0 });
  const { visibilityMode, setVisibilityMode } = useVisibility();

  useEffect(() => {
    // Track Golfers tab view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.golfers_view.event, {
        event_category: analyticsEvents.hub.golfers_view.category,
        event_label: analyticsEvents.hub.golfers_view.label,
      });
    }
  }, []);

  return (
    <div className="space-y-4">
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
  );
}
