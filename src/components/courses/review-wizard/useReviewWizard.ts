/**
 * Review Wizard State Management Hook
 * 
 * Migrated to use unified ReviewUploadManager for:
 * - Background upload processing
 * - Progress tracking with speed/ETA
 * - Retry logic with exponential backoff
 * - Non-blocking navigation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useReviewMediaUpload } from './useReviewMediaUpload';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { 
  WizardState, 
  ReviewWizardCourse, 
  ExistingRating, 
  ReviewMediaItem,
  ReviewBreakdowns 
} from './types';

interface UseReviewWizardOptions {
  course: ReviewWizardCourse | null;
  isEditMode: boolean;
  existingRating?: ExistingRating;
  onSuccess?: (ratingId: string) => void;
}

const INITIAL_BREAKDOWNS: ReviewBreakdowns = {
  design: null,
  condition: null,
  clubhouse: null,
  facilities: null,
};

const INITIAL_STATE: WizardState = {
  step: 1,
  rating: null,
  breakdowns: INITIAL_BREAKDOWNS,
  title: '',
  review: '',
  media: [],
  coverMediaId: null,
};

export function useReviewWizard({
  course,
  isEditMode,
  existingRating,
  onSuccess,
}: UseReviewWizardOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Track if submit completed successfully (to skip cleanup on close)
  const submitCompletedRef = useRef(false);
  
  // Current user ID for upload ownership
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Fetch current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Wizard state
  const [state, setState] = useState<WizardState>(() => {
    if (isEditMode && existingRating) {
      return {
        ...INITIAL_STATE,
        rating: existingRating.rating,
        breakdowns: {
          design: existingRating.design_score,
          condition: existingRating.condition_score,
          clubhouse: existingRating.clubhouse_score,
          facilities: existingRating.facilities_score,
        },
        title: existingRating.title || '',
        review: existingRating.review || '',
      };
    }
    return INITIAL_STATE;
  });

  // Unified media upload hook
  const mediaUpload = useReviewMediaUpload({
    userId: currentUserId,
    courseId: course?.id || '',
  });

  // Fetch existing media for edit mode
  const { data: existingMedia } = useQuery({
    queryKey: ['review-media', existingRating?.id],
    queryFn: async () => {
      if (!existingRating?.id) return [];
      const { data, error } = await supabase
        .from('course_review_media')
        .select('id, media_url, media_type, poster_url, stream_id, is_cover')
        .eq('review_id', existingRating.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: isEditMode && !!existingRating?.id,
  });

  // Initialize media state from existing media
  useEffect(() => {
    if (existingMedia && existingMedia.length > 0) {
      const mediaItems: ReviewMediaItem[] = existingMedia.map((m: any) => ({
        id: m.id,
        type: m.media_type as 'image' | 'video',
        previewUrl: m.poster_url || m.media_url,
        uploadedUrl: m.media_url,
        status: 'existing' as const,
        isCover: m.is_cover || false,
        dbRowId: m.id,
        streamId: m.stream_id,
        posterUrl: m.poster_url,
      }));
      
      setState(prev => ({
        ...prev,
        media: mediaItems,
        coverMediaId: mediaItems.find(m => m.isCover)?.id || mediaItems[0]?.id || null,
      }));
    }
  }, [existingMedia]);

  // Combine pending uploads with existing media for UI display
  const allMedia: ReviewMediaItem[] = [
    // Existing media from edit mode
    ...state.media.filter(m => m.status === 'existing'),
    // New uploads from unified manager
    ...mediaUpload.mediaItems.map(item => ({
      id: item.id,
      type: item.type,
      previewUrl: item.previewUrl,
      uploadedUrl: item.uploadedUrl,
      status: item.status as ReviewMediaItem['status'],
      isCover: state.coverMediaId === item.id,
      dbRowId: item.dbRowId ?? null,
      streamId: item.streamId,
      posterUrl: item.posterUrl,
      error: item.error,
      progress: item.progress,
    })),
  ];

  // Navigation
  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: Math.min(prev.step + 1, 4) as 1 | 2 | 3 | 4,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: Math.max(prev.step - 1, 1) as 1 | 2 | 3 | 4,
    }));
  }, []);

  // State updates - normalize to 1 decimal place for 0-10 scale
  const setRating = useCallback((rating: number) => {
    const normalizedRating = parseFloat(rating.toFixed(1));
    setState(prev => ({ ...prev, rating: normalizedRating }));
  }, []);

  // Handle breakdown changes - normalize to 1 decimal place for 0-10 scale
  const setBreakdown = useCallback((key: keyof ReviewBreakdowns, value: number | null) => {
    const normalizedValue = value !== null ? parseFloat(value.toFixed(1)) : null;
    setState(prev => ({
      ...prev,
      breakdowns: { ...prev.breakdowns, [key]: normalizedValue },
    }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setState(prev => ({ ...prev, title }));
  }, []);

  const setReview = useCallback((review: string) => {
    setState(prev => ({ ...prev, review }));
  }, []);

  const setCoverMedia = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, coverMediaId: id }));
  }, []);

  // Media handlers - now using unified upload system
  const addImages = useCallback(async (files: File[]) => {
    for (const file of files) {
      mediaUpload.addImage(file);
    }
    
    // Auto-set first media as cover if none set
    if (!state.coverMediaId && allMedia.length === 0 && files.length > 0) {
      // Will be set after first upload starts
      const uploads = mediaUpload.uploads;
      if (uploads.length > 0) {
        setState(prev => ({ ...prev, coverMediaId: uploads[0].id }));
      }
    }
  }, [mediaUpload, state.coverMediaId, allMedia.length]);

  const addVideo = useCallback(async (file: File) => {
    mediaUpload.addVideo(file);
    
    // Auto-set first media as cover if none set
    if (!state.coverMediaId && allMedia.length === 0) {
      const uploads = mediaUpload.uploads;
      if (uploads.length > 0) {
        setState(prev => ({ ...prev, coverMediaId: uploads[0].id }));
      }
    }
  }, [mediaUpload, state.coverMediaId, allMedia.length]);

  const removeMedia = useCallback(async (id: string) => {
    // Check if it's existing media
    const existingItem = state.media.find(m => m.id === id && m.status === 'existing');
    if (existingItem && existingItem.dbRowId) {
      // Delete from database
      await supabase.from('course_review_media').delete().eq('id', existingItem.dbRowId);
      setState(prev => ({
        ...prev,
        media: prev.media.filter(m => m.id !== id),
        coverMediaId: prev.coverMediaId === id ? null : prev.coverMediaId,
      }));
      return;
    }

    // Remove from unified upload manager
    await mediaUpload.removeUpload(id);
    if (state.coverMediaId === id) {
      setState(prev => ({ ...prev, coverMediaId: null }));
    }
  }, [state.media, state.coverMediaId, mediaUpload]);

  // Retry failed upload
  const retryMedia = useCallback((id: string) => {
    mediaUpload.retryUpload(id);
  }, [mediaUpload]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!course || !state.rating || !currentUserId) {
        throw new Error('Missing required data');
      }

      let ratingId: string;

      if (isEditMode && existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('course_ratings')
          .update({
            rating: state.rating,
            title: state.title || null,
            review: state.review || null,
            design_score: state.breakdowns.design,
            condition_score: state.breakdowns.condition,
            clubhouse_score: state.breakdowns.clubhouse,
            facilities_score: state.breakdowns.facilities,
          } as any)
          .eq('id', existingRating.id);
        
        if (error) throw error;
        ratingId = existingRating.id;
      } else {
        // Create new rating
        const { data: newRating, error } = await supabase
          .from('course_ratings')
          .insert({
            course_id: course.id,
            user_id: currentUserId,
            rating: state.rating,
            title: state.title || null,
            review: state.review || null,
            design_score: state.breakdowns.design,
            condition_score: state.breakdowns.condition,
            clubhouse_score: state.breakdowns.clubhouse,
            facilities_score: state.breakdowns.facilities,
          } as any)
          .select()
          .single();
        
        if (error) throw error;
        ratingId = newRating.id;
      }

      // Attach pending uploads to review
      // This attaches completed uploads and marks pending ones with the reviewId
      // Pending uploads will continue in the background and auto-attach when complete
      const result = await mediaUpload.attachToReview(ratingId);
      
      // Show appropriate toast based on upload status
      if (result.pending > 0) {
        toast({
          title: 'Review submitted!',
          description: `Your review is saved. ${result.pending} ${result.pending === 1 ? 'file is' : 'files are'} uploading in the background and will appear shortly.`,
        });
      } else if (result.failed > 0 && result.attached === 0) {
        toast({
          title: 'Review submitted',
          description: 'Some media failed to upload. You can retry from your profile.',
          variant: 'destructive',
        });
      } else if (result.failed > 0) {
        toast({
          title: 'Review submitted!',
          description: `${result.attached} ${result.attached === 1 ? 'file' : 'files'} uploaded. ${result.failed} failed and can be retried.`,
        });
      }

      // Update cover selection
      if (state.coverMediaId) {
        // First reset all covers for this review
        await supabase
          .from('course_review_media')
          .update({ is_cover: false } as any)
          .eq('review_id', ratingId);

        // Find the dbRowId for the cover
        const coverUpload = mediaUpload.uploads.find(u => u.id === state.coverMediaId);
        const coverExisting = state.media.find(m => m.id === state.coverMediaId);
        
        const coverDbRowId = coverUpload?.dbRowId || coverExisting?.dbRowId;
        
        if (coverDbRowId) {
          await supabase
            .from('course_review_media')
            .update({ is_cover: true } as any)
            .eq('id', coverDbRowId);
        }
      }

      return ratingId;
    },
    onSuccess: (ratingId) => {
      submitCompletedRef.current = true;
      
      // Track analytics
      analyticsEvents.ratings.submitted({
        courseId: course?.id || '',
        courseName: course?.name || '',
        isNewReview: !isEditMode,
        overallRating: state.rating || 0,
        design: state.breakdowns.design || undefined,
        condition: state.breakdowns.condition || undefined,
        clubhouse: state.breakdowns.clubhouse || undefined,
        facilities: state.breakdowns.facilities || undefined,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['course-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating'] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses'] });

      onSuccess?.(ratingId);
    },
    onError: (error) => {
      console.error('[ReviewWizard] Submit error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your review. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation for removing existing reviews
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingRating?.id) {
        throw new Error('No existing rating to delete');
      }

      const reviewId = existingRating.id;

      // 1. First, fetch ALL media attached to this review for cleanup
      // We must do this BEFORE deleting the review since cascade will remove the rows
      const { data: allMedia } = await supabase
        .from('course_review_media')
        .select('id, media_url, media_type, stream_id')
        .eq('review_id', reviewId);

      // 2. Delete any shared posts linked to this review
      // (FK is SET NULL, so we need to explicitly delete to remove from feeds)
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('source_review_id', reviewId);

      if (postsError) {
        console.warn('[ReviewWizard] Failed to delete shared posts:', postsError);
        // Continue anyway - the review deletion is more important
      }

      // 3. Delete the rating - cascade will handle course_review_media and votes
      const { error } = await supabase
        .from('course_ratings')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      // 4. Cleanup external storage (Cloudflare Stream + R2) - fire and forget
      if (allMedia && allMedia.length > 0) {
        const mediaItems = allMedia.map(m => ({
          id: m.id,
          media_url: m.media_url,
          media_type: m.media_type as 'image' | 'video',
          stream_id: m.stream_id,
        }));

        // Call the cleanup edge function asynchronously
        supabase.functions.invoke('cleanup-review-media', {
          body: { mediaItems },
        }).catch(err => {
          console.warn('[ReviewWizard] Failed to cleanup media:', err);
          // Non-blocking - cleanup can be handled by scheduled job
        });
      }

      return reviewId;
    },
    onSuccess: () => {
      // Invalidate all relevant queries including feeds
      queryClient.invalidateQueries({ queryKey: ['course-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating'] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses'] });
      queryClient.invalidateQueries({ queryKey: ['review-media'] });
      // Feed queries for shared posts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-feed'] });
      queryClient.invalidateQueries({ queryKey: ['clubhouse-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error) => {
      console.error('[ReviewWizard] Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove your review. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Cleanup on unmount - only cancel if NOT submitted
  // If submitted, uploads should continue in background
  const cleanup = useCallback(async () => {
    if (!submitCompletedRef.current) {
      await mediaUpload.cancelSession();
    }
    // Don't cancel if submitted - let uploads continue in background
  }, [mediaUpload]);

  // Check if can proceed to next step
  const canProceed = state.step === 1 ? state.rating !== null : true;
  
  // Check if any uploads are in progress
  const hasUploadsInProgress = mediaUpload.hasUploadsInProgress;

  return {
    state,
    allMedia,
    canProceed,
    hasUploadsInProgress,
    isSubmitting: submitMutation.isPending,
    isDeleting: deleteMutation.isPending,
    submittedRatingId: submitMutation.data,
    uploadStatus: mediaUpload.status,
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    
    // State updates
    setRating,
    setBreakdown,
    setTitle,
    setReview,
    setCoverMedia,
    
    // Media
    addImages,
    addVideo,
    removeMedia,
    retryMedia,
    
    // Actions
    submit: submitMutation.mutate,
    deleteReview: deleteMutation.mutateAsync,
    cleanup,
    reset: () => {
      setState(INITIAL_STATE);
      submitCompletedRef.current = false;
    },
  };
}
