import React, { useState, useEffect, useMemo } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import ShortCard from './ShortCard';
import { useVisibilityRatio } from '@/hooks/useVisibilityRatio';
import { pauseAllExcept } from '@/utils/videoRegistry';

interface ShortCardWithObserverProps {
  item: ExploreContentItem;
  onClick: () => void;
  height?: number;
  isPinned?: boolean;
  onVisibilityChange?: (id: string, visible: boolean) => void;
}

const PLAY_AT = 0.6;   // Play when ≥60% visible
const PAUSE_BELOW = 0.4; // Pause when <40% visible

/**
 * Wrapper around ShortCard that uses IntersectionObserver with hysteresis to control autoplay.
 * - Play when card reaches ≥60% visible
 * - Pause when card drops <40% visible
 * - Enforces exclusivity: pauses all other videos when this one starts
 */
export default function ShortCardWithObserver({
  item,
  onClick,
  height,
  isPinned,
  onVisibilityChange
}: ShortCardWithObserverProps) {
  const { ref, ratio } = useVisibilityRatio<HTMLDivElement>();
  const [enabled, setEnabled] = useState(false);

  // Check for reduced motion preference
  const prefersReduced = useMemo(
    () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Hysteresis: stable play/pause based on visibility ratio
  useEffect(() => {
    setEnabled(prev => (prev ? ratio >= PAUSE_BELOW : ratio >= PLAY_AT));
  }, [ratio]);

  // Enforce exclusivity: pause all other videos when this one starts
  useEffect(() => {
    if (enabled && !prefersReduced) {
      pauseAllExcept(item.id);
    }
  }, [enabled, item.id, prefersReduced]);

  // Notify parent of visibility changes
  useEffect(() => {
    onVisibilityChange?.(item.id, ratio >= PAUSE_BELOW);
  }, [ratio, item.id, onVisibilityChange]);

  const effectiveEnabled = enabled && !prefersReduced;

  return (
    <div ref={ref} data-short-id={item.id}>
      <ShortCard
        item={item}
        onClick={onClick}
        height={height}
        isPinned={isPinned}
        autoplay={effectiveEnabled}
      />
    </div>
  );
}
