
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityPost } from '../types/ActivityTypes';

export const useActivityPosts = (userId?: string) => {
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    console.log('Fetching posts for userId:', userId);
    setLoading(true);

    try {
      // Fetch posts without RLS restrictions that might prevent business accounts from viewing
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
        setPosts([]);
        return;
      }

      console.log('Raw posts data:', postsData);

      // Get user profile for the posts
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      console.log('User profile:', userProfile);

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
          id: tag.taggable_entities?.id || '',
          entity_type: tag.taggable_entities?.entity_type as 'user' | 'golf_club' | 'business' || 'user',
          entity_id: tag.taggable_entities?.entity_id || '',
          name: tag.taggable_entities?.name || '',
          username: tag.taggable_entities?.username || null
        })),
        user: {
          id: userId,
          display_name: userProfile?.display_name || null,
          username: userProfile?.username || null,
          profile_photo_url: userProfile?.profile_photo_url || null
        },
        image: post.post_media?.find(media => media.media_type === 'image')?.media_url
      }));

      console.log('Formatted posts:', formattedPosts);
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [userId]);

  return { posts, loading, fetchUserPosts };
};
