import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem } from '@/components/explore/types';
import { isValidImageUrl } from './urlValidation';

export const useRealPostsFetcher = () => {
  const fetchRealPosts = async (currentOffset: number, postsPerPage: number, mediaFilter?: string): Promise<ExploreContentItem[]> => {
    try {
      // Build the query
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner (
            id,
            media_type,
            media_url
          ),
          post_tags (
            id,
            tagged_entity_id,
            taggable_entities (
              id,
              entity_type,
              entity_id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + postsPerPage - 1)
        .limit(postsPerPage);

      // Add media type filter if specified
      if (mediaFilter === 'Videos') {
        query = query.eq('post_media.media_type', 'video');
      }

      const { data: postsData, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Format posts for explore grid
      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const media = (post.post_media || [])[0]; // Take first media item
        
        if (!media || !isValidImageUrl(media.media_url)) {
          return null;
        }

        // Find golf course from post tags
        const golfCourseTag = (post.post_tags || []).find(
          tag => tag.taggable_entities?.entity_type === 'golf_club'
        );

        const golfCourse = golfCourseTag?.taggable_entities ? {
          id: golfCourseTag.taggable_entities.entity_id,
          name: golfCourseTag.taggable_entities.name,
          country: 'Unknown' // We don't have country in taggable_entities
        } : null;

        const formattedPost = {
          id: post.id,
          type: media.media_type as 'video' | 'image',
          src: media.media_url,
          title: post.content || 'Post',
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 5,
          shares: Math.floor(Math.random() * 50) + 1,
          duration: media.media_type === 'video' ? `${Math.floor(Math.random() * 180) + 30}s` : undefined,
          user: {
            id: post.user_id,
            name: userProfile?.display_name || userProfile?.username || 'User',
            username: userProfile?.username,
            avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            verified: Math.random() > 0.7 // Random verification for demo
          },
          golfCourse,
          label: Math.random() > 0.6 ? ['Pro Tip', 'Trending', 'From Clubhouse'][Math.floor(Math.random() * 3)] : undefined,
          isFollowing: Math.random() > 0.5
        };

        return formattedPost;
      }).filter(Boolean) as ExploreContentItem[];

      return formattedPosts;
    } catch (error) {
      console.error('Error fetching real posts:', error);
      return [];
    }
  };

  return { fetchRealPosts };
};