
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityPost } from '../types/ActivityTypes';

export const useActivityPosts = (userId?: string) => {
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Fetching posts for userId
    setLoading(true);

    try {
      // Get posts with media and tags using direct query
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
            media_url,
            filter_id,
            studio_edits
          ),
          post_tags (
            id,
            tagged_entity_id,
            start_index,
            end_index,
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
        console.error('ActivityPosts - Error with posts query:', error);
        setPosts([]);
        setLoading(false);
        return;
      }

      // Debug logging removed for performance

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Post tags are now included in the posts query above as nested data

      // Post tags logging removed for performance

      // Get user profile for the posts
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('ActivityPosts - Error fetching user profile:', profileError);
      }

      const formattedPosts = postsData
        .filter(post => {
          // Filter out empty posts with no content and no media
          const hasContent = post.content && post.content.trim().length > 0;
          const hasMedia = post.post_media && post.post_media.length > 0;
          return hasContent || hasMedia;
        })
        .map(post => {
        const tags = post.post_tags?.map((tag: any) => ({
          id: tag.id,
          post_id: post.id,
          tagged_entity_id: tag.tagged_entity_id,
          entity_type: tag.taggable_entities?.entity_type,
          entity_id: tag.taggable_entities?.entity_id,
          name: tag.taggable_entities?.name,
          username: tag.taggable_entities?.username,
          tagged_entity: tag.taggable_entities
        })) || [];
        
        // Post processing logging removed for performance
        
        return {
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
            media_url: media.media_url,
            filter_id: media.filter_id,
            studio_edits: media.studio_edits
          })),
          post_tags: tags,
          user: {
            id: userId,
            display_name: userProfile?.display_name || null,
            username: userProfile?.username || null,
            profile_photo_url: userProfile?.profile_photo_url || null
          },
          image: post.post_media?.find(media => media.media_type === 'image')?.media_url
        };
      });

      // Final posts count logging removed for performance
      setPosts(formattedPosts);
    } catch (error) {
      console.error('ActivityPosts - Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  // Listen for post updates
  useEffect(() => {
    const handlePostCompleted = () => {
      setTimeout(() => {
        fetchUserPosts();
      }, 1000);
    };

    window.addEventListener('postCompleted', handlePostCompleted);
    
    return () => {
      window.removeEventListener('postCompleted', handlePostCompleted);
    };
  }, [fetchUserPosts]);

  return { posts, loading, fetchUserPosts };
};
