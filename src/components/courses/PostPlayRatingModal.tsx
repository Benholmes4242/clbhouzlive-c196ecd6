import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Star, Check, Trophy, Trash2, Upload, ArrowLeft, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import ReviewMediaUpload from './ReviewMediaUpload';
import { formatCourseLocation } from '@/utils/courseLocation';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { SHOW_MOCK_REVIEWS } from '@/features/courses/config';
import { generateVideoThumbnail } from '@/utils/videoThumbnail';
import { getScoreTier } from '@/utils/getScoreTier';
import { RatingPill } from '@/components/ui/RatingPill';

// Maximum number of media items (photos + videos) per review
const MAX_REVIEW_MEDIA_ITEMS = 6;

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
  
  // Store last payload for retry
  const lastPayloadRef = useRef<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<Map<File, string>>(new Map());
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
    }
  }, [existingRating, isEditMode]);

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
      mediaFiles,
      design,
      condition,
      clubhouse,
      facilities
    }: { 
      rating: number; 
      reviewText: string; 
      mediaFiles: File[];
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

      // Upload media files if any
      if (mediaFiles.length > 0) {
        const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
        const uploadPromises = mediaFiles.map(async (file) => {
          const fileName = `${userResponse.user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
          
          const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-review-images', fileName);
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || `Failed to upload ${file.name}`);
          }

          // Save media record to database
          const { error: mediaError } = await supabase
            .from('course_review_media')
            .insert({
              review_id: ratingId,
              media_url: uploadResult.publicUrl,
              media_type: file.type.startsWith('video/') ? 'video' : 'image',
              file_name: file.name,
              file_size: file.size
            });

          if (mediaError) throw mediaError;
        });

        await Promise.all(uploadPromises);
      }
    },
    onSuccess: async (result, variables) => {
      // Get userId for proper query invalidation
      const { data: userResponse } = await supabase.auth.getUser();
      const userId = userResponse?.user?.id;

      const isNewReview = !isEditMode;

      console.log('[Rating Mutation onSuccess]', {
        courseId: course?.id,
        isNewReview,
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
    // Clean up media previews
    mediaPreviews.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    setSelectedMedia([]);
    setMediaPreviews(new Map());
    setShowConfirmation(false);
    setIsSubmitting(false);
  };

  // Generate video thumbnail
  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      video.onloadeddata = () => {
        // Seek to 1 second or 10% of duration, whichever is smaller
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      };
      
      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve(thumbnailUrl);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
          
          // Clean up
          URL.revokeObjectURL(video.src);
        }, 'image/jpeg', 0.8);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video'));
        URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleClose = () => {
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
      mediaFiles: selectedMedia,
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
    console.log('[Media Audit] CHECKPOINT A - First picked item:', files[0]);
    
    // Respect 6-item maximum
    const remainingSlots = MAX_REVIEW_MEDIA_ITEMS - selectedMedia.length;
    const filesToAdd = files.slice(0, Math.max(0, remainingSlots));
    
    if (filesToAdd.length === 0) {
      return;
    }
    
    // Show toast if user tried to add more than allowed
    if (files.length > remainingSlots && remainingSlots > 0) {
      toast({
        title: "Media limit reached",
        description: `You can attach up to ${MAX_REVIEW_MEDIA_ITEMS} photos or videos per review.`,
      });
    }
    
    // Generate ALL previews first, before updating state
    const newPreviews = new Map(mediaPreviews);
    
    for (const file of filesToAdd) {
      try {
        if (file.type.startsWith('video/')) {
          const thumbnail = await generateVideoThumbnail(file);
          if (thumbnail) {
            newPreviews.set(file, thumbnail);
          }
        } else {
          const previewUrl = URL.createObjectURL(file);
          newPreviews.set(file, previewUrl);
        }
      } catch (error) {
        console.error('[Media] Failed to generate preview for file', file.name, error);
      }
    }
    
    // Only after ALL previews are ready, update both states together
    setSelectedMedia(prev => [...prev, ...filesToAdd]);
    setMediaPreviews(newPreviews);
    
    console.log('[Media Audit] CHECKPOINT B - State media after add:', {
      count: selectedMedia.length + filesToAdd.length,
      previewMapSize: newPreviews.size,
    });
  };

  const handleRemoveMedia = (index: number) => {
    const fileToRemove = selectedMedia[index];
    const previewUrl = mediaPreviews.get(fileToRemove);
    
    // Revoke the object URL to free memory
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileToRemove);
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
                <span className="text-base font-semibold text-slate-900">
                  {selectedRating != null ? selectedRating.toFixed(1) : '--'}
                </span>
              </div>

              <div className="mt-3">
                <Slider
                  value={[selectedRating || 5]}
                  onValueChange={(values) => {
                    setSelectedRating(values[0]);
                    analyticsEvents.ratings.sliderChanged({
                      courseId: course.id,
                      courseName: course.name,
                      category: "overall",
                      value: values[0],
                    });
                  }}
                  min={0.5}
                  max={10}
                  step={0.1}
                  className="w-full rating-slider-primary"
                  data-tier={getScoreTier(selectedRating ?? 0.5).tier === 'outstanding' ? 'outstanding' : undefined}
                />
              </div>

              {/* Rating badge - uses unified RatingPill component */}
              <div className="mt-4 flex flex-col items-center gap-1">
                <span className="text-xs text-slate-500 tracking-wide uppercase">
                  Your rating summary
                </span>
                <RatingPill score={selectedRating} />
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
                  {/* Label row */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-semibold text-slate-900">{label}</span>
                    <span className={`text-sm font-medium ${score != null ? 'text-slate-700' : 'text-slate-400'}`}>
                      {score != null ? score.toFixed(1) : '--'}
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="mt-2 mb-3">
                    <Slider
                      value={[score ?? 5]}
                      onValueChange={(values) => {
                        setTouched(true);
                        setScore(values[0]);
                      }}
                      min={0.5}
                      max={10}
                      step={0.1}
                      className="w-full rating-slider-breakdown"
                      data-tier={score != null && getScoreTier(score).tier === 'outstanding' ? 'outstanding' : undefined}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Media Upload Section - Section D (dark) */}
            <section className="px-6 pt-6 pb-3 bg-slate-100">
              <div className="py-8 flex flex-col items-center justify-center gap-4">
                {selectedMedia.length > 0 && (
                  <div className="w-full">
                    <div className="grid grid-cols-3 gap-3">
                      {selectedMedia.map((file, index) => {
                        const isVideo = file.type.startsWith('video/');
                        const preview = mediaPreviews.get(file) || '';
                        
                        console.log('[Media Audit] CHECKPOINT C - Thumbnail render:', {
                          index,
                          fileName: file.name,
                          fileType: file.type,
                          isVideo,
                          previewUrl: preview,
                          previewExists: !!preview,
                          previewLength: preview?.length || 0
                        });
                        
                        return (
                          <div key={index} className="relative w-full aspect-square overflow-hidden rounded-md">
                            {isVideo ? (
                              <div className="relative h-full w-full">
                                <img
                                  src={preview}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute bottom-2 right-2 pointer-events-none">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm">
                                    <div className="h-0 w-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-white" style={{ marginLeft: '1px' }} />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={preview}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(index)}
                              className="absolute bottom-2 right-2 min-w-[44px] min-h-[44px] w-7 h-7 bg-red-500/90 text-white rounded-md flex items-center justify-center backdrop-blur-sm hover:bg-red-600 transition-colors"
                              aria-label="Remove media"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {selectedMedia.length === 0 && (
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
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.files) {
                        const files = Array.from(target.files);
                        handleMediaSelected(files);
                      }
                    };
                    input.click();
                  }}
                  variant="outline"
                  disabled={selectedMedia.length >= MAX_REVIEW_MEDIA_ITEMS}
                  className="w-44 mt-6 h-11 rounded-xl border border-slate-600 bg-white px-6 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedMedia.length >= MAX_REVIEW_MEDIA_ITEMS ? `${MAX_REVIEW_MEDIA_ITEMS} of ${MAX_REVIEW_MEDIA_ITEMS} added` : 'Add Media'}
                </Button>
              </div>
            </section>

            {/* Primary CTA Button - Section E (light) */}
            <footer className="px-6 pt-6 mb-3 bg-slate-50">
              {isEditMode ? (
                <div className="flex w-full items-center justify-between gap-3">
                  {/* Remove rating (left) */}
                  <button
                    type="button"
                    onClick={() => setShowRemoveDialog(true)}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 bg-white/80 hover:bg-red-50 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed h-11"
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
              ) : (
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedRating}
                  variant="outline"
                  className="w-full h-11 rounded-xl border border-slate-600 bg-white text-slate-600 text-base font-medium py-3 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving…' : 'Submit rating'}
                </Button>
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
              onBackToCourse={handleClose}
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
  onBackToCourse: () => void;
  onShareReview: () => void;
};

function RatingBadge({ score }: { score: number }) {
  const tierData = getScoreTier(score);

  return (
    <div
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tierData.bg} ${tierData.border} ${tierData.text}`}
    >
      {tierData.label}
    </div>
  );
}

function RatingConfirmationView(props: RatingConfirmationViewProps) {
  const {
    mode,
    courseName,
    courseId,
    userRating,
    breakdown = [],
    communityScore = null,
    onBackToCourse,
    onShareReview,
  } = props;

  const isEdit = mode === 'updated';
  const isNewReview = !isEdit;
  const comparison = getComparisonCopy(userRating, communityScore);

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
    onBackToCourse();
  };

  const title = isEdit ? 'Rating updated' : 'Rating submitted';
  const subtitle = isEdit
    ? `Your updated rating for ${courseName} has been saved.`
    : `Your rating for ${courseName} has been saved.`;

  const overallHeading = isEdit ? 'Updated overall rating' : 'Submitted overall rating';
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* SECTION A – Success header */}
      <section className="bg-slate-50 px-6 pt-16 pb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>

        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </section>

      {/* SECTION B – Overall rating card */}
      <section className="bg-slate-100 px-6 py-6">
        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm border border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {overallHeading}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {userRating.toFixed(1)}
              </p>
            </div>

            <RatingBadge score={userRating} />
          </div>

          {comparisonText && (
            <div className="mt-3 flex items-center gap-1.5">
              {comparisonVariant === 'higher' && (
                <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
              )}
              {comparisonVariant === 'lower' && (
                <ArrowDown className="h-3.5 w-3.5 text-red-500" />
              )}
              {comparisonVariant === 'on-par' && (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
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

      {/* SECTION C – Breakdown (optional) */}
      {breakdown.length > 0 && (
        <section className="bg-slate-50 px-6 py-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">{breakdownHeading}</h2>

          <div className="space-y-4">
            {breakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="font-medium text-slate-900">
                    {item.value.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${(item.value / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* Spacer so actions sit near the bottom */}
      <div className="flex-1 bg-slate-50" />

      {/* SECTION E – Actions row */}
      <section className="bg-slate-50 px-6 pb-8 pt-4">
        <div className="flex gap-3">
          {/* Secondary – share review */}
          <button
            type="button"
            onClick={onShareReview}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-600 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            Share your review
          </button>

          {/* Primary – back to course */}
          <button
            type="button"
            onClick={handleBackToCourse}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-600 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            Back to course
          </button>
        </div>
      </section>
    </div>
  );
}

export default PostPlayRatingModal;
