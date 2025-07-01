
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
      console.log('Fetching posts for all users (not just current user)');
      
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

      console.log('Raw posts data:', postsData);

      if (!postsData || postsData.length === 0) {
        console.log('No posts found');
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get user profiles for all post authors
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      console.log('Fetching profiles for user IDs:', userIds);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      console.log('Fetched profiles:', profiles);

      // Get post tags with proper entity information - using a more direct approach
      const postIds = postsData.map(p => p.id);
      console.log('Fetching tags for post IDs:', postIds);
      
      const { data: postTagsRaw, error: tagsError } = await supabase
        .from('post_tags')
        .select(`
          post_id,
          tagged_entity_id
        `)
        .in('post_id', postIds);

      if (tagsError) {
        console.error('Error fetching post tags:', tagsError);
      }

      console.log('Raw post tags:', postTagsRaw);

      // Now get the taggable entities for these tags
      let postTags = [];
      if (postTagsRaw && postTagsRaw.length > 0) {
        const entityIds = postTagsRaw.map(tag => tag.tagged_entity_id);
        console.log('Fetching entities for IDs:', entityIds);
        
        const { data: entities, error: entitiesError } = await supabase
          .from('taggable_entities')
          .select('*')
          .in('id', entityIds);

        if (entitiesError) {
          console.error('Error fetching taggable entities:', entitiesError);
        } else {
          console.log('Fetched entities:', entities);
          
          // Map the tags with their entities
          postTags = postTagsRaw.map(tag => {
            const entity = entities?.find(e => e.id === tag.tagged_entity_id);
            if (entity) {
              return {
                post_id: tag.post_id,
                id: entity.id,
                entity_type: entity.entity_type,
                entity_id: entity.entity_id,
                name: entity.name,
                username: entity.username
              };
            }
            return null;
          }).filter(Boolean);
          
          console.log('Mapped post tags:', postTags);
        }
      }

      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const tags = postTags?.filter((t: any) => t.post_id === post.id) || [];
        
        const formattedPost = {
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
        
        console.log(`Post ${post.id} formatted:`, {
          id: formattedPost.id,
          user: formattedPost.user.display_name || formattedPost.user.username,
          mediaCount: formattedPost.post_media.length,
          tagCount: formattedPost.post_tags.length,
          tags: formattedPost.post_tags.map(t => t.name)
        });
        
        return formattedPost;
      });

      console.log('Final formatted posts:', formattedPosts.length, 'posts');
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
