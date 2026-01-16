import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CourseVideo {
  id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  post_id: string;
  displayName?: string;
  post_created_at?: string;
}

export const useCourseVideos = (courseId: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['course-videos', courseId],
    queryFn: async (): Promise<CourseVideo[]> => {
      if (!courseId) return [];

      // First, get the taggable entity ID for this course
      const { data: taggableEntity, error: entityError } = await supabase
        .from('taggable_entities')
        .select('id')
        .eq('entity_type', 'golf_club')
        .eq('entity_id', courseId)
        .single();

      if (entityError || !taggableEntity) {
        return [];
      }

      // First get post IDs that are tagged with this course
      const { data: taggedPosts, error: tagError } = await supabase
        .from('post_tags')
        .select('post_id')
        .eq('tagged_entity_id', taggableEntity.id);

      if (tagError || !taggedPosts || taggedPosts.length === 0) {
        return [];
      }

      const postIds = taggedPosts.map(tag => tag.post_id);

      // Then find video media for those posts with user information
      const { data: videos, error } = await supabase
        .from('post_media')
        .select(`
          id,
          media_url,
          media_type,
          created_at,
          post_id,
          posts(
            created_at,
            user_id
          )
        `)
        .eq('media_type', 'video')
        .in('post_id', postIds)
        .order('created_at', { ascending: false })
        .limit(10); // Get up to 10 recent videos for the carousel

      if (error) {
        console.error('Error fetching course videos:', error);
        return [];
      }

      // Get user profiles for the posts
      const videoData = videos || [];
      const userIds = videoData.map(v => v.posts?.user_id).filter(Boolean);
      
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', userIds);

      // Transform the data to flatten the structure
      const transformedVideos = videoData.map(video => {
        const userProfile = userProfiles?.find(profile => profile.id === video.posts?.user_id);
        return {
          id: video.id,
          media_url: video.media_url,
          media_type: video.media_type,
          created_at: video.created_at,
          post_id: video.post_id,
          displayName: userProfile?.display_name || 'Golfer',
          post_created_at: video.posts?.created_at,
        };
      });

      return transformedVideos as CourseVideo[];
    },
    enabled: enabled && !!courseId,
    staleTime: 30 * 1000, // 30 seconds - refresh quickly to show new videos
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection time
    refetchOnWindowFocus: true, // Refetch when window gains focus to get latest videos
  });
};