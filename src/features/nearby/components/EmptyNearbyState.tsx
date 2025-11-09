import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';

interface EmptyNearbyStateProps {
  onOpenToPlay?: () => void;
}

export function EmptyNearbyState({ onOpenToPlay }: EmptyNearbyStateProps) {
  return (
    <div className="px-6 py-16 text-center flex flex-col items-center justify-center min-h-[200px]">
      <div className="text-[15px] font-semibold mb-2 text-white/85">All quiet nearby</div>
      <p className="text-[13px] text-white/60">
        No golfers in the area right now — check back soon to see who's nearby.
      </p>
    </div>
  );
}
