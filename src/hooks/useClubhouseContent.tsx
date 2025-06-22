
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClubhousePost {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    user_type: 'individual' | 'club' | 'pro_shop' | 'academy' | 'tour_event' | 'other' | null;
    business_name: string | null;
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

export const useClubhouseContent = () => {
  const [posts, setPosts] = useState<ClubhousePost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRandomContent = async () => {
    setLoading(true);
    try {
      // Fetch random posts from all users (both individuals and businesses)
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
        .order('created_at', { ascending: false })
        .limit(50); // Get more posts to shuffle from

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      // Get user profiles for all post authors
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, user_type, business_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Format posts with user data
      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        
        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          user: {
            id: post.user_id,
            display_name: userProfile?.display_name || null,
            username: userProfile?.username || null,
            profile_photo_url: userProfile?.profile_photo_url || null,
            user_type: userProfile?.user_type || null,
            business_name: userProfile?.business_name || null,
          },
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
          }))
        };
      });

      // Shuffle the posts for random display
      const shuffledPosts = formattedPosts.sort(() => Math.random() - 0.5);
      setPosts(shuffledPosts);

    } catch (error) {
      console.error('Error fetching clubhouse content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomContent();
  }, []);

  return {
    posts,
    loading,
    refetch: fetchRandomContent
  };
};
