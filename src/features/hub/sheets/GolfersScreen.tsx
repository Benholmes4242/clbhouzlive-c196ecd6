import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { GolferRow } from '@/features/nearby/components/GolferRow';
import { VisibilitySegmentedControl } from '@/features/nearby/components/VisibilitySegmentedControl';
import { OpenToPlayButton } from '@/features/nearby/components/OpenToPlayButton';
import { useVisibility } from '@/features/nearby/hooks/useVisibility';
import { PullToRefresh } from '@/components/PullToRefresh';

type GolfersScreenProps = {
  onClose: () => void;
};

export function GolfersScreen({ onClose }: GolfersScreenProps) {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const { golfers, isLoading } = useActiveGolfers({ limit: 50, mockCount: 0 });
  const { visibilityMode, setVisibilityMode } = useVisibility();

  // Refetch when the sheet opens
  useEffect(() => {
    if (params.get('sheet') === 'golfers') {
      const t = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['activeGolfers'] });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [params, queryClient]);

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
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-4 pb-6">
        <h2 className="text-xl font-semibold text-white">Nearby Golfers</h2>
        
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
  );
}
