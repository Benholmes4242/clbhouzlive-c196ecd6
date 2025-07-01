
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Image as ImageIcon } from 'lucide-react';
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
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);

  const getContentTypeIcon = (post: ActivityPost) => {
    const hasVideo = post.post_media.some(m => m.media_type === 'video');
    return hasVideo ? <Play className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />;
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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Posts</h3>
          <Badge variant="secondary">{posts.length}</Badge>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
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
      )}
    </div>
  );
};

export default EnhancedSocialActivity;
