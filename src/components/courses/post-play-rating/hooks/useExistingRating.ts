import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExistingMedia } from '../types';

interface UseExistingRatingOptions {
  courseId: string | undefined;
  isEditMode: boolean;
  existingRatingProp?: any;
  onPopulate: (rating: any, media: ExistingMedia[]) => void;
}

export function useExistingRating({
  courseId,
  isEditMode,
  existingRatingProp,
  onPopulate,
}: UseExistingRatingOptions) {
  // Use passed existingRating or fetch internally as fallback
  const { data: existingRatingFetched, isLoading } = useQuery({
    queryKey: ['user-course-rating', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) return null;

      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', userResponse.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching existing rating:', error);
        return null;
      }
      
      return data;
    },
    enabled: isEditMode && !!courseId && !existingRatingProp,
  });

  const existingRating = existingRatingProp || existingRatingFetched;

  // Fetch existing media for a rating
  const fetchExistingMedia = async (ratingId: string): Promise<ExistingMedia[]> => {
    const { data: mediaData, error } = await supabase
      .from('course_review_media')
      .select('id, media_url, media_type, poster_url, stream_id')
      .eq('review_id', ratingId);
    
    if (!error && mediaData) {
      return mediaData;
    }
    return [];
  };

  return {
    existingRating,
    isLoading,
    fetchExistingMedia,
  };
}
