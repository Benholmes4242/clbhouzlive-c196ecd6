import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CourseVideo {
  id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  post_id: string;
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
        console.log('No taggable entity found for course:', courseId);
        return [];
      }

      // First get post IDs that are tagged with this course
      const { data: taggedPosts, error: tagError } = await supabase
        .from('post_tags')
        .select('post_id')
        .eq('tagged_entity_id', taggableEntity.id);

      if (tagError || !taggedPosts || taggedPosts.length === 0) {
        console.log('No posts tagged with this course:', courseId);
        return [];
      }

      const postIds = taggedPosts.map(tag => tag.post_id);

      // Then find video media for those posts
      const { data: videos, error } = await supabase
        .from('post_media')
        .select(`
          id,
          media_url,
          media_type,
          created_at,
          post_id
        `)
        .eq('media_type', 'video')
        .in('post_id', postIds)
        .order('created_at', { ascending: false })
        .limit(1); // Get only the most recent video

      if (error) {
        console.error('Error fetching course videos:', error);
        return [];
      }

      return (videos || []) as CourseVideo[];
    },
    enabled: enabled && !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};