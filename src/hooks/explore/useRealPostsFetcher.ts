
import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem } from '@/components/explore/types';
import { isValidImageUrl } from './urlValidation';

export const useRealPostsFetcher = () => {
  const fetchRealPosts = async (currentOffset: number, postsPerPage: number): Promise<ExploreContentItem[]> => {
    try {
      console.log('Fetching real posts from offset:', currentOffset);
      
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
        .range(currentOffset, currentOffset + postsPerPage - 1);

      if (error) {
        console.error('Error fetching posts:', error);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        console.log('No posts data returned');
        return [];
      }

      console.log('Raw posts data:', postsData);

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

      console.log('User profiles:', profiles);

      // Get golf course data for tagged courses
      const golfCourseIds = postsData
        .flatMap(post => post.post_tags || [])
        .filter(tag => tag.taggable_entities?.entity_type === 'golf_club')
        .map(tag => tag.taggable_entities?.entity_id)
        .filter(Boolean);

      console.log('Golf course IDs found:', golfCourseIds);
      console.log('Post tags data:', postsData.map(p => ({ id: p.id, tags: p.post_tags })));

      let golfCourses: any[] = [];
      if (golfCourseIds.length > 0) {
        const { data: coursesData } = await supabase
          .from('golf_courses')
          .select('id, name, country')
          .in('id', golfCourseIds);
        
        golfCourses = coursesData || [];
        console.log('Golf courses data:', golfCourses);
      }

      // Format posts for explore grid
      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const media = (post.post_media || [])[0]; // Take first media item
        
        console.log('Processing post:', {
          postId: post.id,
          mediaUrl: media?.media_url,
          mediaType: media?.media_type,
          hasValidUrl: media ? isValidImageUrl(media.media_url) : false
        });
        
        if (!media || !isValidImageUrl(media.media_url)) {
          console.log('Skipping post due to invalid media:', post.id);
          return null;
        }

        // Find golf course tag
        const golfCourseTag = post.post_tags?.find(tag => 
          tag.taggable_entities?.entity_type === 'golf_club'
        );
        
        let golfCourse = null;
        if (golfCourseTag?.taggable_entities?.entity_id) {
          const course = golfCourses.find(c => c.id === golfCourseTag.taggable_entities.entity_id);
          if (course) {
            golfCourse = {
              id: course.id,
              name: course.name,
              country: course.country
            };
            console.log('Found golf course for post:', post.id, golfCourse);
          }
        }

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

        console.log('Formatted post:', formattedPost);
        return formattedPost;
      }).filter(Boolean) as ExploreContentItem[];

      console.log('Final formatted posts:', formattedPosts);
      return formattedPosts;
    } catch (error) {
      console.error('Error fetching real posts:', error);
      return [];
    }
  };

  return { fetchRealPosts };
};
