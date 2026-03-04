/**
 * FullscreenMediaViewer — pure video engine, no UI overlays.
 * Only video playback, scroll/spring physics, and feed data hooks.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { VideoPoolProvider } from './VideoPoolProvider';
import { FeedContainer } from './FeedContainer';
import { usePreloader } from './hooks/usePreloader';
import { useSuggestedFeed } from './hooks/useSuggestedFeed';
import { useFriendsFeed } from './hooks/useFriendsFeed';
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

  // TEMPORARY: Hide app header/footer for fullscreen testing
  useEffect(() => {
    const header = document.querySelector('header, [data-header], .app-header');
    const footer = document.querySelector('nav, [data-footer], .bottom-nav, .app-footer');
    if (header) (header as HTMLElement).style.display = 'none';
    if (footer) (footer as HTMLElement).style.display = 'none';
    return () => {
      if (header) (header as HTMLElement).style.display = '';
      if (footer) (footer as HTMLElement).style.display = '';
    };
  }, []);

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
        <div className="fixed inset-0 z-[9999] bg-black overflow-hidden">
          <LoadingSkeleton visible={true} />
        </div>
      </VideoPoolProvider>
    );
  }

  if (!activeFeed.posts.length) {
    return (
      <VideoPoolProvider>
        <div
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
          style={{ fontFamily: '-apple-system, sans-serif' }}
        >
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
      <div className="fixed inset-0 z-[9999] bg-black overflow-hidden">
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
