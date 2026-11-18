import { useCallback, useEffect, useRef } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface UseFeedNavOptions {
  activeTab: string;
  activeFeed: {
    fetchNextPage: () => void;
    refetch: () => Promise<unknown>;
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
      // Only reset the *target tab's* index when it has no cached scroll
      // position. Cached returns must keep their index so the centred-card
      // restoration matches the per-tab Virtuoso scroll restore.
      const targetHasEverLoaded = (activeFeed as any).hasEverLoaded;
      if (!targetHasEverLoaded) {
        useClubhouseStore.getState().setActiveIndex(0, activeTab);
      }
      onTabSwitch();
      prevTabRef.current = activeTab;
    }
  }, [activeTab, onTabSwitch, activeFeed]);

  const {
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetchingNextPage,
  } = activeFeed;

  const handleNearEnd = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    // Refresh resets the current tab to the top
    useClubhouseStore.getState().setActiveIndex(0, activeTab);
    onTabSwitch();
    await refetch();
  }, [onTabSwitch, refetch, activeTab]);

  return { handleNearEnd, handleRefresh };
}
