
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useActivityPosts } from './hooks/useActivityPosts';
import VideoPreview from '@/components/posts/VideoPreview';

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
            <div key={post.id} className="aspect-square relative cursor-pointer">
              <div className="w-full h-full overflow-hidden rounded-lg">
                {post.post_media[0] && (
                  <>
                    {post.post_media[0].media_type === 'video' ? (
                      <VideoPreview
                        src={post.post_media[0].media_url}
                        className="w-full h-full"
                        videoId={`profile-${post.id}`}
                        isGridThumbnail={true}
                      />
                    ) : (
                      <img
                        src={post.post_media[0].media_url}
                        alt="Post"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedSocialActivity;
