
import React, { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { useActivityPosts } from './hooks/useActivityPosts';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import ExploreGrid from '@/components/explore/ExploreGrid';
import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
import { ExploreContentItem } from '@/components/explore/types';

interface ActivityFeedProps {
  userId: string;
  isOwnProfile: boolean;
  profileDisplayName?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  isOwnProfile,
  profileDisplayName
}) => {
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);
  const { isOpen, initialItem, openFeed, closeFeed } = useVerticalMediaFeed();

  // Convert activity posts to ExploreContentItem format
  const exploreContent: ExploreContentItem[] = posts.map(post => ({
    id: post.id,
    type: post.post_media?.[0]?.media_type === 'video' ? 'video' : 'image',
    src: post.post_media?.[0]?.media_url || '/placeholder.svg',
    title: post.content || '',
    likes: 0,
    comments: 0,
    shares: 0,
    user: {
      id: post.user.id,
      name: post.user.display_name || post.user.username || 'Anonymous',
      username: post.user.username || undefined,
      avatar: post.user.profile_photo_url || '/placeholder.svg',
      verified: false
    }
  }));

  const handleLike = useCallback((contentId: string) => {
    console.log('Like:', contentId);
  }, []);

  const handleFollow = useCallback((contentId: string) => {
    console.log('Follow:', contentId);
  }, []);

  const handleMediaClick = useCallback((item: ExploreContentItem) => {
    openFeed(item);
  }, [openFeed]);

  const handleLoadMore = useCallback(() => {
    // No pagination for profile posts currently
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-white">Activity</h3>
              <span className="text-white/80 text-base">{posts.length} posts</span>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No posts yet.</p>
            </div>
          ) : (
            <ExploreGrid
              content={exploreContent}
              onLike={handleLike}
              onFollow={handleFollow}
              onMediaClick={handleMediaClick}
              isLoading={false}
              hasMore={false}
              onLoadMore={handleLoadMore}
              isDiscoverPage={true}
            />
          )}
        </div>
      </div>

      {/* Vertical Media Feed Modal */}
      {isOpen && initialItem && (
        <DiscoverVerticalFeed
          isOpen={isOpen}
          onClose={closeFeed}
          posts={exploreContent}
          onLike={handleLike}
          onLoadMore={handleLoadMore}
          hasMore={false}
          isLoadingMore={false}
          initialItem={initialItem}
        />
      )}
    </>
  );
};

export default ActivityFeed;
