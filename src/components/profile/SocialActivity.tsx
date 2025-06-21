import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Heart, MessageCircle, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CreatePostDialog from '@/components/posts/CreatePostDialog';
import TaggedText from '@/components/posts/TaggedText';

interface PostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface ActivityPost {
  id: string;
  type: 'post' | 'share' | 'comment';
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timeAgo: string;
  created_at?: string;
  post_media?: Array<{
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
  }>;
  post_tags: PostTag[];
}

interface SocialActivityProps {
  userId?: string;
  isOwnProfile?: boolean;
  activityVisible?: boolean;
  onVisibilityToggle?: (checked: boolean) => void;
  profileDisplayName?: string;
}

const SocialActivity: React.FC<SocialActivityProps> = ({
  userId,
  isOwnProfile = false,
  activityVisible = true,
  onVisibilityToggle,
  profileDisplayName
}) => {
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = async () => {
    if (!userId) return;

    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          post_media (
            id,
            media_type,
            media_url
          ),
          post_tags (
            tagged_entity_id,
            taggable_entities (
              id,
              entity_type,
              entity_id,
              name,
              username
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user posts:', error);
        return;
      }

      const formattedPosts = postsData.map(post => ({
        id: post.id,
        type: 'post' as const,
        content: post.content || '',
        likes: 0,
        comments: 0,
        shares: 0,
        timeAgo: new Date(post.created_at).toLocaleDateString(),
        created_at: post.created_at,
        post_media: (post.post_media || []).map(media => ({
          id: media.id,
          media_type: media.media_type as 'image' | 'video',
          media_url: media.media_url
        })),
        post_tags: (post.post_tags || []).map((tag: any) => ({
          id: tag.taggable_entities.id,
          entity_type: tag.taggable_entities.entity_type as 'user' | 'golf_club' | 'business',
          entity_id: tag.taggable_entities.entity_id,
          name: tag.taggable_entities.name,
          username: tag.taggable_entities.username
        })),
        image: post.post_media?.find(media => media.media_type === 'image')?.media_url
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [userId]);

  // If this is not the user's own profile and activity is not visible, don't render anything
  if (!isOwnProfile && !activityVisible) {
    return null;
  }

  // Get the correct attribution text
  const getPostAttribution = () => {
    if (isOwnProfile) {
      return "You posted this";
    } else {
      const firstName = profileDisplayName?.split(' ')[0] || 'User';
      return `${firstName} posted this`;
    }
  };

  if (!isOwnProfile && !activityVisible) {
    return null;
  }

  return (
    <div className="mt-10 px-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Activity</h2>
          <span className="text-sm text-muted-foreground">
            {posts.length} posts
          </span>
        </div>
        {isOwnProfile && (
          <CreatePostDialog onPostCreated={fetchUserPosts} />
        )}
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{getPostAttribution()}</span>
                <span className="text-xs text-muted-foreground">• {post.timeAgo}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm mb-3">
              <TaggedText text={post.content} tags={post.post_tags} />
            </div>

            {post.post_media && post.post_media.length > 0 && (
              <div className="mb-3 space-y-2">
                {post.post_media.map((media) => (
                  <div key={media.id}>
                    {media.media_type === 'image' ? (
                      <img
                        src={media.media_url}
                        alt="Post content"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={media.media_url}
                        controls
                        preload="metadata"
                        className="w-full h-48 object-cover rounded-lg"
                        poster={`${media.media_url}#t=0.1`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-red-500">
                  <Heart className="h-4 w-4" />
                  {post.likes}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <Share className="h-4 w-4" />
                  {post.shares}
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {posts.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialActivity;
