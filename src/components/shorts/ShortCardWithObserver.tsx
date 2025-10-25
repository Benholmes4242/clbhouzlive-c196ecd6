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

    // Landscape cards always autoplay when in view
    if (variant === 'landscape') {
      setShouldAutoplay(true);
      return;
    }
    
    // Portrait cards follow staggered autoplay pattern:
    // Row 1 (positions 0-1): LEFT plays (position 0 in row)
    // Row 2 (positions 2-3): RIGHT plays (position 1 in row)
    // This creates the pattern: 0L / 2R / 0L / 2R...
    // Pattern repeats every 4 portrait positions (2 rows)
    const positionInPattern = gridPosition % 4;
    const isLeftCard = positionInPattern % 2 === 0; // even positions are left (0, 2)
    const rowInCycle = Math.floor(positionInPattern / 2); // 0 for first row, 1 for second row
    
    // Row 0 (positions 0-1): left plays
    // Row 1 (positions 2-3): right plays
    const shouldPlay = (rowInCycle === 0 && isLeftCard) || (rowInCycle === 1 && !isLeftCard);
    
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
