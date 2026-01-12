
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  filter_id?: string | null;
  studio_edits?: any | null;
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
  badges?: string[];
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
      // Build visibility filter for privacy enforcement
      const visibilityFilter = buildVisibilityFilter(user.id);
      
      // Fetch only recent posts for faster loading
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          actor_type,
          badges
        `)
        .or('actor_type.eq.personal,actor_type.is.null') // Exclude business posts
        .or(visibilityFilter) // Apply visibility filter
        .eq('status', 'published') // Only show published posts
        .order('created_at', { ascending: false })
        .limit(10); // Limit initial load for performance

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      console.log('Raw posts data:', postsData);

      if (!postsData || postsData.length === 0) {
        console.log('No posts found');
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get user profiles and media in parallel for faster loading
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      const postIds = postsData.map(p => p.id);
      
      const [profilesResponse, mediaResponse] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', userIds),
        supabase
          .from('post_media')
          .select('id, media_type, media_url, post_id, filter_id, studio_edits')
          .in('post_id', postIds)
      ]);

      if (profilesResponse.error) {
        console.error('Error fetching profiles:', profilesResponse.error);
        return;
      }

      const profiles = profilesResponse.data;
      const postMedia = mediaResponse.data;

      // Tags temporarily disabled due to missing database tables
      const postTags = [];

      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const media = postMedia?.filter(m => m.post_id === post.id) || [];
        const tags = postTags?.filter((t: any) => t.post_id === post.id).map((tag: any) => ({
          id: tag.taggable_entities?.id || tag.tagged_entity_id,
          entity_type: tag.taggable_entities?.entity_type || 'user',
          entity_id: tag.taggable_entities?.entity_id || tag.tagged_entity_id,
          name: tag.taggable_entities?.name || 'Unknown',
          username: tag.taggable_entities?.username || null
        })) || [];
        
        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          badges: post.badges || [],
          user: {
            id: post.user_id,
            display_name: userProfile?.display_name || null,
            username: userProfile?.username || null,
            profile_photo_url: userProfile?.profile_photo_url || null
          },
          post_media: media.map(m => ({
            id: m.id,
            media_type: m.media_type as 'image' | 'video',
            media_url: m.media_url,
            filter_id: m.filter_id,
            studio_edits: m.studio_edits
          })),
          post_tags: tags
        };
      });

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  // Listen for post creation events
  useEffect(() => {
    const handlePostCompleted = () => {
      console.log('Post completed event received, refetching posts');
      setTimeout(() => {
        fetchPosts();
      }, 1000); // Small delay to ensure database is updated
    };

    window.addEventListener('postCompleted', handlePostCompleted);
    
    return () => {
      window.removeEventListener('postCompleted', handlePostCompleted);
    };
  }, []);

  return {
    posts,
    loading,
    refetch: fetchPosts
  };
};
