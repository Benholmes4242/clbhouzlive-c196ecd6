import React from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import ShortCard from './ShortCard';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface ShortCardWithObserverProps {
  item: ExploreContentItem;
  onClick: () => void;
  height?: number;
  isPinned?: boolean;
  onVisibilityChange?: (id: string, visible: boolean) => void;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
  variant?: 'portrait' | 'landscape'; // Support landscape cards
  gridPosition?: number; // Position in the grid (0-based) for autoplay pattern
}

/**
 * Wrapper around ShortCard that uses IntersectionObserver to control autoplay.
 * Autoplay follows pattern:
 * - Row 1: Left card plays (position 0), right paused (position 1)
 * - Row 2: Right card plays (position 3), left paused (position 2)
 * - Landscape: Always plays
 * Pattern repeats every 4 portrait cards
 */
export default function ShortCardWithObserver({
  item,
  onClick,
  height,
  isPinned,
  onVisibilityChange,
  onLike,
  onAuthorClick,
  currentUserId,
  variant,
  gridPosition = 0
}: ShortCardWithObserverProps) {
  const { ref, isInView } = useIntersectionObserver({
    threshold: 0.65,
    rootMargin: '0px'
  });

  // Determine if this card should autoplay based on grid position
  const shouldAutoplay = React.useMemo(() => {
    // Landscape cards always autoplay when in view
    if (variant === 'landscape') return isInView;
    
    // Portrait cards follow alternating pattern
    // Row 1 (positions 0-1): position 0 plays
    // Row 2 (positions 2-3): position 3 plays
    // Pattern repeats every 4 positions
    const positionInPattern = gridPosition % 4;
    const shouldPlay = positionInPattern === 0 || positionInPattern === 3;
    
    return isInView && shouldPlay;
  }, [isInView, variant, gridPosition]);

  // Notify parent of visibility changes
  React.useEffect(() => {
    onVisibilityChange?.(item.id, isInView);
  }, [isInView, item.id, onVisibilityChange]);

  return (
    <div ref={ref}>
      <ShortCard
        item={item}
        onClick={onClick}
        height={height}
        isPinned={isPinned}
        autoplay={shouldAutoplay}
        onLike={onLike}
        onAuthorClick={onAuthorClick}
        currentUserId={currentUserId}
        variant={variant}
      />
    </div>
  );
}
