import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Star, Check, Trash2, Upload, ArrowLeft, ArrowUp, ArrowDown, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { VideoPlayIndicator } from '@/components/ui/VideoPlayIndicator';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import ReviewMediaUpload from './ReviewMediaUpload';
import { formatCourseLocation } from '@/utils/courseLocation';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { SHOW_MOCK_REVIEWS } from '@/features/courses/config';
import { getScoreTier } from '@/utils/getScoreTier';
import { RatingPill } from '@/components/ui/RatingPill';
import { getMediaType, isVideoFile } from '@/utils/getMediaType';
import { useReviewVideoUpload, getFileKey, type ReviewVideoDraft } from '@/hooks/useReviewVideoUpload';

// Track if modal is being unmounted
let isUnmounting = false;

// Maximum number of media items (photos + videos) per review
const MAX_REVIEW_MEDIA_ITEMS = 6;

// Existing media item from database
interface ExistingMedia {
  id: string;
  media_url: string;
  media_type: string;
  poster_url: string | null;
  stream_id: string | null;
}

interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
  country?: string;
  sub_country?: string;
  region?: string;
}

interface PostPlayRatingModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  existingRating?: any;
  onRemoveFromPlayed?: () => void;
  isLoading?: boolean;
}

const PostPlayRatingModal = ({ 
  course, 
  isOpen, 
  onClose, 
  isEditMode = false,
  existingRating: existingRatingProp,
  onRemoveFromPlayed,
  isLoading = false
}: PostPlayRatingModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Capture flow type once on mount and never change it
  const [flowType] = useState<'create' | 'edit'>(isEditMode ? 'edit' : 'create');
  const isEditFlow = flowType === 'edit';
  
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Navigation guard while submitting
  useNavigationGuard({
    active: isSubmitting,
    message: "Your rating is still being submitted.",
  });
  
  // Upload session ID - stable for the life of this modal instance
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
  
  // Upload-on-select video handling hook
  const {
    videoDrafts,
    uploadVideo,
    removeVideo,
    attachToReview,
    cleanupPending,
    reset: resetVideoDrafts,
    resetCleanupFlag,
    retryPoster,
  } = useReviewVideoUpload({
    uploadSessionId,
    userId: currentUserId,
    onError: (msg) => toast({ title: 'Video Upload Error', description: msg, variant: 'destructive' }),
  });
  
  // Fix #6: Cleanup pending videos on unmount (best-effort)
  // Skip cleanup if submit completed successfully (videos are already attached)
  useEffect(() => {
    isUnmounting = false;
    // Reset flags when modal opens with new session
    resetCleanupFlag();
    submitCompletedRef.current = false;
    
    return () => {
      isUnmounting = true;
      // Only cleanup if submit didn't complete successfully
      if (!submitCompletedRef.current) {
        cleanupPending().catch(err => {
          console.warn('[Rating] Unmount cleanup error (non-blocking):', err);
        });
      }
    };
  }, [uploadSessionId]); // Only re-run if session changes
  
  // Store last payload for retry
  const lastPayloadRef = useRef<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Selected IMAGES only (videos handled separately via videoDrafts)
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<Map<string, string>>(new Map()); // keyed by fileKey
  const imagePreviewsRef = useRef<Map<string, string>>(new Map()); // ref for cleanup
  
  // Existing media from database (edit mode)
  const [existingMediaItems, setExistingMediaItems] = useState<ExistingMedia[]>([]);
  const [buttonText, setButtonText] = useState('Add to Played');
  const [designScore, setDesignScore] = useState<number | null>(null);
  const [conditionScore, setConditionScore] = useState<number | null>(null);
  const [clubhouseScore, setClubhouseScore] = useState<number | null>(null);
  const [facilitiesScore, setFacilitiesScore] = useState<number | null>(null);
  
  // Track whether breakdown sliders have been touched
  const [designTouched, setDesignTouched] = useState(false);
  const [conditionTouched, setConditionTouched] = useState(false);
  const [clubhouseTouched, setClubhouseTouched] = useState(false);
  const [facilitiesTouched, setFacilitiesTouched] = useState(false);
  
  // Custom remove confirmation dialog
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // Phase 3A: Track Outstanding tier entry for glow animation
  const [justEnteredOutstanding, setJustEnteredOutstanding] = useState(false);
  const prevTierRef = useRef<string | null>(null);
  
  // Phase 3A: Track Outstanding entry for breakdown sliders
  const [breakdownOutstandingEntry, setBreakdownOutstandingEntry] = useState<Record<string, boolean>>({});
  const prevBreakdownTiersRef = useRef<Record<string, string>>({});
  
  // Total media count (existing + new images + video drafts)
  const totalMediaCount = existingMediaItems.length + selectedImages.length + videoDrafts.length;

  // Use passed existingRating or fetch internally as fallback
  const { data: existingRatingFetched } = useQuery({
    queryKey: ['user-course-rating', course?.id],
    queryFn: async () => {
      if (!course?.id) return null;
      
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) return null;

      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', userResponse.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching existing rating:', error);
        return null;
      }
      
      return data;
    },
    enabled: isEditMode && !!course?.id && !existingRatingProp,
  });

  const existingRating = existingRatingProp || existingRatingFetched;

  // Populate form with existing rating data in edit mode
  useEffect(() => {
    if (existingRating && isEditMode) {
      setSelectedRating(existingRating.rating);
      setReview(existingRating.review || '');
      setDesignScore(existingRating.design_score);
      setConditionScore(existingRating.condition_score);
      setClubhouseScore(existingRating.clubhouse_score);
      setFacilitiesScore(existingRating.facilities_score);
      
      // Mark as touched if they exist
      setDesignTouched(existingRating.design_score != null);
      setConditionTouched(existingRating.condition_score != null);
      setClubhouseTouched(existingRating.clubhouse_score != null);
      setFacilitiesTouched(existingRating.facilities_score != null);
      
      // Fetch existing media for this review
      const fetchExistingMedia = async () => {
        const { data: mediaData, error } = await supabase
          .from('course_review_media')
          .select('id, media_url, media_type, poster_url, stream_id')
          .eq('review_id', existingRating.id);
        
        if (!error && mediaData) {
          setExistingMediaItems(mediaData);
        }
      };
      fetchExistingMedia();
    }
  }, [existingRating, isEditMode]);

  // Keep ref in sync with state for cleanup
  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Track modal open for analytics
  useEffect(() => {
    if (!isOpen || !course) return;
    
    analyticsEvents.ratings.modalOpened({
      courseId: course.id,
      courseName: course.name,
      isEditMode,
      deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    });
  }, [isOpen, course, isEditMode]);

  // RATINGS-ONLY: Badge checking after rating (no user_top100_courses writes)
  const checkBadgesMutation = useMutation({
    mutationFn: async () => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) throw new Error('Not authenticated');

      // Trigger badge checking for the user
      await supabase.rpc('check_and_award_badges', { user_id_param: userResponse.user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['trackerStats'] });
      queryClient.invalidateQueries({ queryKey: ['user-played-course', course?.id] });
    },
    onError: (error: any) => {
      console.error('[Rating] Badge checking failed:', error);
      // Non-blocking - rating already succeeded
    },
  });

  const submitRatingMutation = useMutation({
    mutationFn: async ({ 
      rating, 
      reviewText, 
      imageFiles,
      design,
      condition,
      clubhouse,
      facilities
    }: { 
      rating: number; 
      reviewText: string; 
      imageFiles: File[];
      design: number | null;
      condition: number | null;
      clubhouse: number | null;
      facilities: number | null;
    }) => {
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
          // Images go to R2
          const fileName = `${userResponse.user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
          const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-review-images', fileName);
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || `Failed to upload ${file.name}`);
          }

          // Save image record to database
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
      
      // Return the ratingId so we can attach videos in onSuccess
      return ratingId;
    },
    onSuccess: async (ratingId: string, variables) => {
      // Mark submit as completed FIRST to prevent cleanup from running
      submitCompletedRef.current = true;
      
      // Attach pending videos to the review (if any ready)
      try {
        if (videoDrafts.some(d => d.status === 'ready')) {
          const { attached } = await attachToReview(ratingId);
          console.log('[Rating] Attached', attached, 'videos to review:', ratingId);
        }
      } catch (attachError) {
        console.error('[Rating] Failed to attach videos:', attachError);
        // Non-blocking - rating succeeded, videos will be orphaned but cleaned up by TTL
      } finally {
        // Always clear ALL local media state to prevent duplicate display with existingMediaItems
        console.log('[Rating] Clearing local media state:', {
          selectedImages: selectedImages.length,
          videoDrafts: videoDrafts.length,
        });
        
        resetVideoDrafts();
        
        // Revoke blob URLs to prevent memory leaks
        try {
          imagePreviews.forEach((url) => {
            if (typeof url === 'string' && url.startsWith('blob:')) {
              URL.revokeObjectURL(url);
            }
          });
        } catch {
          // no-op
        }
        
        setSelectedImages([]);
        setImagePreviews(new Map());
        
        // Refetch the actual submitted media from DB to show accurate confirmation
        // This ensures we show exactly what was saved, not stale edit-mode data
        try {
          const { data: mediaData } = await supabase
            .from('course_review_media')
            .select('id, media_url, media_type, poster_url, stream_id')
            .eq('review_id', ratingId);
          
          if (mediaData) {
            setExistingMediaItems(mediaData);
            console.log('[Rating] Refreshed media for confirmation:', mediaData.length, 'items');
          }
        } catch {
          // Non-blocking - confirmation will just show whatever was already in state
        }
        
        console.log('[Rating] Local media state cleared');
      }
      
      // Get userId for proper query invalidation
      const { data: userResponse } = await supabase.auth.getUser();
      const userId = userResponse?.user?.id;

      const isNewReview = !isEditMode;

      console.log('[Rating Mutation onSuccess]', {
        courseId: course?.id,
        isNewReview,
        ratingId,
        payload: {
          rating: variables.rating,
          reviewText: variables.reviewText,
          design: variables.design,
          condition: variables.condition,
          clubhouse: variables.clubhouse,
          facilities: variables.facilities,
        },
      });

      // Track submission success
      analyticsEvents.ratings.submitted({
        courseId: course?.id || '',
        courseName: course?.name || '',
        isNewReview,
        overallRating: selectedRating || 0,
        design: designScore || undefined,
        condition: conditionScore || undefined,
        clubhouse: clubhouseScore || undefined,
        facilities: facilitiesScore || undefined,
      });

      // Check badges after successful rating (only if not in edit mode)
      // RATINGS-ONLY: No user_top100_courses writes - rating IS the played status
      if (!isEditMode) {
        try {
          await checkBadgesMutation.mutateAsync();
        } catch (badgeError) {
          console.error('[Rating] Badge check failed but rating succeeded:', badgeError);
          // Continue - rating is still successful even if badge check fails
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', course?.id] });
      
      // Force refetch for BOTH user rating AND community aggregates
      await queryClient.refetchQueries({ 
        queryKey: ['user-course-rating', course?.id, userId] 
      });
      
      await queryClient.refetchQueries({ 
        queryKey: ['course-rating-aggregates', course?.id] 
      });
      
      // PHASE 2 FIX: Invalidate + refetch distribution (fixes About tab bars)
      // Use exact:false to match any key variant including SHOW_MOCK_REVIEWS flag
      queryClient.invalidateQueries({ 
        queryKey: ['course-rating-distribution', course?.id],
        exact: false,
      });
      await queryClient.refetchQueries({ 
        queryKey: ['course-rating-distribution', course?.id],
        exact: false,
      });
      
      // Force aggressive refetch of ALL reviews queries (bypasses staleTime)
      await queryClient.refetchQueries({ 
        queryKey: ['course-reviews-full'],
        type: 'all',
      });
      
      queryClient.invalidateQueries({ queryKey: ['user-course-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user-played-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['friends-courses'] });
      
      // PHASE 2 FIX: Invalidate Top 100 and Explore cards so they reflect updated ratings
      queryClient.invalidateQueries({ queryKey: ['top100CoursesByRegion'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['golf-courses-infinite'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['explore-courses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['top100-course-leaderboard'], exact: false });
      
      // Force immediate refresh for any active feeds
      await queryClient.refetchQueries({ queryKey: ['top100CoursesByRegion'], exact: false, type: 'active' });
      await queryClient.refetchQueries({ queryKey: ['golf-courses-infinite'], exact: false, type: 'active' });
      await queryClient.refetchQueries({ queryKey: ['explore-courses'], exact: false, type: 'active' });
      
      // RATINGS-ONLY FIX: Invalidate Top 100 progress and Quest queries to update counts instantly
      queryClient.invalidateQueries({ queryKey: ['top100-progress-for-user'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['quest-courses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['top100-leaderboard'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-top100-courses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['userPlayedCourses'], exact: false });
      
      // Show "Added!" text for 1.5 seconds
      setButtonText('Added!');
      setTimeout(() => {
        setShowConfirmation(true);
        setIsSubmitting(false);
        setButtonText('Add to Played');
      }, 1500);
    },
    onError: (error: any) => {
      console.error('[Rating Submission] Error:', error);
      console.error('[Rating Submission] Error details:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint
      });
      
      const isNewReview = !isEditMode;

      // Track submission failure
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
      
      toast({
        title: "Error Submitting Rating",
        description: errorMessage,
        variant: "destructive",
        action: lastPayloadRef.current ? (
          <ToastAction altText="Retry submission" onClick={retryLastSubmit}>
            Retry
          </ToastAction>
        ) : undefined,
      });
      setIsSubmitting(false);
      setButtonText('Add to Played');
    },
  });

  const removeFromPlayedMutation = useMutation({
    mutationFn: async () => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user || !course) throw new Error('Not authenticated or no course');

      console.log('[Delete Rating] Payload:', { 
        ratingId: existingRating?.id, 
        courseId: course.id, 
        userId: userResponse.user.id 
      });

      // Delete rating if it exists
      if (existingRating) {
        const { error: ratingError } = await supabase
          .from('course_ratings')
          .delete()
          .eq('id', existingRating.id);
        
        if (ratingError) {
          console.error('[Delete Rating] Rating deletion error:', ratingError);
          throw ratingError;
        }
        console.log('[Delete Rating] Rating deleted successfully');
      }

      // Remove from user_courses (regular courses)
      const { error: courseError } = await supabase
        .from('user_courses')
        .delete()
        .eq('user_id', userResponse.user.id)
        .eq('course_id', course.id);
      
      if (courseError && courseError.code !== 'PGRST116') {
        console.error('[Delete Rating] User courses deletion error:', courseError);
      }
      
      // RATINGS-ONLY: No need to update user_top100_courses
      // Deleting the rating is sufficient - rating IS the played status

      console.log('[Delete Rating] Result:', { status: 'success' });
    },
    onSuccess: async () => {
      console.log('[Delete Rating] onSuccess - starting invalidations');
      
      // Get userId for proper query invalidation
      const { data: userResponse } = await supabase.auth.getUser();
      const userId = userResponse?.user?.id;
      
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', course?.id] });
      
      // Force refetch for BOTH user rating AND community aggregates
      await queryClient.refetchQueries({ queryKey: ['user-course-rating', course?.id, userId] });
      await queryClient.refetchQueries({ queryKey: ['course-rating-aggregates', course?.id] });
      
      // PHASE 2 FIX: Invalidate distribution/histogram (fixes About tab bars)
      queryClient.invalidateQueries({ 
        queryKey: ['course-rating-distribution', course?.id] 
      });
      
      // Invalidate and refetch reviews list with correct prefix matching
      queryClient.invalidateQueries({ queryKey: ['course-reviews', course?.id] });
      await queryClient.refetchQueries({ 
        queryKey: ['course-reviews-full'],
        type: 'active',
        exact: false
      });
      
      queryClient.invalidateQueries({ queryKey: ['user-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-top100-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['userTop100Courses'] });
      queryClient.invalidateQueries({ queryKey: ['userTop100CoursesInRegion'] });
      queryClient.invalidateQueries({ queryKey: ['top100-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-detail', course?.id] });
      
      // PHASE 2 FIX: Invalidate Top 100 and Explore cards so they reflect updated ratings
      queryClient.invalidateQueries({ queryKey: ['top100CoursesByRegion'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['golf-courses-infinite'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['explore-courses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['top100-course-leaderboard'], exact: false });
      
      // Force immediate refresh for any active feeds
      await queryClient.refetchQueries({ queryKey: ['top100CoursesByRegion'], exact: false, type: 'active' });
      await queryClient.refetchQueries({ queryKey: ['golf-courses-infinite'], exact: false, type: 'active' });
      await queryClient.refetchQueries({ queryKey: ['explore-courses'], exact: false, type: 'active' });
      
      // RATINGS-ONLY FIX: Invalidate Top 100 progress and Quest queries to update counts instantly
      queryClient.invalidateQueries({ queryKey: ['top100-progress-for-user'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['quest-courses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['top100-leaderboard'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-top100-courses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['userPlayedCourses'], exact: false });
      
      // Trigger badge checking for the user (non-blocking)
      try {
        const { data: userResponse } = await supabase.auth.getUser();
        if (userResponse.user) {
          console.log('[Delete Rating] Checking badges for user:', userResponse.user.id);
          await supabase.rpc('check_and_award_badges', { user_id_param: userResponse.user.id });
        }
      } catch (error) {
        console.error('[Delete Rating] Badges check failed but delete succeeded:', error);
        // Don't block delete success
      }
      
      console.log('[Delete Rating] onSuccess - showing success state in modal');
      
      // Show success state in modal
      setIsDeleted(true);
      
      // Start fade-out after 1.8s
      setTimeout(() => {
        setIsFadingOut(true);
      }, 1800);
      
      // Close modal and reset after 2.2s
      setTimeout(() => {
        if (onRemoveFromPlayed) {
          onRemoveFromPlayed();
        }
        
        setShowRemoveDialog(false);
        setIsDeleted(false);
        setIsFadingOut(false);
        onClose();
        resetForm();
        
        console.log('[Delete Rating] Success - complete');
      }, 2200);
    },
    onError: (error: any) => {
      console.error('[Delete Rating] Error:', error);
      console.error('[Delete Rating] Error details:', {
        code: error?.code,
        message: error?.message,
        details: error?.details
      });
      toast({
        title: "Error",
        description: "Failed to remove course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveFromPlayed = () => {
    console.log('[Delete Rating] handleRemoveFromPlayed called', { 
      courseId: course?.id, 
      courseName: course?.name,
      hasExistingRating: !!existingRating,
      ratingId: existingRating?.id 
    });
    removeFromPlayedMutation.mutate();
  };

  const handleSkip = () => {
    // Course is already marked as played, just close the modal
    toast({
      title: "Course Added",
      description: `${course?.name} has been added to your played courses`,
    });
    onClose();
    resetForm();
  };

  const resetForm = () => {
    if (!isEditMode) {
      setSelectedRating(null);
      setReview('');
      setDesignScore(null);
      setConditionScore(null);
      setClubhouseScore(null);
      setFacilitiesScore(null);
      setDesignTouched(false);
      setConditionTouched(false);
      setClubhouseTouched(false);
      setFacilitiesTouched(false);
    }
    // Clean up image previews
    imagePreviews.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setSelectedImages([]);
    setImagePreviews(new Map());
    resetVideoDrafts();
    setExistingMediaItems([]);
    setShowConfirmation(false);
    setIsSubmitting(false);
  };
  const handleClose = async () => {
    // Only cleanup pending video uploads if submit didn't complete successfully
    if (!submitCompletedRef.current) {
      await cleanupPending();
    }
    onClose();
    resetForm();
  };

  // Normalize value to 1 decimal place
  const normalize = (value: number | null | undefined): number | null => {
    if (value == null) return null;
    return parseFloat(value.toFixed(1));
  };

  const handleSubmit = async () => {
    if (!selectedRating) {
      toast({
        title: "Rating Required",
        description: "Please leave at least an overall rating to mark this course as played.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setButtonText('Adding...');
    
    // Build payload and log for debugging
    const payload = {
      rating: normalize(selectedRating) || 5,
      reviewText: review.trim(),
      imageFiles: selectedImages,
      design: designTouched ? normalize(designScore) : null,
      condition: conditionTouched ? normalize(conditionScore) : null,
      clubhouse: clubhouseTouched ? normalize(clubhouseScore) : null,
      facilities: facilitiesTouched ? normalize(facilitiesScore) : null
    };
    
    console.log('[Rating Submission] Payload:', payload);
    console.log('[Rating Submission] Types:', {
      rating: typeof payload.rating,
      design: typeof payload.design,
      condition: typeof payload.condition,
      clubhouse: typeof payload.clubhouse,
      facilities: typeof payload.facilities
    });
    console.log('[Rating Submission] Video drafts to attach:', videoDrafts.filter(d => d.status === 'ready').length);
    
    // Store payload for retry
    lastPayloadRef.current = payload;
    submitRatingMutation.mutate(payload);
  };

  // Retry last submission
  const retryLastSubmit = () => {
    if (!lastPayloadRef.current) return;
    setIsSubmitting(true);
    setButtonText(isEditMode ? "Updating..." : "Adding...");
    submitRatingMutation.mutate(lastPayloadRef.current);
  };

  const handleMediaSelected = async (files: File[]) => {
    console.log('[Media Audit] CHECKPOINT A - Picked items:', files);
    console.log(
      '[Media Audit] CHECKPOINT A1 - Picked details:',
      files.map((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        return {
          name: f.name,
          size: f.size,
          type: f.type,
          ext,
          inferred: getMediaType(f),
        };
      })
    );

    // Respect 6-item maximum (existing media + images + video drafts)
    const remainingSlots = MAX_REVIEW_MEDIA_ITEMS - totalMediaCount;
    const filesToAdd = files.slice(0, Math.max(0, remainingSlots));

    if (filesToAdd.length === 0) {
      if (remainingSlots <= 0) {
        toast({
          title: `${MAX_REVIEW_MEDIA_ITEMS} of ${MAX_REVIEW_MEDIA_ITEMS} added`,
          description: `You can attach up to ${MAX_REVIEW_MEDIA_ITEMS} photos or videos per review.`,
        });
      }
      return;
    }

    // Show toast if user tried to add more than allowed
    if (files.length > remainingSlots && remainingSlots > 0) {
      toast({
        title: `${MAX_REVIEW_MEDIA_ITEMS} of ${MAX_REVIEW_MEDIA_ITEMS} added`,
        description: `You can attach up to ${MAX_REVIEW_MEDIA_ITEMS} photos or videos per review.`,
      });
    }

    // Split into images vs videos
    const imageFiles: File[] = [];
    const videoFiles: File[] = [];
    
    for (const file of filesToAdd) {
      const inferred = getMediaType(file);
      if (inferred === 'video') {
        videoFiles.push(file);
      } else {
        imageFiles.push(file);
      }
    }

    // Add images to state with blob previews
    if (imageFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...imageFiles]);
      
      for (const file of imageFiles) {
        const previewUrl = URL.createObjectURL(file);
        const fileKey = getFileKey(file);
        setImagePreviews((prev) => {
          const next = new Map(prev);
          next.set(fileKey, previewUrl);
          return next;
        });
      }
    }

    // Upload videos to Stream immediately (upload-on-select)
    for (const file of videoFiles) {
      console.log('[Review Media] Starting upload-on-select for:', file.name);
      uploadVideo(file);
    }

    console.log('[Media Audit] CHECKPOINT B - Queued media:', {
      imagesAdded: imageFiles.length,
      videosStarted: videoFiles.length,
      totalCount: totalMediaCount + filesToAdd.length,
    });
  };

  const handleRemoveImage = (index: number) => {
    const fileToRemove = selectedImages[index];
    const fileKey = getFileKey(fileToRemove);
    const previewUrl = imagePreviews.get(fileKey);
    
    // Revoke the object URL to free memory
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileKey);
      return newMap;
    });
  };

  // Format score for display
  const formatScore = (value: number | null | undefined) =>
    value == null ? '--' : value.toFixed(1);

  // Show skeleton while loading
  if (isLoading || !course) {
    return (
      <div className="fixed inset-0 z-[999] bg-background overflow-y-auto">
        <div className="min-h-screen bg-background pb-24">
          {/* Header with back button - Section A (light) */}
          <div className="relative h-64 bg-slate-50">
            <div className="animate-pulse bg-slate-200 h-full w-full" />
            <div className="absolute top-4 left-4">
              <div className="h-9 w-9 rounded-md bg-white/20" />
            </div>
          </div>

          <div className="space-y-0">
            {/* Overall rating section - Section A continued (light) */}
            <div className="space-y-3 px-6 pt-6 pb-3 bg-slate-50">
              <div className="h-5 w-48 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded-full animate-pulse" />
              <div className="h-8 w-32 bg-muted rounded-full mx-auto animate-pulse" />
            </div>

            {/* Share thoughts textarea - Section B (dark) */}
            <div className="space-y-3 px-6 pt-6 pb-3 bg-slate-100">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-32 w-full bg-muted rounded-2xl animate-pulse" />
            </div>

            {/* Breakdown section - Section C (light) */}
            <div className="space-y-4 px-6 pt-6 pb-3 bg-slate-50">
              <div className="h-5 w-56 bg-muted rounded animate-pulse" />
              
              {/* 4 breakdown sliders */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-muted rounded-full ml-auto animate-pulse" />
                </div>
              ))}
            </div>

            {/* Media upload section - Section D (dark) */}
            <div className="space-y-3 px-6 pt-6 pb-3 bg-slate-100">
              <div className="h-5 w-48 bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-3 gap-3">
                <div className="aspect-square bg-muted rounded-lg animate-pulse" />
                <div className="aspect-square bg-muted rounded-lg animate-pulse" />
                <div className="aspect-square bg-muted rounded-lg animate-pulse" />
              </div>
              <div className="h-3 w-64 bg-muted rounded animate-pulse" />
            </div>

            {/* Primary button - Section E (light) */}
            <div className="flex w-full items-center justify-between gap-3 px-6 pt-6 pb-3 bg-slate-50">
              <div className="h-11 flex-1 bg-muted rounded-lg animate-pulse" />
              <div className="h-11 flex-1 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pageTitle = isEditMode ? 'Edit your rating' : 'Rate this course';
  const ctaLabel = isEditMode ? 'Update Rating' : 'Submit Rating';

  return (
    <>
      <div className="fixed inset-0 z-[999] bg-background overflow-y-auto">
        {!showConfirmation ? (
          <div>
            {/* Hero Image - Section A (light) */}
            <div className="relative h-64 overflow-hidden bg-slate-50">
              {course.thumbnail_image ? (
                <img
                  src={course.thumbnail_image}
                  alt={course.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                  <Star className="h-8 w-8 text-white opacity-50" />
                </div>
              )}
              {/* Dark gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              
              {/* Glass back button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>

              {/* Course name and location overlay on image */}
              <div className="absolute inset-x-0 bottom-4 px-4">
                <h1 className="text-4xl md:text-5xl font-semibold text-white drop-shadow-2xl mb-1.5">
                  {course.name}
                </h1>
                <p className="text-lg md:text-xl text-white opacity-90 drop-shadow-lg">
                  {formatCourseLocation(course)}
                </p>
              </div>
            </div>

            {/* Overall Rating Slider - Section A continued (light) */}
            <section className="px-6 pt-6 pb-3 bg-slate-50">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-lg font-semibold text-slate-900">
                  {isEditMode ? 'Edit your overall rating' : 'Submit your overall rating'}
                </span>
                <span className={`text-base font-semibold transition-opacity duration-200 ${
                  selectedRating != null ? 'text-slate-900 opacity-100' : 'text-slate-400 opacity-0'
                }`}>
                  {selectedRating != null ? selectedRating.toFixed(1) : ''}
                </span>
              </div>

              <div className="mt-3">
                <Slider
                  value={[selectedRating || 5]}
                  onValueChange={(values) => {
                    const newValue = values[0];
                    const newTier = getScoreTier(newValue).tier;
                    const oldTier = prevTierRef.current;
                    
                    // Phase 3A: Detect crossing into Outstanding
                    if (newTier === 'outstanding' && oldTier !== 'outstanding') {
                      setJustEnteredOutstanding(true);
                      // Clear after animation completes
                      setTimeout(() => setJustEnteredOutstanding(false), 600);
                    }
                    
                    prevTierRef.current = newTier;
                    setSelectedRating(newValue);
                    analyticsEvents.ratings.sliderChanged({
                      courseId: course.id,
                      courseName: course.name,
                      category: "overall",
                      value: newValue,
                    });
                  }}
                  min={0.5}
                  max={10}
                  step={0.1}
                  className="w-full rating-slider-primary"
                  data-tier={getScoreTier(selectedRating ?? 0.5).tier === 'outstanding' ? 'outstanding' : undefined}
                  data-just-entered={justEnteredOutstanding ? 'true' : undefined}
                />
              </div>

              {/* Rating badge - uses unified RatingPill component */}
              <div className="mt-4 flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-slate-500 tracking-[0.04em] uppercase font-medium">
                  Your rating summary
                </span>
                <RatingPill score={selectedRating} className="py-1.5 px-4 border border-slate-200/60 shadow-none" />
              </div>
            </section>

            {/* Share Your Thoughts - Section B (dark) */}
            <section className="px-6 pt-6 pb-3 bg-slate-100">
              <label className="text-base font-semibold text-slate-900 mb-2 block">
                Share your thoughts
              </label>

              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                placeholder="Share your review with other golfers – what stood out about the design, conditions, clubhouse or overall experience?"
                className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 caret-slate-700 resize-none focus:outline-none focus:bg-slate-50 focus:border-slate-300 focus:ring-2 focus:ring-slate-200 transition-colors"
                disabled={isSubmitting}
                maxLength={500}
              />
              <div className="mt-1 flex justify-end">
                <p className="text-xs text-slate-400">
                  {review.length}/500
                </p>
              </div>
            </section>

            {/* Breakdown Sliders - Section C (light) */}
            <section className="px-6 pt-6 pb-3 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                {isEditMode ? 'Edit your breakdown' : 'Submit your breakdown'}
              </h3>

              {[
                { 
                  key: 'design', 
                  label: 'Course Design', 
                  score: designScore, 
                  setScore: setDesignScore,
                  setTouched: setDesignTouched
                },
                { 
                  key: 'condition', 
                  label: 'Course Condition', 
                  score: conditionScore, 
                  setScore: setConditionScore,
                  setTouched: setConditionTouched
                },
                { 
                  key: 'clubhouse', 
                  label: 'Clubhouse', 
                  score: clubhouseScore, 
                  setScore: setClubhouseScore,
                  setTouched: setClubhouseTouched
                },
                { 
                  key: 'facilities', 
                  label: 'Facilities', 
                  score: facilitiesScore, 
                  setScore: setFacilitiesScore,
                  setTouched: setFacilitiesTouched
                },
              ].map(({ key, label, score, setScore, setTouched }) => (
                <div key={key} className="mt-4">
                  {/* Label row - aligned with consistent right edge for values */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-semibold text-slate-900">{label}</span>
                    <span className={`text-sm font-medium tabular-nums min-w-[3ch] text-right ${score != null ? 'text-slate-700' : 'text-slate-400'}`}>
                      {score != null ? score.toFixed(1) : '--'}
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="mt-2 mb-3">
                    <Slider
                      value={[score ?? 5]}
                      onValueChange={(values) => {
                        const newValue = values[0];
                        const newTier = getScoreTier(newValue).tier;
                        const oldTier = prevBreakdownTiersRef.current[key];
                        
                        // Phase 3A: Detect crossing into Outstanding
                        if (newTier === 'outstanding' && oldTier !== 'outstanding') {
                          setBreakdownOutstandingEntry(prev => ({ ...prev, [key]: true }));
                          setTimeout(() => {
                            setBreakdownOutstandingEntry(prev => ({ ...prev, [key]: false }));
                          }, 600);
                        }
                        
                        prevBreakdownTiersRef.current[key] = newTier;
                        setTouched(true);
                        setScore(newValue);
                      }}
                      min={0.5}
                      max={10}
                      step={0.1}
                      className="w-full rating-slider-breakdown"
                      data-tier={score != null && getScoreTier(score).tier === 'outstanding' ? 'outstanding' : undefined}
                      data-just-entered={breakdownOutstandingEntry[key] ? 'true' : undefined}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Media Upload Section - Section D (dark) */}
            <section className="px-6 pt-6 pb-3 bg-slate-100">
              <div className="py-8 flex flex-col items-center justify-center gap-4">
                {/* Total media count = existing + images + video drafts */}
                {totalMediaCount > 0 && (
                  <div className="w-full">
                    <div className="grid grid-cols-3 gap-3">
                      {/* Existing media items from database */}
                      {existingMediaItems.map((item) => {
                        const isVideo = item.media_type === 'video';
                        
                        return (
                          <div key={item.id} className="relative w-full aspect-square overflow-hidden rounded-md">
                            {isVideo ? (
                              // Video with Stream poster
                              <div className="relative h-full w-full">
                                {item.poster_url ? (
                                  <img
                                    src={item.poster_url}
                                    alt="Video thumbnail"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-slate-700" />
                                )}
                                {/* Play icon overlay */}
                                <VideoPlayIndicator size="md" />
                              </div>
                            ) : (
                              <img
                                src={item.media_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                // Delete from database
                                const { error } = await supabase
                                  .from('course_review_media')
                                  .delete()
                                  .eq('id', item.id);
                                
                                if (!error) {
                                  setExistingMediaItems(prev => prev.filter(m => m.id !== item.id));
                                } else {
                                  toast({
                                    title: "Error",
                                    description: "Failed to remove media",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 flex items-center justify-center z-20 transition-colors"
                              aria-label="Remove media"
                            >
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        );
                      })}
                      
                      {/* Newly selected IMAGES */}
                      {selectedImages.map((file, index) => {
                        const fileKey = getFileKey(file);
                        const preview = imagePreviews.get(fileKey) || '';
                        
                        return (
                          <div key={`img-${index}`} className="relative w-full aspect-square overflow-hidden rounded-md">
                            <img
                              src={preview}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 flex items-center justify-center z-20 transition-colors"
                              aria-label="Remove image"
                            >
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        );
                      })}
                      
                      {/* Video drafts (upload-on-select) */}
                      {videoDrafts.map((draft) => {
                        const displayName = draft.fileName.length > 12 
                          ? draft.fileName.slice(0, 10) + '…' 
                          : draft.fileName;
                        
                        return (
                          <div key={draft.fileKey} className="relative w-full aspect-square overflow-hidden rounded-md">
                            {draft.status === 'uploading' ? (
                              // Uploading state with spinner
                              <div className="relative h-full w-full bg-slate-700 flex flex-col items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2" />
                                <span className="text-xs text-slate-300 text-center px-2">
                                  Uploading…
                                </span>
                              </div>
                            ) : draft.status === 'ready' && draft.posterUrl ? (
                              // Ready with Stream poster thumbnail (Fix #7: onError retry)
                              <div className="relative h-full w-full">
                                <img
                                  src={draft.posterUrl}
                                  alt="Video thumbnail"
                                  className="h-full w-full object-cover"
                                  onError={() => {
                                    // Retry poster load with cache-buster if it fails
                                    if ((draft.posterRetryCount || 0) < 3) {
                                      setTimeout(() => retryPoster(draft.fileKey), 1000);
                                    }
                                  }}
                                />
                                {/* Play icon overlay */}
                                <VideoPlayIndicator size="md" />
                              </div>
                            ) : draft.status === 'failed' ? (
                              // Failed state with retry
                              <div className="relative h-full w-full bg-red-900/30 flex flex-col items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
                                <span className="text-xs text-red-300 text-center px-2">
                                  Failed
                                </span>
                              </div>
                            ) : (
                              // Fallback placeholder
                              <div className="relative h-full w-full bg-slate-700 flex flex-col items-center justify-center">
                                <VideoPlayIndicator size="md" className="static mb-2" />
                                <span className="text-xs text-slate-300 text-center px-2 truncate max-w-full">
                                  {displayName}
                                </span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeVideo(draft.fileKey)}
                              className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 flex items-center justify-center z-20 transition-colors"
                              aria-label="Remove video"
                            >
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {totalMediaCount === 0 && (
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                      Media upload (optional)
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Add up to 6 photos or videos
                    </p>
                  </div>
                )}
                
                <Button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,video/*';
                    input.multiple = true;
                    input.style.position = 'fixed';
                    input.style.left = '-9999px';
                    input.style.top = '-9999px';

                    const cleanup = () => {
                      try {
                        input.value = '';
                      } catch {
                        // no-op
                      }
                      input.remove();
                    };

                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      const picked = Array.from(target.files || []);
                      console.log('[Media Audit] CHECKPOINT A0 - input.onchange fired:', {
                        count: picked.length,
                      });
                      if (picked.length > 0) {
                        handleMediaSelected(picked);
                      }
                      cleanup();
                    };

                    document.body.appendChild(input);
                    input.click();
                  }}
                  variant="outline"
                  disabled={totalMediaCount >= MAX_REVIEW_MEDIA_ITEMS}
                  className="w-44 mt-6 h-11 rounded-xl border border-slate-600 bg-white px-6 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {totalMediaCount >= MAX_REVIEW_MEDIA_ITEMS 
                    ? `${MAX_REVIEW_MEDIA_ITEMS} of ${MAX_REVIEW_MEDIA_ITEMS} added` 
                    : 'Add Media'}
                </Button>
              </div>
            </section>

            {/* Primary CTA Button - Section E (light) */}
            <footer className="px-6 pt-6 pb-4 mb-4 bg-slate-50">
              {isEditMode ? (
                <div className="flex flex-col w-full gap-3 mb-2">
                  <div className="flex w-full items-center justify-between gap-3">
                    {/* Remove rating (left) - reduced visual weight */}
                    <button
                      type="button"
                      onClick={() => setShowRemoveDialog(true)}
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 bg-white/80 hover:bg-red-50 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed h-11"
                    >
                      Remove rating
                    </button>

                    {/* Update rating (right) */}
                    <Button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !selectedRating}
                      variant="outline"
                      className="flex-1 h-11 rounded-xl border border-slate-600 bg-white text-slate-600 text-base font-medium py-3 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Saving…' : 'Update rating'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !selectedRating}
                    variant="outline"
                    className="w-full h-11 rounded-xl border border-slate-600 bg-white text-slate-600 text-base font-medium py-3 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving…' : 'Submit rating'}
                  </Button>
                  {/* Hint when disabled */}
                  {!selectedRating && !isSubmitting && (
                    <p className="text-xs text-slate-400 text-center">
                      Set an overall rating to continue.
                    </p>
                  )}
                </div>
              )}
            </footer>
          </div>
          ) : (
            <RatingConfirmationView
              mode={isEditFlow ? 'updated' : 'submitted'}
              courseName={course!.name}
              courseId={course!.id}
              userRating={selectedRating || 0}
              breakdown={
                [
                  designScore != null && designTouched ? { label: 'Course Design', value: designScore } : null,
                  conditionScore != null && conditionTouched ? { label: 'Course Condition', value: conditionScore } : null,
                  clubhouseScore != null && clubhouseTouched ? { label: 'Clubhouse', value: clubhouseScore } : null,
                  facilitiesScore != null && facilitiesTouched ? { label: 'Facilities', value: facilitiesScore } : null,
                ].filter((item): item is BreakdownItem => item !== null)
              }
              communityScore={null}
              submittedMedia={existingMediaItems}
              heroImageUrl={course?.thumbnail_image || null}
              heroSubtitle={course ? formatCourseLocation(course) : ''}
              onBack={handleClose}
              onShareReview={() => {
                // TODO: Implement share review flow
                console.log('Share review clicked');
              }}
            />
          )}
        </div>

        {/* Custom Remove Confirmation Dialog */}
        {showRemoveDialog && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div 
              className={`w-[90%] max-w-sm rounded-3xl bg-slate-50 shadow-xl border border-slate-200 px-5 py-6 space-y-3 transition-opacity duration-300 ease-out ${
                isFadingOut ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {!isDeleted ? (
                <>
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Remove rating?</h2>
                  <p className="text-sm text-slate-600 mb-6">
                    This will permanently delete your rating and review for this course.
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      className="h-11 rounded-xl border border-slate-600 bg-white text-slate-600 text-base font-medium px-5 py-2 hover:bg-slate-50 active:scale-[0.99]"
                      onClick={() => setShowRemoveDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="h-11 rounded-xl border border-red-300 bg-white/80 text-red-600 text-base font-semibold px-5 py-2 hover:bg-red-50 active:scale-[0.99]"
                      onClick={() => {
                        handleRemoveFromPlayed();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Course removed</h2>
                  <p className="text-sm text-slate-600">
                    {course?.name} has been removed from your played list. You can add a new rating at any time.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
    </>
  );
};

// ============================================
// Confirmation Components
// ============================================

type RatingConfirmationProps = {
  course: Course;
  userRating: { rating: number | null; review: string };
  onBackToCourse: () => void;
};

// ===== RATING CONFIRMATION VIEW =====
// Uses unified System-2 rating bands from getScoreTier()

function getComparisonCopy(user: number, community: number | null) {
  if (community == null) return null;

  const delta = user - community;
  const abs = Math.abs(delta);

  if (abs < 0.2) {
    return { icon: '✓', text: 'You rated this course on par with the community.', color: '#22C55E' };
  }

  if (delta > 0) {
    return {
      icon: '↑',
      text: `You rated this course ${abs.toFixed(1)} point${abs === 1.0 ? '' : 's'} higher than the community.`,
      color: '#22C55E',
    };
  }

  return {
    icon: '↓',
    text: `You rated this course ${abs.toFixed(1)} point${abs === 1.0 ? '' : 's'} lower than the community.`,
    color: '#E85151',
  };
}

type BreakdownItem = { label: string; value: number };

type RatingConfirmationViewProps = {
  mode: 'submitted' | 'updated';
  courseName: string;
  courseId: string;
  userRating: number;
  breakdown?: BreakdownItem[];
  communityScore?: number | null;
  submittedMedia?: ExistingMedia[];
  heroImageUrl?: string | null;
  heroSubtitle?: string;
  onBack: () => void;
  onShareReview: () => void;
};

function RatingConfirmationView(props: RatingConfirmationViewProps) {
  const {
    mode,
    courseName,
    courseId,
    userRating,
    breakdown = [],
    communityScore = null,
    submittedMedia = [],
    heroImageUrl,
    heroSubtitle,
    onBack,
    onShareReview,
  } = props;

  const isEdit = mode === 'updated';
  const isNewReview = !isEdit;
  const tierData = getScoreTier(userRating);
  const showHero = !!heroImageUrl;

  // Track confirmation view
  useEffect(() => {
    analyticsEvents.ratings.confirmationViewed({
      courseId,
      courseName,
      isNewReview,
      overallRating: userRating,
    });
  }, [courseId, courseName, isNewReview, userRating]);

  // Handle back to course with analytics
  const handleBackToCourse = () => {
    analyticsEvents.ratings.flowCompleted({
      courseId,
      courseName,
      isNewReview,
    });
    onBack();
  };

  const title = isEdit ? 'Rating updated' : 'Rating submitted';
  const subtitle = `Your rating for ${courseName} has been saved.`;

  const overallHeading = isEdit ? 'Updated overall rating' : 'Your overall rating';
  const breakdownHeading = isEdit ? 'Updated breakdown' : 'Your breakdown';

  // Compute comparison for inside the rating card
  const hasCommunityScore = typeof communityScore === 'number' && !Number.isNaN(communityScore);
  const diffRaw = hasCommunityScore ? userRating - communityScore : 0;
  const diff = Math.round(diffRaw * 10) / 10;

  type ComparisonVariant = 'higher' | 'lower' | 'on-par' | 'first';
  let comparisonVariant: ComparisonVariant = 'first';
  let comparisonText: string | null = null;

  if (!hasCommunityScore) {
    comparisonVariant = 'first';
    comparisonText = "You're the first to rate this course – your rating sets the starting point.";
  } else if (Math.abs(diff) < 0.1) {
    comparisonVariant = 'on-par';
    comparisonText = 'You rated this course on par with the community.';
  } else if (diff > 0) {
    comparisonVariant = 'higher';
    const points = Math.abs(diff);
    comparisonText = `You rated this course ${points.toFixed(1)} point${points === 1.0 ? '' : 's'} higher than the community.`;
  } else {
    comparisonVariant = 'lower';
    const points = Math.abs(diff);
    comparisonText = `You rated this course ${points.toFixed(1)} point${points === 1.0 ? '' : 's'} lower than the community.`;
  }

  // Breakdown bars are ALWAYS slate - never gold (gold is only for community overall)
  const BREAKDOWN_BAR_FILL = '#64748B'; // slate-500

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* SECTION A – Hero Image Header */}
      {showHero && (
        <div className="relative h-[160px] w-full overflow-hidden">
          <img
            src={heroImageUrl!}
            alt={courseName}
            className="h-full w-full object-cover"
          />

          {/* Back button - matching Course Details page style */}
          <button
            onClick={onBack}
            className="absolute top-3 left-3 z-20 h-9 w-9 bg-black/20 backdrop-blur-sm rounded-md flex items-center justify-center hover:bg-black/40 transition-colors focus:outline-none"
            aria-label="Back"
          >
            <ArrowLeft className="!h-5 !w-5 text-white" />
          </button>

          {/* Course name + location overlay */}
          <div className="absolute left-4 bottom-4 right-4">
            <div className="text-white text-xl font-semibold leading-tight drop-shadow-sm">
              {courseName}
            </div>
            {heroSubtitle && (
              <div className="text-white/80 text-sm mt-0.5 drop-shadow-sm">
                {heroSubtitle}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION B – Success header (compact if hero exists) */}
      <section className={`bg-slate-50 px-6 text-center animate-fade-in ${showHero ? 'pt-5 pb-4' : 'pt-14 pb-5'}`}>
        <div 
          className={`mx-auto mb-2 flex items-center justify-center rounded-full bg-emerald-100 shadow-[0_0_0_6px_rgba(16,185,129,0.1)] animate-scale-in ${showHero ? 'h-11 w-11' : 'h-14 w-14'}`}
          style={{ animationDelay: '100ms' }}
        >
          <Check className={`text-emerald-600 ${showHero ? 'h-5 w-5' : 'h-7 w-7'}`} />
        </div>

        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </section>

      {/* SECTION C – Hero Rating Card */}
      <section 
        className={`animate-fade-in ${showHero ? 'px-4' : 'px-6 py-4'}`}
        style={{ animationDelay: '150ms' }}
      >
        <div className="rounded-2xl bg-white px-5 py-5 shadow-sm border border-slate-200/80">
          {/* Header label */}
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500 mb-3">
            {overallHeading}
          </p>
          
          {/* Large score + tier pill row */}
          <div className="flex items-center justify-between">
            <p className="text-4xl font-bold text-slate-900 tabular-nums">
              {userRating === 10 ? '10' : userRating.toFixed(1)}
            </p>
            <RatingPill score={userRating} className="py-1.5 px-4" />
          </div>

          {/* Community comparison */}
          {comparisonText && (
            <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-slate-100">
              {comparisonVariant === 'higher' && (
                <ArrowUp className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
              )}
              {comparisonVariant === 'lower' && (
                <ArrowDown className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              )}
              {comparisonVariant === 'on-par' && (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
              )}
              <p className={`text-xs font-medium ${
                comparisonVariant === 'higher' ? 'text-emerald-600' :
                comparisonVariant === 'lower' ? 'text-red-500' :
                comparisonVariant === 'on-par' ? 'text-emerald-600' :
                'text-slate-500'
              }`}>
                {comparisonText}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION D – User Media Thumbnails (premium grid) */}
      {submittedMedia.length > 0 && (
        <section 
          className="px-4 pt-4 pb-4 animate-fade-in"
          style={{ animationDelay: '200ms' }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500 mb-3 px-2">
            Review media
          </p>
          <div className="grid grid-cols-3 gap-2">
            {submittedMedia.slice(0, 6).map((item, index) => {
              const isVideo = item.media_type === 'video';
              const thumbnailUrl = isVideo && item.poster_url ? item.poster_url : item.media_url;
              const isLastWithMore = index === 5 && submittedMedia.length > 6;
              const extraCount = submittedMedia.length - 6;
              
              return (
                <button 
                  key={item.id}
                  type="button"
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/60 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  onClick={() => {/* TODO: open full-screen viewer */}}
                >
                  <img 
                    src={thumbnailUrl}
                    alt=""
                    className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isLastWithMore ? 'blur-sm' : ''}`}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  
                  {/* Video play indicator */}
                  {isVideo && !isLastWithMore && <VideoPlayIndicator size="md" />}
                  
                  {/* +X more overlay for last tile */}
                  {isLastWithMore && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-white text-lg font-semibold">+{extraCount}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION E – Breakdown (always slate bars) */}
      {breakdown.length > 0 && (
        <section 
          className="px-6 py-4 animate-fade-in"
          style={{ animationDelay: submittedMedia.length > 0 ? '250ms' : '200ms' }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500 mb-3">
            {breakdownHeading}
          </p>

          <div className="space-y-3">
            {breakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {item.value === 10 ? '10' : item.value.toFixed(1)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(item.value / 10) * 100}%`,
                      backgroundColor: BREAKDOWN_BAR_FILL,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spacer so actions sit near the bottom */}
      <div className="flex-1 bg-slate-50 min-h-[40px]" />

      {/* SECTION F – Actions row (premium buttons) */}
      <section 
        className="bg-slate-50 px-4 pb-10 pt-4 animate-fade-in"
        style={{ animationDelay: '300ms' }}
      >
        <div className="flex gap-3">
          {/* Secondary – share review */}
          <button
            type="button"
            onClick={onShareReview}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white h-12 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            Share your review
          </button>

          {/* Primary – back to course */}
          <button
            type="button"
            onClick={handleBackToCourse}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white h-12 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            Back to course
          </button>
        </div>
      </section>
    </div>
  );
}

export default PostPlayRatingModal;
