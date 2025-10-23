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
}

/**
 * Wrapper around ShortCard that uses IntersectionObserver to control autoplay.
 * Autoplay is triggered when card is ≥65% visible in viewport.
 */
export default function ShortCardWithObserver({
  item,
  onClick,
  height,
  isPinned,
  onVisibilityChange,
  onLike,
  onAuthorClick,
  currentUserId
}: ShortCardWithObserverProps) {
  const { ref, isInView } = useIntersectionObserver({
    threshold: 0.65,
    rootMargin: '0px'
  });

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
        autoplay={isInView}
        onLike={onLike}
        onAuthorClick={onAuthorClick}
        currentUserId={currentUserId}
      />
    </div>
  );
}
