/**
 * FullscreenMediaViewer — standalone fullscreen media player page.
 * Rebuilt with dual-tab feed system (Suggested / Friends).
 * Uses engagement-scored RPC for Suggested, chronological RPC for Friends.
 * Manages cross-post follow overrides for instant sync.
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
import './styles/mediaPlayer.css';

function FeedWithPreloader({
  posts,
  onNearEnd,
  onRefresh,
  isRefreshing,
  hasNextPage,
  followOverrides,
  onFollowChange,
}: {
  posts: FeedPost[];
  onNearEnd: () => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  hasNextPage: boolean;
  followOverrides: Map<string, boolean>;
  onFollowChange: (userId: string, isFollowed: boolean) => void;
}) {
  usePreloader(posts);
  return (
    <FeedContainer
      posts={posts}
      onNearEnd={onNearEnd}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      hasNextPage={hasNextPage}
      followOverrides={followOverrides}
      onFollowChange={onFollowChange}
    />
  );
}

export default function FullscreenMediaViewer() {
  const { user } = useSupabaseSession();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<FeedTab>('suggested');
  const [followOverrides, setFollowOverrides] = useState<Map<string, boolean>>(new Map());

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
    setFollowOverrides(new Map());
    await activeFeed.refetch();
  }, [activeFeed]);

  const handleTabChange = useCallback((tab: FeedTab) => {
    setActiveTab(tab);
  }, []);

  const handleFollowChange = useCallback((userId: string, isFollowed: boolean) => {
    setFollowOverrides(prev => {
      const next = new Map(prev);
      next.set(userId, isFollowed);
      return next;
    });
  }, []);

  if (activeFeed.isLoading) {
    return (
      <VideoPoolProvider>
        <div className="w-full h-[100dvh] bg-black overflow-hidden relative">
          <FeedTabToggle activeTab={activeTab} onTabChange={handleTabChange} />
          <LoadingSkeleton visible={true} />
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
          followOverrides={followOverrides}
          onFollowChange={handleFollowChange}
        />
      </div>
    </VideoPoolProvider>
  );
}
