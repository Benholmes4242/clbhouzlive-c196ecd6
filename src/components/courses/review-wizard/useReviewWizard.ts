/**
 * Review Wizard State Management Hook
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useReviewImageUpload } from '@/hooks/useReviewImageUpload';
import { useReviewVideoUpload } from '@/hooks/useReviewVideoUpload';
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
  addToTop10: false,
  top10Position: null,
};

export function useReviewWizard({
  course,
  isEditMode,
  existingRating,
  onSuccess,
}: UseReviewWizardOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Upload session ID - stable for the life of this wizard instance
  const uploadSessionIdRef = useRef(crypto.randomUUID());
  const uploadSessionId = uploadSessionIdRef.current;
  
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

  // Image upload hook
  const imageUpload = useReviewImageUpload({
    uploadSessionId,
    userId: currentUserId,
    onError: (msg) => toast({ title: 'Image Upload Error', description: msg, variant: 'destructive' }),
  });

  // Video upload hook
  const videoUpload = useReviewVideoUpload({
    uploadSessionId,
    userId: currentUserId,
    onError: (msg) => toast({ title: 'Video Upload Error', description: msg, variant: 'destructive' }),
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

  // Combine pending uploads with existing media
  const allMedia: ReviewMediaItem[] = [
    ...state.media.filter(m => m.status === 'existing'),
    ...imageUpload.imageDrafts.map(d => ({
      id: d.fileKey,
      type: 'image' as const,
      previewUrl: d.previewUrl,
      uploadedUrl: d.uploadedUrl,
      status: d.status === 'ready' ? 'ready' as const : d.status === 'uploading' ? 'uploading' as const : 'failed' as const,
      isCover: state.coverMediaId === d.fileKey,
      dbRowId: d.dbRowId,
    })),
    ...videoUpload.videoDrafts.map(d => ({
      id: d.fileKey,
      type: 'video' as const,
      previewUrl: d.posterUrl || '',
      uploadedUrl: d.streamId ? `https://customer-${d.streamId}.cloudflarestream.com/${d.streamId}/manifest/video.m3u8` : null,
      status: d.status === 'ready' ? 'ready' as const : d.status === 'uploading' ? 'uploading' as const : 'failed' as const,
      isCover: state.coverMediaId === d.fileKey,
      dbRowId: d.dbRowId,
      streamId: d.streamId,
      posterUrl: d.posterUrl,
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

  const setTop10Option = useCallback((add: boolean, position: number | null) => {
    setState(prev => ({ ...prev, addToTop10: add, top10Position: position }));
  }, []);

  // Media handlers
  const addImages = useCallback(async (files: File[]) => {
    for (const file of files) {
      const draft = await imageUpload.uploadImage(file);
      // Auto-set first media as cover if none set
      if (draft && !state.coverMediaId && allMedia.length === 0) {
        setState(prev => ({ ...prev, coverMediaId: draft.fileKey }));
      }
    }
  }, [imageUpload, state.coverMediaId, allMedia.length]);

  const addVideo = useCallback(async (file: File) => {
    const draft = await videoUpload.uploadVideo(file);
    // Auto-set first media as cover if none set
    if (draft && !state.coverMediaId && allMedia.length === 0) {
      setState(prev => ({ ...prev, coverMediaId: draft.fileKey }));
    }
  }, [videoUpload, state.coverMediaId, allMedia.length]);

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

    // Check if it's a pending image
    const imageDraft = imageUpload.imageDrafts.find(d => d.fileKey === id);
    if (imageDraft) {
      await imageUpload.removeImage(id);
      if (state.coverMediaId === id) {
        setState(prev => ({ ...prev, coverMediaId: null }));
      }
      return;
    }

    // Check if it's a pending video
    const videoDraft = videoUpload.videoDrafts.find(d => d.fileKey === id);
    if (videoDraft) {
      await videoUpload.removeVideo(id);
      if (state.coverMediaId === id) {
        setState(prev => ({ ...prev, coverMediaId: null }));
      }
    }
  }, [state.media, state.coverMediaId, imageUpload, videoUpload]);

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

      // Attach pending images and videos
      await imageUpload.attachToReview(ratingId);
      await videoUpload.attachToReview(ratingId);

      // Update cover selection
      if (state.coverMediaId) {
        // First reset all covers for this review
        await supabase
          .from('course_review_media')
          .update({ is_cover: false } as any)
          .eq('review_id', ratingId);

        // Find the dbRowId for the cover
        const coverImage = imageUpload.imageDrafts.find(d => d.fileKey === state.coverMediaId);
        const coverVideo = videoUpload.videoDrafts.find(d => d.fileKey === state.coverMediaId);
        const coverExisting = state.media.find(m => m.id === state.coverMediaId);
        
        const coverDbRowId = coverImage?.dbRowId || coverVideo?.dbRowId || coverExisting?.dbRowId;
        
        if (coverDbRowId) {
          await supabase
            .from('course_review_media')
            .update({ is_cover: true } as any)
            .eq('id', coverDbRowId);
        }
      }

      // Add to Top 10 if selected
      if (state.addToTop10 && state.top10Position && course) {
        try {
          // First check if already in top 10
          const { data: existingEntry } = await supabase
            .from('user_top_ten_courses')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('course_id', course.id)
            .maybeSingle();

          if (!existingEntry) {
            // Get current entries to check if we need to make room
            const { data: currentEntries } = await supabase
              .from('user_top_ten_courses')
              .select('id, position')
              .eq('user_id', currentUserId)
              .order('position', { ascending: true });

            const entries = currentEntries || [];
            
            // If position is occupied, shift other entries
            const occupiedPositions = new Set(entries.map(e => e.position));
            
            if (occupiedPositions.has(state.top10Position)) {
              // Use the reorder RPC to insert at position
              const courseIds = entries
                .filter(e => e.position >= state.top10Position)
                .map(e => e.id);
              
              // Insert at the desired position
              const { error: insertError } = await supabase
                .from('user_top_ten_courses')
                .insert({
                  user_id: currentUserId,
                  course_id: course.id,
                  position: state.top10Position,
                });
              
              if (insertError && insertError.code !== '23505') {
                console.error('[ReviewWizard] Failed to add to Top 10:', insertError);
              }
            } else {
              // Position is free, just insert
              const { error: insertError } = await supabase
                .from('user_top_ten_courses')
                .insert({
                  user_id: currentUserId,
                  course_id: course.id,
                  position: state.top10Position,
                });
              
              if (insertError && insertError.code !== '23505') {
                console.error('[ReviewWizard] Failed to add to Top 10:', insertError);
              }
            }
          }
        } catch (top10Error) {
          // Don't fail the whole submission for Top 10 errors
          console.error('[ReviewWizard] Top 10 integration error:', top10Error);
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

      // Reset upload hooks without cleanup (already attached)
      imageUpload.reset();
      videoUpload.reset();

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

  // Cleanup on unmount
  const cleanup = useCallback(async () => {
    if (!submitCompletedRef.current) {
      await Promise.all([
        imageUpload.cleanupPending(),
        videoUpload.cleanupPending(),
      ]);
    }
  }, [imageUpload, videoUpload]);

  // Check if can proceed to next step
  const canProceed = state.step === 1 ? state.rating !== null : true;
  
  // Check if any uploads are in progress
  const hasUploadsInProgress = imageUpload.hasUploadsInProgress || 
    videoUpload.videoDrafts.some(d => d.status === 'uploading');

  return {
    state,
    allMedia,
    canProceed,
    hasUploadsInProgress,
    isSubmitting: submitMutation.isPending,
    submittedRatingId: submitMutation.data,
    
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
    setTop10Option,
    
    // Media
    addImages,
    addVideo,
    removeMedia,
    
    // Actions
    submit: submitMutation.mutate,
    cleanup,
    reset: () => {
      setState(INITIAL_STATE);
      imageUpload.reset();
      videoUpload.reset();
      submitCompletedRef.current = false;
    },
  };
}
