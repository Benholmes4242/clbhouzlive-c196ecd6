import React from 'react';
import { ActivityFeedSkeleton } from './ProfileSkeleton';
import { formatDistanceToNow } from 'date-fns';

interface ActivityPost {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  post_media: Array<{
    id: string;
    media_type: string;
    media_url: string;
  }>;
}

interface OptimizedActivityFeedProps {
  posts: ActivityPost[];
  isLoading?: boolean;
}

const OptimizedActivityFeed: React.FC<OptimizedActivityFeedProps> = ({
  posts,
  isLoading = false
}) => {
  if (isLoading) {
    return <ActivityFeedSkeleton />;
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-card rounded-lg border p-6 transition-all hover:shadow-md">
          {/* Post Content */}
          {post.content && (
            <p className="text-foreground mb-4 leading-relaxed">
              {post.content}
            </p>
          )}

          {/* Post Media - Optimized for fast loading */}
          {post.post_media && post.post_media.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {post.post_media.slice(0, 4).map((media) => (
                <div key={media.id} className="relative overflow-hidden rounded-lg bg-muted">
                  {media.media_type === 'image' ? (
                    <img
                      src={media.media_url}
                      alt="Post media"
                      className="w-full h-64 object-cover transition-transform"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <video
                      src={media.media_url}
                      className="w-full h-64 object-cover"
                      controls
                      preload="metadata"
                      poster={media.media_url.replace('.mov', '-thumbnail.jpg')}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Post Timestamp */}
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      ))}
    </div>
  );
};

export default OptimizedActivityFeed;