import React, { useMemo, useEffect } from 'react';
import InstagramStylePost from './InstagramStylePost';
import LoadingSkeleton from '@/components/feed/LoadingSkeleton';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';


interface UserPost {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: {
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
  }[];
  post_tags: {
    id: string;
    entity_type: 'user' | 'golf_club' | 'business';
    entity_id: string;
    name: string;
    username: string | null;
  }[];
}

interface InstagramStyleFeedProps {
  userPosts?: UserPost[];
  loading?: boolean;
}

const InstagramStyleFeed: React.FC<InstagramStyleFeedProps> = ({ userPosts = [], loading = false }) => {
  const { preloadStrategy } = useMobileOptimizations();

  // Preload first few profile images for better performance
  useEffect(() => {
    if (userPosts.length > 0) {
      const profileImages = userPosts
        .slice(0, 3)
        .map(post => post.user.profile_photo_url)
        .filter(Boolean) as string[];
      
      preloadStrategy(profileImages);
    }
  }, [userPosts, preloadStrategy]);
  // Memoize filtered posts for performance
  const postsWithMedia = useMemo(() => 
    userPosts.filter(post => post.post_media && post.post_media.length > 0),
    [userPosts]
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (postsWithMedia.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-muted-foreground">
          <p className="text-lg">No posts available yet.</p>
          <p className="text-sm mt-2">Be the first to share your golf moments!</p>
        </div>
      </div>
    );
  }

  return (
      <div className="w-full">
        {/* Instagram-style full-width posts */}
        <div className="space-y-0">
          {postsWithMedia.map((post, index) => (
            <InstagramStylePost 
              key={post.id} 
              post={post} 
              index={index}
              allUserPosts={postsWithMedia}
            />
          ))}
        </div>
      </div>
  );
};

export default InstagramStyleFeed;