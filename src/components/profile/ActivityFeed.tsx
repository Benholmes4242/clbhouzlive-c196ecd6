
import React, { useState } from 'react';
import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
import ExploreGrid from '@/components/explore/ExploreGrid';
import { useActivityPosts } from './hooks/useActivityPosts';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
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
  const { 
    isOpen: isFeedOpen, 
    initialItem, 
    openFeed, 
    closeFeed 
  } = useVerticalMediaFeed();

  // Convert activity posts to ExploreContentItem format
  const convertToExploreItems = (activityPosts: any[]): ExploreContentItem[] => {
    return activityPosts.map(post => ({
      id: post.id,
      type: post.post_media?.[0]?.media_type === 'video' ? 'video' : 'image' as 'video' | 'image',
      src: post.post_media?.[0]?.media_url || '',
      title: post.content || '',
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      user: {
        id: post.user.id,
        name: post.user.display_name || post.user.username || 'Unknown User',
        username: post.user.username,
        avatar: post.user.profile_photo_url || '/placeholder.svg',
        verified: false
      },
      isFollowing: false,
      golfCourse: post.post_tags?.find((tag: any) => tag.entity_type === 'golf_club') ? {
        id: post.post_tags.find((tag: any) => tag.entity_type === 'golf_club').entity_id,
        name: post.post_tags.find((tag: any) => tag.entity_type === 'golf_club').name,
        country: ''
      } : undefined,
      media: post.post_media ? [{
        id: post.post_media[0].id,
        media_type: post.post_media[0].media_type,
        media_url: post.post_media[0].media_url
      }] : []
    })).filter(item => item.src); // Only include posts with media
  };

  const exploreItems = convertToExploreItems(posts);

  const handleLike = (contentId: string) => {
    // Update likes optimistically - could be enhanced with actual API call
    console.log('Liked content:', contentId);
  };

  const handleFollow = (contentId: string) => {
    // Update follow status optimistically - could be enhanced with actual API call
    console.log('Followed user from content:', contentId);
  };

  const handleMediaClick = (item: ExploreContentItem) => {
    openFeed(item);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (exploreItems.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {isOwnProfile ? 'No posts yet.' : `${profileDisplayName} hasn't posted any media yet.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <ExploreGrid
        content={exploreItems}
        onLike={handleLike}
        onFollow={handleFollow}
        onMediaClick={handleMediaClick}
        isLoading={false}
        hasMore={false}
        onLoadMore={() => {}}
        activeFilter="videos"
        isDiscoverPage={true}
      />
      
      {/* Vertical Feed Modal */}
      {initialItem && (
        <DiscoverVerticalFeed
          isOpen={isFeedOpen}
          onClose={closeFeed}
          posts={exploreItems}
          onLike={handleLike}
          onLoadMore={() => {}}
          hasMore={false}
          isLoadingMore={false}
          initialItem={initialItem}
        />
      )}
    </div>
  );
};

export default ActivityFeed;
