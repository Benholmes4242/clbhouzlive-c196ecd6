
import React, { useState, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sliders, Video, Image, MapPin, Trophy } from 'lucide-react';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { useActivityPosts } from './hooks/useActivityPosts';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import ExploreGrid from '@/components/explore/ExploreGrid';
import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
import { ExploreContentItem } from '@/components/explore/types';
import { ActivityPost } from './types/ActivityTypes';

type FilterType = 'all' | 'videos' | 'photos' | 'golf-courses';

interface ActivityFeedProps {
  userId: string;
  isOwnProfile: boolean;
  profileDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  isOwnProfile,
  profileDisplayName,
  userHandicap,
  userProfilePhotoUrl
}) => {
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);
  const { isOpen, initialItem, openFeed, closeFeed } = useVerticalMediaFeed();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  // Filter posts based on active filter
  const filteredPosts = useMemo(() => {
    switch (activeFilter) {
      case 'videos':
        return posts.filter(post => 
          post.post_media.some(media => media.media_type === 'video')
        );
      case 'photos':
        return posts.filter(post => 
          post.post_media.some(media => media.media_type === 'image')
        );
      case 'golf-courses':
        return posts.filter(post => 
          post.post_tags.some(tag => tag.entity_type === 'golf_club')
        );
      default:
        return posts;
    }
  }, [posts, activeFilter]);

  // Convert filtered activity posts to ExploreContentItem format - only include posts with media
  const exploreContent: ExploreContentItem[] = filteredPosts
    .filter(post => post.post_media && post.post_media.length > 0) // Only include posts with media
    .map(post => ({
      id: post.id,
      type: post.post_media[0].media_type === 'video' ? 'video' : 'image',
      src: post.post_media[0].media_url,
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
      },
      // Add the full media array for multiple media navigation
      media: post.post_media.map(media => ({
        id: media.id,
        media_type: media.media_type,
        media_url: media.media_url
      }))
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
      <div className="px-4 md:px-0">
          {/* Filter Dropdown */}
          <div className="flex justify-end mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-muted border border-border hover:bg-muted/80 text-foreground transition-all duration-200"
                >
                  <Sliders className="h-4 w-4 text-black" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-background border border-border"
              >
                <DropdownMenuItem 
                  onClick={() => setActiveFilter('all')}
                  className={`cursor-pointer ${activeFilter === 'all' ? 'bg-accent' : ''}`}
                >
                  <span className="mr-2">📱</span>
                  All Posts
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setActiveFilter('videos')}
                  className={`cursor-pointer ${activeFilter === 'videos' ? 'bg-accent' : ''}`}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Videos only
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setActiveFilter('photos')}
                  className={`cursor-pointer ${activeFilter === 'photos' ? 'bg-accent' : ''}`}
                >
                  <Image className="mr-2 h-4 w-4" />
                  Photos only
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setActiveFilter('golf-courses')}
                  className={`cursor-pointer ${activeFilter === 'golf-courses' ? 'bg-accent' : ''}`}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Posts tagged with golf course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No posts yet.</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No posts found for the selected filter.
            </p>
          </div>
        ) : null}
      </div>

      {/* Activity cards with edge-to-edge layout on mobile like discover page */}
      {posts.length > 0 && filteredPosts.length > 0 && (
        <ExploreGrid
          content={exploreContent}
          onLike={handleLike}
          onFollow={handleFollow}
          onMediaClick={handleMediaClick}
          isLoading={false}
          hasMore={false}
          onLoadMore={handleLoadMore}
          isDiscoverPage={false}
          isActivityFeed={true}
          hideBadges={true}
        />
      )}

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

      {/* Achievements Modal */}
      <ClbhouzAchievementsModal
        isOpen={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
        userId={userId}
        userDisplayName={profileDisplayName}
        userHandicap={userHandicap}
        userProfilePhotoUrl={userProfilePhotoUrl}
        isCurrentUser={isOwnProfile}
      />
    </>
  );
};

export default ActivityFeed;
