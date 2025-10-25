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
 * Uses dual-observer pattern like Clubhouse for optimal performance:
 * - Near observer (300px margin): Prebuffers video when approaching viewport
 * - Play observer (0.1 threshold): Triggers autoplay when in view
 * 
 * Autoplay follows 3-row repeating pattern:
 * - Row 1 (first portrait row): LEFT card autoplays, right paused
 * - Row 2 (second portrait row): RIGHT card autoplays, left paused
 * - Row 3 (landscape): Always autoplays
 * Pattern repeats: Row1 → Row2 → Row3 → Row1 → Row2 → Row3...
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
  // State for dual-observer pattern
  const [shouldAttach, setShouldAttach] = React.useState(false);
  const [shouldAutoplay, setShouldAutoplay] = React.useState(false);
  
  // Container ref to share between both observers
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Near observer - prebuffer when approaching viewport (300px margin)
  const { ref: nearRef, isInView: isNear } = useIntersectionObserver({
    threshold: 0,
    rootMargin: '300px 0px 300px 0px'
  });

  // Play observer - trigger autoplay when actually in view
  const { ref: playRef, isInView } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '0px'
  });

  // Assign the same element to both observers
  React.useEffect(() => {
    const element = containerRef.current;
    if (element) {
      nearRef.current = element;
      playRef.current = element;
    }
  }, [nearRef, playRef]);

  // Update attach state when near
  React.useEffect(() => {
    setShouldAttach(isNear);
  }, [isNear]);

  // Determine if this card should autoplay based on grid position and visibility
  React.useEffect(() => {
    if (!isInView) {
      setShouldAutoplay(false);
      return;
    }

    // Landscape cards always autoplay when in view (Row 3 in 3-row cycle)
    if (variant === 'landscape') {
      setShouldAutoplay(true);
      return;
    }
    
    // Portrait cards follow 3-row repeating pattern:
    // Calculate which row in the 3-row cycle (0, 1, or 2)
    // gridPosition for portraits counts only portrait cards (0, 1, 2, 3, 4, 5...)
    // Every 4 portraits = 2 rows, then landscape interrupts
    // So we need to map: 0,1 -> row0, 2,3 -> row1, then repeat
    
    const positionInRow = gridPosition % 2; // 0 = left, 1 = right
    const pairIndex = Math.floor(gridPosition / 2); // which pair of portraits (0, 1, 2, 3...)
    const rowInCycle = pairIndex % 2; // alternates between 0 and 1 (row 1 and row 2)
    
    // Row 0 (first portrait row): LEFT plays (positionInRow === 0)
    // Row 1 (second portrait row): RIGHT plays (positionInRow === 1)
    const shouldPlay = (rowInCycle === 0 && positionInRow === 0) || (rowInCycle === 1 && positionInRow === 1);
    
    setShouldAutoplay(shouldPlay);
  }, [isInView, variant, gridPosition]);

  // Notify parent of visibility changes
  React.useEffect(() => {
    onVisibilityChange?.(item.id, isInView);
  }, [isInView, item.id, onVisibilityChange]);

  return (
    <div ref={containerRef}>
      <ShortCard
        item={item}
        onClick={onClick}
        height={height}
        isPinned={isPinned}
        shouldAttach={shouldAttach}
        autoplay={shouldAutoplay}
        onLike={onLike}
        onAuthorClick={onAuthorClick}
        currentUserId={currentUserId}
        variant={variant}
      />
    </div>
  );
}
