import { useCallback, useEffect, useRef } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface UseFeedNavOptions {
  activeTab: string;
  activeFeed: {
    fetchNextPage: () => void;
    refetch: () => Promise<unknown>;
    resetSeen: () => void;
    hasNextPage: boolean | undefined;
    isFetchingNextPage: boolean;
  };
  onTabSwitch: () => void;
}

/**
 * Manages feed navigation: tab switching, infinite scroll, and pull-to-refresh.
 */
export function useClubhouseFeedNav({ activeTab, activeFeed, onTabSwitch }: UseFeedNavOptions) {
  const prevTabRef = useRef(activeTab);

  // Reset all state on tab switch
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      analyticsEvents.track('feed_tab_switch', { from: prevTabRef.current, to: activeTab });
      useClubhouseStore.getState().setActiveIndex(0);
      onTabSwitch();
      prevTabRef.current = activeTab;
    }
  }, [activeTab, onTabSwitch]);

  const {
    fetchNextPage,
    refetch,
    resetSeen,
    hasNextPage,
    isFetchingNextPage,
  } = activeFeed;

  const handleNearEnd = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    resetSeen();
    onTabSwitch();
    await refetch();
  }, [resetSeen, onTabSwitch, refetch]);

  return { handleNearEnd, handleRefresh };
}
