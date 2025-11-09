import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';

interface EmptyNearbyStateProps {
  onOpenToPlay?: () => void;
}

export function EmptyNearbyState({ onOpenToPlay }: EmptyNearbyStateProps) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="text-2xl font-semibold mb-2 text-white/90">No golfers nearby</div>
      <p className="text-white/60">
        Check back soon to see who's nearby.
      </p>
    </div>
  );
}
