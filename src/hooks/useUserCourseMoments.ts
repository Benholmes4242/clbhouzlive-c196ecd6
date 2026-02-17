/**
 * useUserCourseMoments - Hook to fetch user's posts/media at a specific course
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

export interface CourseMoment {
  id: string;
  type: 'post' | 'review_media';
  mediaUrl: string;
  mediaType: 'image' | 'video';
  posterUrl?: string;
  createdAt: string;
  caption?: string;
}

export function useUserCourseMoments(courseId: string | undefined) {
  const { user } = useSupabaseSession();

  return useQuery({
    queryKey: ['user-course-moments', courseId, user?.id],
    enabled: !!courseId && !!user?.id,
    queryFn: async (): Promise<CourseMoment[]> => {
      if (!courseId || !user?.id) return [];

      const moments: CourseMoment[] = [];

      // Get review media for this course
      const { data: reviewMedia } = await supabase
        .from('course_review_media')
        .select(`
          id,
          media_url,
          media_type,
          poster_url,
          created_at,
          review:course_ratings!inner(user_id, review)
        `)
        .eq('review.user_id', user.id);

      // Filter by course_id through the rating relationship
      const { data: userRatings } = await supabase
        .from('course_ratings')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id);

      const ratingIds = new Set(userRatings?.map(r => r.id) ?? []);

      // Get media for those ratings
      const { data: courseMedia } = await supabase
        .from('course_review_media')
        .select('id, media_url, media_type, poster_url, created_at, review_id')
        .in('review_id', Array.from(ratingIds));

      courseMedia?.forEach(media => {
        moments.push({
          id: media.id,
          type: 'review_media',
          mediaUrl: media.media_url,
          mediaType: media.media_type === 'video' ? 'video' : 'image',
          posterUrl: media.poster_url ?? undefined,
          createdAt: media.created_at,
        });
      });

      // Sort by date, newest first
      return moments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}
