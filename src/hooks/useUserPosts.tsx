
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface PostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface UserPostData {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: PostMedia[];
  post_tags: PostTag[];
}

export const useUserPosts = () => {
  const { user } = useSupabaseSession();
  const [posts, setPosts] = useState<UserPostData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

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
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get user profiles for all post authors
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get post tags with proper entity information
      let postTags = [];
      try {
        const { data: tags, error: tagsError } = await supabase
          .from('post_tags')
          .select(`
            post_id,
            tagged_entity_id,
            taggable_entities (
              id,
              entity_type,
              entity_id,
              name,
              username
            )
          `)
          .in('post_id', postsData.map(p => p.id));

        if (tagsError) {
          console.error('Error fetching post tags:', tagsError);
        } else {
          postTags = tags || [];
          console.log('User posts - Fetched post tags:', postTags.length);
        }
      } catch (error) {
        console.error('Failed to fetch post tags:', error);
      }

      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const tags = postTags?.filter((t: any) => t.post_id === post.id).map((tag: any) => {
          // Handle the case where taggable_entities might be null
          if (!tag.taggable_entities) {
            console.warn('Missing taggable_entities for tag:', tag.tagged_entity_id);
            return null;
          }
          return {
            id: tag.taggable_entities.id,
            entity_type: tag.taggable_entities.entity_type,
            entity_id: tag.taggable_entities.entity_id,
            name: tag.taggable_entities.name,
            username: tag.taggable_entities.username
          };
        }).filter(Boolean) || []; // Filter out null entries
        
        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          user: {
            id: post.user_id,
            display_name: userProfile?.display_name || null,
            username: userProfile?.username || null,
            profile_photo_url: userProfile?.profile_photo_url || null
          },
          post_media: (post.post_media || []).map(media => ({
            id: media.id,
            media_type: media.media_type as 'image' | 'video',
            media_url: media.media_url
          })),
          post_tags: tags
        };
      });

      console.log('User posts formatted with tags:', formattedPosts.length, 'posts');
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  return {
    posts,
    loading,
    refetch: fetchPosts
  };
};
