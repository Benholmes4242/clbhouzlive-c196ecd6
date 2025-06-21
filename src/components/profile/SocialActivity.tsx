
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Heart, MessageCircle, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CreatePostDialog from '@/components/posts/CreatePostDialog';
import TaggedText from '@/components/posts/TaggedText';
import PostModal from '@/components/posts/PostModal';
import VideoPreview from '@/components/posts/VideoPreview';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

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
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
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
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUserPosts = async () => {
    if (!userId) return;

    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
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

      // Get user profile for the posts
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', userId)
        .single();

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
        user: {
          id: userId,
          display_name: userProfile?.display_name || null,
          username: userProfile?.username || null,
          profile_photo_url: userProfile?.profile_photo_url || null
        },
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

  const handlePostClick = (post: ActivityPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

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
    <>
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
            <Card key={post.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handlePostClick(post)}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{getPostAttribution()}</span>
                  <span className="text-xs text-muted-foreground">• {post.timeAgo}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm mb-3">
                <TaggedText text={post.content} tags={post.post_tags} />
              </div>

              {post.post_media && post.post_media.length > 0 && (
                <div className="mb-3">
                  {post.post_media.length > 1 ? (
                    <div className="relative">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {post.post_media.map((media, index) => (
                            <CarouselItem key={media.id}>
                              <div className="relative">
                                {media.media_type === 'image' ? (
                                  <img
                                    src={media.media_url}
                                    alt="Post content"
                                    className="w-full h-48 object-cover rounded-lg"
                                  />
                                ) : (
                                  <VideoPreview
                                    src={media.media_url}
                                    className="w-full h-48 rounded-lg overflow-hidden"
                                    onFullscreen={() => handlePostClick(post)}
                                  />
                                )}
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {post.post_media.length > 1 && (
                          <>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                          </>
                        )}
                      </Carousel>
                      {/* Indicator dots */}
                      <div className="flex justify-center mt-2 space-x-1">
                        {post.post_media.map((_, index) => (
                          <div
                            key={index}
                            className="w-2 h-2 rounded-full bg-muted-foreground/30"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {post.post_media[0].media_type === 'image' ? (
                        <img
                          src={post.post_media[0].media_url}
                          alt="Post content"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <VideoPreview
                          src={post.post_media[0].media_url}
                          className="w-full h-48 rounded-lg overflow-hidden"
                          onFullscreen={() => handlePostClick(post)}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t" onClick={(e) => e.stopPropagation()}>
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

      <PostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        post={selectedPost}
        isOwnPost={isOwnProfile}
      />
    </>
  );
};

export default SocialActivity;
