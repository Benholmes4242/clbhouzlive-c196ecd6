
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExplorePost {
  id: string;
  type: 'video' | 'image';
  src: string;
  title: string;
  likes: number;
  user?: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
  };
  label?: string;
  isFollowing?: boolean;
  golfCourse?: {
    id: string;
    name: string;
    country: string;
  };
}

export const useExploreContent = () => {
  const [content, setContent] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExploreContent = async () => {
    setLoading(true);
    try {
      // Fetch posts with media and tags from all users
      const { data: postsData, error } = await supabase
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
            taggable_entities!inner (
              id,
              entity_type,
              entity_id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setContent([]);
        return;
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
        return;
      }

      // Get golf course data for tagged courses
      const golfCourseIds = postsData
        .flatMap(post => post.post_tags || [])
        .filter(tag => tag.taggable_entities?.entity_type === 'golf_club')
        .map(tag => tag.taggable_entities?.entity_id)
        .filter(Boolean);

      let golfCourses: any[] = [];
      if (golfCourseIds.length > 0) {
        const { data: coursesData } = await supabase
          .from('golf_courses')
          .select('id, name, country')
          .in('id', golfCourseIds);
        
        golfCourses = coursesData || [];
      }

      // Format posts for explore grid
      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const media = (post.post_media || [])[0]; // Take first media item
        
        if (!media) return null;

        // Golf course tags temporarily disabled
        const golfCourseTag = null;
        
        let golfCourse = null;
        if (golfCourseTag?.taggable_entities?.entity_id) {
          const course = golfCourses.find(c => c.id === golfCourseTag.taggable_entities.entity_id);
          if (course) {
            golfCourse = {
              id: course.id,
              name: course.name,
              country: course.country
            };
          }
        }

        return {
          id: post.id,
          type: media.media_type as 'video' | 'image',
          src: media.media_url,
          title: post.content || 'Post',
          likes: Math.floor(Math.random() * 100), // Placeholder until we have actual likes
          user: {
            id: post.user_id,
            name: userProfile?.display_name || userProfile?.username || 'User',
            avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            verified: false // Placeholder
          },
          golfCourse,
          isFollowing: false // Placeholder
        };
      }).filter(Boolean) as ExplorePost[];

      setContent(formattedPosts);

    } catch (error) {
      console.error('Error fetching explore content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExploreContent();
  }, []);

  return {
    content,
    loading,
    refetch: fetchExploreContent
  };
};

// Note: This hook uses manual state management rather than React Query.
// If converting to useQuery in the future, use these cache settings:
// staleTime: 2 * 60 * 1000,   // 2 min – feed data
// gcTime:   5 * 60 * 1000,   // 5 min – limits memory
// refetchOnWindowFocus: false,
