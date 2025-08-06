
import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Filter, Video, Image, MapPin, Trophy } from 'lucide-react';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost } from './types/ActivityTypes';

type FilterType = 'all' | 'videos' | 'photos' | 'golf-courses';

interface ActivityFeedProps {
  userId: string;
  isOwnProfile: boolean;
  profileDisplayName?: string;
  userHandicap?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  isOwnProfile,
  profileDisplayName,
  userHandicap
}) => {
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);
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
      <div className="py-4">
        {/* Achievements Button */}
        <div className="flex items-center justify-between mb-4 px-4 md:px-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAchievementsModalOpen(true)}
            className="bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary transition-all duration-200"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Achievements
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4 px-4 md:px-0">
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-foreground">Activity</h3>
            <span className="text-muted-foreground text-base">
              {activeFilter === 'all' ? `${posts.length} posts` : `${filteredPosts.length} of ${posts.length} posts`}
            </span>
          </div>
          
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-muted border border-border hover:bg-muted/80 text-foreground transition-all duration-200"
              >
                <Filter className="h-4 w-4" />
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
        ) : (
          <div className="grid gap-4 px-4 md:px-0">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-card rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <img 
                    src={post.user.profile_photo_url || '/placeholder.svg'} 
                    alt={post.user.display_name || 'User'} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-foreground">
                        {post.user.display_name || post.user.username || 'Anonymous'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {post.content && (
                      <p className="text-foreground mb-3">{post.content}</p>
                    )}
                    
                    {post.post_media && post.post_media.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {post.post_media.slice(0, 4).map((media) => (
                          <div key={media.id} className="aspect-square rounded-lg overflow-hidden">
                            {media.media_type === 'video' ? (
                              <video 
                                src={media.media_url} 
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <img 
                                src={media.media_url} 
                                alt="Post media" 
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {post.post_tags && post.post_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.post_tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag.entity_type === 'golf_club' ? '🏌️' : '📍'} {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements Modal */}
      <ClbhouzAchievementsModal
        isOpen={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
        userId={userId}
        userDisplayName={profileDisplayName}
        userHandicap={userHandicap}
      />
    </>
  );
};

export default ActivityFeed;
