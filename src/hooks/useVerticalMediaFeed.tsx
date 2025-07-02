import { useState, useCallback } from 'react';
import { ExploreContentItem } from '@/components/explore/types';

interface UseVerticalMediaFeedReturn {
  isOpen: boolean;
  initialItem: ExploreContentItem | null;
  openFeed: (item: ExploreContentItem) => void;
  closeFeed: () => void;
}

export const useVerticalMediaFeed = (): UseVerticalMediaFeedReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialItem, setInitialItem] = useState<ExploreContentItem | null>(null);

  const openFeed = useCallback((item: ExploreContentItem) => {
    setInitialItem(item);
    setIsOpen(true);
  }, []);

  const closeFeed = useCallback(() => {
    setIsOpen(false);
    // Delay clearing the initial item to allow for smooth closing animation
    setTimeout(() => setInitialItem(null), 300);
  }, []);

  return {
    isOpen,
    initialItem,
    openFeed,
    closeFeed
  };
};