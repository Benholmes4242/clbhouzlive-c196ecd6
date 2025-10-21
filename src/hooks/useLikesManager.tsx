import { useState, useCallback } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { toast } from 'sonner';

/**
 * Custom hook for managing likes with optimistic updates
 * Handles like state management and rollback on failure
 */
export const useLikesManager = () => {
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});

  const toggleLike = useCallback((
    itemId: string,
    items: ExploreContentItem[],
    setItems: (items: ExploreContentItem[]) => void
  ) => {
    // Get current state
    const currentlyLiked = likedItems[itemId] ?? false;
    const newLikedState = !currentlyLiked;

    // Optimistic update
    setLikedItems(prev => ({ ...prev, [itemId]: newLikedState }));
    setItems(
      items.map(item =>
        item.id === itemId
          ? {
              ...item,
              isLiked: newLikedState,
              likes: newLikedState ? (item.likes ?? 0) + 1 : Math.max(0, (item.likes ?? 0) - 1)
            }
          : item
      )
    );

    // Haptics on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // TODO: Replace with actual API call
    // For now, simulate API with timeout
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      if (!success) {
        // Rollback on failure
        setLikedItems(prev => ({ ...prev, [itemId]: currentlyLiked }));
        setItems(
          items.map(item =>
            item.id === itemId
              ? {
                  ...item,
                  isLiked: currentlyLiked,
                  likes: currentlyLiked ? (item.likes ?? 0) + 1 : Math.max(0, (item.likes ?? 0) - 1)
                }
              : item
          )
        );
        toast.error('Failed to update like');
      }
    }, 500);
  }, [likedItems]);

  return { likedItems, toggleLike };
};
