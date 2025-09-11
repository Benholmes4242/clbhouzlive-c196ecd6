import { useState, useCallback } from 'react';
import { ExploreContentItem } from '@/components/explore/types';

type OpenFeedOptions = { initialMediaIndex?: number };

interface UseVerticalMediaFeedReturn {
  isOpen: boolean;
  posts: ExploreContentItem[];
  initialItem: ExploreContentItem | null;
  initialMediaIndex: number;
  openFeed: (item: ExploreContentItem, opts?: OpenFeedOptions) => void;
  closeFeed: () => void;
  setPosts: (posts: ExploreContentItem[]) => void;
}

interface UseVerticalMediaFeedConfig {
  initialPosts?: ExploreContentItem[];
}

export const useVerticalMediaFeed = (initialConfig?: UseVerticalMediaFeedConfig): UseVerticalMediaFeedReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [posts, setPosts] = useState<ExploreContentItem[]>(initialConfig?.initialPosts || []);
  const [initialItem, setInitialItem] = useState<ExploreContentItem | null>(null);
  const [initialMediaIndex, setInitialMediaIndex] = useState<number>(0);

  const openFeed = useCallback((item: ExploreContentItem, opts: OpenFeedOptions = {}) => {
    setInitialItem(item);
    setInitialMediaIndex(opts.initialMediaIndex ?? 0);
    setIsOpen(true);
  }, []);

  const closeFeed = useCallback(() => {
    setIsOpen(false);
    // Delay clearing the initial item to allow for smooth closing animation
    setTimeout(() => {
      setInitialItem(null);
      setInitialMediaIndex(0);
    }, 300);
  }, []);

  return {
    isOpen,
    posts,
    initialItem,
    initialMediaIndex,
    openFeed,
    closeFeed,
    setPosts
  };
};