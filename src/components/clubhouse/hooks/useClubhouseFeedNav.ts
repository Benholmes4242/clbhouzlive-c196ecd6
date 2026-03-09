import { useCallback, useEffect, useRef } from 'react';
import { useMediaStore } from '@/components/media-system/store/mediaStore';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { clubhouseDebug } from '@/debug/clubhouseDebug';

interface UseFeedNavOptions {
  activeTab: string;
  activeFeed: {
    fetchNextPage: () => void;
    refetch: () => Promise<unknown>;
    resetSeen: () => void;
    hasNextPage: boolean | undefined;
    isFetchingNextPage: boolean;
  };
  onTabSwitch: () => void; // resets likes/follows/comments
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
      clubhouseDebug.tabChange(prevTabRef.current, activeTab);
      useMediaStore.getState().setActiveIndex(0);
      onTabSwitch();
      prevTabRef.current = activeTab;
    }
  }, [activeTab, onTabSwitch]);

  const handleNearEnd = useCallback(() => {
    if (activeFeed.hasNextPage && !activeFeed.isFetchingNextPage) {
      activeFeed.fetchNextPage();
    }
  }, [activeFeed]);

  const handleRefresh = useCallback(async () => {
    activeFeed.resetSeen();
    onTabSwitch();
    await activeFeed.refetch();
  }, [activeFeed, onTabSwitch]);

  return { handleNearEnd, handleRefresh };
}
