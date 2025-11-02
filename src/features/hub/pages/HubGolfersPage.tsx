/**
 * Hub Golfers Page
 * 
 * Wrapper for existing Golfers tab content.
 * Maintains baseline UI from Phase 1 audit.
 */

import React from 'react';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { GolferRow } from '@/features/nearby/components/GolferRow';
import { VisibilitySegmentedControl } from '@/features/nearby/components/VisibilitySegmentedControl';
import { OpenToPlayButton } from '@/features/nearby/components/OpenToPlayButton';
import { useVisibility } from '@/features/nearby/hooks/useVisibility';

export function HubGolfersPage() {
  const { golfers, isLoading } = useActiveGolfers({ limit: 20, mockCount: 0 });
  const { visibilityMode, setVisibilityMode } = useVisibility();

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
