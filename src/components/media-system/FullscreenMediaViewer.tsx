/**
 * FullscreenMediaViewer — standalone fullscreen media player page.
 * Rebuilt with dual-tab feed system (Suggested / Friends).
 * Uses engagement-scored RPC for Suggested, chronological RPC for Friends.
 */
import React, { useState, useCallback } from 'react';
import { VideoPoolProvider } from './VideoPoolProvider';
import { FeedContainer } from './FeedContainer';
import { usePreloader } from './hooks/usePreloader';
import { useSuggestedFeed } from './hooks/useSuggestedFeed';
import { useFriendsFeed } from './hooks/useFriendsFeed';
import { FeedTabToggle } from './FeedTabToggle';
import { LoadingSkeleton } from './LoadingSkeleton';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { FeedPost, FeedTab } from './types/media';

function FeedWithPreloader({
  posts,
  onNearEnd,
  onRefresh,
  isRefreshing,
  hasNextPage,
}: {
  posts: FeedPost[];
  onNearEnd: () => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  hasNextPage: boolean;
}) {
  usePreloader(posts);
  return (
    <FeedContainer
      posts={posts}
      onNearEnd={onNearEnd}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      hasNextPage={hasNextPage}
    />
  );
}

export default function FullscreenMediaViewer() {
  const { user } = useSupabaseSession();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<FeedTab>('suggested');

  const suggested = useSuggestedFeed(userId);
  const friends = useFriendsFeed(userId);

  const activeFeed = activeTab === 'suggested' ? suggested : friends;

  const handleNearEnd = useCallback(() => {
    if (activeFeed.hasNextPage && !activeFeed.isFetchingNextPage) {
      activeFeed.fetchNextPage();
    }
  }, [activeFeed]);

  const handleRefresh = useCallback(async () => {
    activeFeed.resetSeen();
    await activeFeed.refetch();
  }, [activeFeed]);

  const handleTabChange = useCallback((tab: FeedTab) => {
    setActiveTab(tab);
  }, []);

  if (activeFeed.isLoading) {
    return (
      <VideoPoolProvider>
        <div className="w-full h-[100dvh] bg-black overflow-hidden relative">
          <FeedTabToggle activeTab={activeTab} onTabChange={handleTabChange} />
          <LoadingSkeleton />
        </div>
      </VideoPoolProvider>
    );
  }

  if (!activeFeed.posts.length) {
    return (
      <VideoPoolProvider>
        <div
          className="w-full h-[100dvh] bg-black flex flex-col items-center justify-center relative"
          style={{ fontFamily: '-apple-system, sans-serif' }}
        >
          <FeedTabToggle activeTab={activeTab} onTabChange={handleTabChange} />
          <p className="text-white/60 text-sm">
            {activeTab === 'friends'
              ? 'No posts from people you follow yet'
              : 'No posts to show'}
          </p>
        </div>
      </VideoPoolProvider>
    );
  }

  return (
    <VideoPoolProvider>
      <div className="w-full h-[100dvh] bg-black overflow-hidden relative">
        <FeedTabToggle activeTab={activeTab} onTabChange={handleTabChange} />
        <FeedWithPreloader
          posts={activeFeed.posts}
          onNearEnd={handleNearEnd}
          onRefresh={handleRefresh}
          isRefreshing={activeFeed.isRefetching}
          hasNextPage={activeFeed.hasNextPage ?? true}
        />
      </div>
    </VideoPoolProvider>
  );
}
