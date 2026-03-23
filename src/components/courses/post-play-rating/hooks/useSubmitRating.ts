import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';
import type { Course, ExistingMedia } from '../types';
import type { ReviewVideoDraft } from '@/hooks/useReviewVideoUpload';

interface SubmitRatingPayload {
  rating: number;
  reviewText: string;
  imageFiles: File[];
  design: number | null;
  condition: number | null;
  clubhouse: number | null;
  facilities: number | null;
}

interface UseSubmitRatingOptions {
  course: Course | null;
  isEditMode: boolean;
  existingRating?: any;
  videoDrafts: ReviewVideoDraft[];
  attachToReview: (ratingId: string) => Promise<any>;
  resetVideoDrafts: () => void;
  onOptimisticUpdate: (rating: number) => Promise<any>;
  onRollback: (context: any) => void;
  scheduleBackgroundSync: (courseId: string, delay: number) => void;
  onSuccess: (ratingId: string) => void;
  onError: () => void;
}

export function useSubmitRating({
  course,
  isEditMode,
  existingRating,
  videoDrafts,
  attachToReview,
  resetVideoDrafts,
  onOptimisticUpdate,
  onRollback,
  scheduleBackgroundSync,
  onSuccess,
  onError,
}: UseSubmitRatingOptions) {
  
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (payload: SubmitRatingPayload) => {
      const { rating, reviewText, imageFiles, design, condition, clubhouse, facilities } = payload;
      
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user || !course) throw new Error('Not authenticated or no course');

      let ratingId: string;

      if (isEditMode && existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('course_ratings')
          .update({
            rating,
            review: reviewText || null,
            design_score: design,
            condition_score: condition,
            clubhouse_score: clubhouse,
            facilities_score: facilities,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRating.id);
        
        if (error) throw error;
        ratingId = existingRating.id;
      } else {
        // Create new rating
        const { data: newRating, error } = await supabase
          .from('course_ratings')
          .insert({
            course_id: course.id,
            user_id: userResponse.user.id,
            rating,
            review: reviewText || null,
            design_score: design,
            condition_score: condition,
            clubhouse_score: clubhouse,
            facilities_score: facilities
          })
          .select()
          .single();
        
        if (error) throw error;
        ratingId = newRating.id;
      }

      // Upload IMAGE files only - videos are already uploaded via upload-on-select
      if (imageFiles.length > 0) {
        const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
        
        const uploadPromises = imageFiles.map(async (file) => {
          const fileName = `${userResponse.user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
          const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-review-images', fileName);
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || `Failed to upload ${file.name}`);
          }

          const { error: mediaError } = await supabase
            .from('course_review_media')
            .insert({
              review_id: ratingId,
              media_url: uploadResult.publicUrl,
              media_type: 'image',
              file_name: file.name,
              file_size: file.size,
              status: 'attached',
              owner_user_id: userResponse.user.id,
            });

          if (mediaError) throw mediaError;
        });

        await Promise.all(uploadPromises);
      }
      
      return ratingId;
    },
    onMutate: async (variables) => {
      if (!course?.id) return undefined;
      return await onOptimisticUpdate(variables.rating);
    },
    onSuccess: async (ratingId: string, variables) => {
      // Attach pending videos to the review (if any ready)
      try {
        if (videoDrafts.some(d => d.status === 'ready')) {
          await attachToReview(ratingId);
        }
      } catch (attachError) {
        // Non-blocking - rating succeeded, videos will be orphaned but cleaned up by TTL
      } finally {
        resetVideoDrafts();
      }
      
      // Get userId for proper query invalidation
      const { data: userResponse } = await supabase.auth.getUser();
      const userId = userResponse?.user?.id;

      const isNewReview = !isEditMode;

      // Track submission success
      analyticsEvents.ratings.submitted({
        courseId: course?.id || '',
        courseName: course?.name || '',
        isNewReview,
        overallRating: variables.rating,
        design: variables.design ?? undefined,
        condition: variables.condition ?? undefined,
        clubhouse: variables.clubhouse ?? undefined,
        facilities: variables.facilities ?? undefined,
      });

      // Invalidate all related queries via shared helper
      invalidateCourseRatingCaches(queryClient);

      // Force immediate refetch of active profile queries
      await queryClient.refetchQueries({ queryKey: ['userTop100Courses'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['user-played-courses-full'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['user-top-ten-courses'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['course-reviews-full'], type: 'all' });

      // Remove from want_to_play shortlist (if present) now that course is played
      if (isNewReview) {
        try {
          if (userId && course?.id) {
            await supabase
              .from('course_shortlists')
              .delete()
              .eq('user_id', userId)
              .eq('course_id', course.id)
              .eq('list_key', 'want_to_play');
          }
        } catch (shortlistError) {
          console.error('[Rating] Shortlist cleanup failed but rating succeeded:', shortlistError);
        }

        // Update courses_logged_all_time since no DB trigger maintains it yet
        if (userId && course?.id) {
          try {
            const { data: currentProfile } = await supabase
              .from('user_profiles')
              .select('courses_logged_all_time')
              .eq('id', userId)
              .single();

            if (currentProfile) {
              await supabase
                .from('user_profiles')
                .update({
                  courses_logged_all_time: (currentProfile.courses_logged_all_time ?? 0) + 1
                })
                .eq('id', userId);
            }

            // Refetch userProfile to show updated count immediately
            await queryClient.refetchQueries({
              queryKey: ['userProfile', userId],
              type: 'active',
              exact: false
            });
          } catch (profileError) {
            console.error('[Rating] courses_logged_all_time update failed:', profileError);
          }
        }
      }

      onSuccess(ratingId);
    },
    onError: (error: any, variables, context) => {
      onRollback(context);
      console.error('[Rating Submission] Error:', error);
      
      const isNewReview = !isEditMode;

      analyticsEvents.ratings.submissionFailed({
        courseId: course?.id || '',
        courseName: course?.name || '',
        isNewReview,
        errorMessage: error?.message,
      });
      
      let errorMessage = "Failed to submit rating. Please try again.";
      
      if (error?.code === '23514') {
        errorMessage = "Rating validation failed. Please ensure all scores are between 0.5 and 10.0 with one decimal place.";
      }
      
      toast.error("Couldn't submit rating", { description: errorMessage });
      
      onError();
    },
    onSettled: () => {
      if (course?.id) {
        scheduleBackgroundSync(course.id, 10000);
      }
    },
  });

  return mutation;
}
