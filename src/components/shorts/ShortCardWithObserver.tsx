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
  useGlassPanel?: boolean; // Use glass panel layout for landscape cards (default true)
  badgeType?: 'trending' | 'suggested'; // Badge type to show
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
  gridPosition = 0,
  useGlassPanel,
  badgeType
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

  // Play observer - trigger autoplay when entering viewport (0% threshold)
  const { ref: playRef, isInView } = useIntersectionObserver({
    threshold: 0,
    rootMargin: '0px'
  });

  // Combined ref to attach both observers synchronously (works in mobile)
  const combinedRef = React.useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
    if (el) {
      nearRef.current = el;
      playRef.current = el;
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
    
    // Portrait cards follow alternating pattern
    // Row 1 (positions 0-1): position 0 plays
    // Row 2 (positions 2-3): position 3 plays
    // Pattern repeats every 4 positions
    const positionInPattern = gridPosition % 4;
    const shouldPlay = positionInPattern === 0 || positionInPattern === 3;
    
    setShouldAutoplay(shouldPlay);
  }, [isInView, variant, gridPosition]);

  // Notify parent of visibility changes
  React.useEffect(() => {
    onVisibilityChange?.(item.id, isInView);
  }, [isInView, item.id, onVisibilityChange]);

  return (
    <div ref={combinedRef}>
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
        useGlassPanel={useGlassPanel}
        badgeType={badgeType}
      />
    </div>
  );
}
