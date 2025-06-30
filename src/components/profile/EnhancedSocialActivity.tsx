
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Grid3X3, List, Pin, Play, Image as ImageIcon } from 'lucide-react';
import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost } from './types/ActivityTypes';

interface EnhancedSocialActivityProps {
  userId: string;
  isOwnProfile: boolean;
  profileDisplayName?: string;
}

const EnhancedSocialActivity: React.FC<EnhancedSocialActivityProps> = ({
  userId,
  isOwnProfile,
  profileDisplayName
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const [showPinned, setShowPinned] = useState(true);
  
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);

  // Mock pinned posts (in real implementation, these would come from backend)
  const pinnedPosts = posts.slice(0, 2); // First 2 posts as pinned
  const regularPosts = posts.slice(2);

  const getContentTypeIcon = (post: ActivityPost) => {
    const hasVideo = post.post_media.some(m => m.media_type === 'video');
    return hasVideo ? <Play className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />;
  };

  const getPostCaption = (post: ActivityPost) => {
    if (!post.content) return '';
    return post.content.length > 50 ? `${post.content.substring(0, 50)}...` : post.content;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Activity</h3>
            <Badge variant="secondary">{posts.length} Posts</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="p-2"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'carousel' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('carousel')}
              className="p-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No posts yet.</p>
            {isOwnProfile && (
              <Button className="mt-4" onClick={() => {}}>
                Share Your First Moment
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && showPinned && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="h-4 w-4 text-[#b66b41]" />
                  <h4 className="font-medium text-sm">Pinned Posts</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pinnedPosts.map((post) => (
                    <div key={`pinned-${post.id}`} className="relative group cursor-pointer">
                      <div className="aspect-square relative overflow-hidden rounded-lg border-2 border-[#b66b41]/30">
                        {post.post_media[0] && (
                          <img
                            src={post.post_media[0].media_url}
                            alt="Pinned post"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-[#b66b41] text-white text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            {getContentTypeIcon(post)}
                          </Badge>
                        </div>
                      </div>
                      {getPostCaption(post) && (
                        <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                          {getPostCaption(post)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            {regularPosts.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-3 text-gray-700">Recent Posts</h4>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-3 gap-1">
                    {regularPosts.map((post) => (
                      <div key={post.id} className="aspect-square relative group cursor-pointer">
                        <div className="w-full h-full overflow-hidden rounded-lg">
                          {post.post_media[0] && (
                            <img
                              src={post.post_media[0].media_url}
                              alt="Post"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="text-xs">
                              {getContentTypeIcon(post)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {regularPosts.map((post) => (
                      <div key={post.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 flex-shrink-0">
                          {post.post_media[0] && (
                            <img
                              src={post.post_media[0].media_url}
                              alt="Post"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getContentTypeIcon(post)}
                            <span className="text-xs text-gray-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {post.content && (
                            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedSocialActivity;
