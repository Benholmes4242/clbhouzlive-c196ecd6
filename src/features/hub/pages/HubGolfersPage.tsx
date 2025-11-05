/**
 * Hub Golfers Page
 * 
 * Full-screen Golfers page with glass background, rendered over origin page.
 */

import React, { useEffect } from 'react';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { GolferRow } from '@/features/nearby/components/GolferRow';
import { VisibilitySegmentedControl } from '@/features/nearby/components/VisibilitySegmentedControl';
import { OpenToPlayButton } from '@/features/nearby/components/OpenToPlayButton';
import { useVisibility } from '@/features/nearby/hooks/useVisibility';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HubPageHeader } from '../components/HubPageHeader';
import { Z } from '@/config/zIndex';
import '../home/hubTheme.css';

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
    <>
      {/* Glass background */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(120px)',
          WebkitBackdropFilter: 'blur(120px)',
          zIndex: Z.hub,
        }}
      />

      {/* Content */}
      <div
        className="fixed inset-0 flex flex-col"
        style={{
          zIndex: Z.hub,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <HubPageHeader title="Golfers" />

        <div className="flex-1 overflow-y-auto px-5 pt-4">
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
                <div className="text-[15px] font-medium" style={{ color: 'var(--hub-text)' }}>
                  Loading active golfers…
                </div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--hub-text-muted)' }}>
                  Checking who's nearby
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {golfers.map((golfer, index) => (
                  <GolferRow key={golfer.id ?? index} golfer={golfer} index={index} />
                ))}
                
                {golfers.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="text-[13px]" style={{ color: 'var(--hub-text-muted)' }}>
                      No other active golfers nearby
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
