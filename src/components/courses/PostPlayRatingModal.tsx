import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatCourseLocation, formatCourseLocationShort } from '@/utils/courseLocation';
import { useReviewVideoUpload, getFileKey } from '@/hooks/useReviewVideoUpload';
import { useShareReview } from '@/hooks/useShareReview';
import { useOptimisticRatingUpdate } from '@/hooks/useOptimisticRatingUpdate';

import {
  type PostPlayRatingModalProps,
  type ExistingMedia,
  useRatingFormState,
  useExistingRating,
  useSubmitRating,
  useRemoveRating,
  useMediaSelection,
  RatingFormSkeleton,
  OverallRatingSection,
  ReviewTextSection,
  BreakdownSlidersSection,
  MediaUploadSection,
  RatingFormFooter,
  RemoveConfirmDialog,
  RatingConfirmationView,
  ANIMATION_TIMINGS,
  BUTTON_TEXT,
} from './post-play-rating';

// Track if modal is being unmounted
let isUnmounting = false;

const PostPlayRatingModal = ({ 
  course, 
  isOpen, 
  onClose, 
  isEditMode = false,
  existingRating: existingRatingProp,
  onRemoveFromPlayed,
  isLoading = false
}: PostPlayRatingModalProps) => {
  
  const { optimisticNewRating, optimisticEditRating, rollback, scheduleBackgroundSync } = useOptimisticRatingUpdate();
  
  // Capture flow type once on mount
  const [flowType] = useState<'create' | 'edit'>(isEditMode ? 'edit' : 'create');
  const isEditFlow = flowType === 'edit';
  
  // Upload session ID - stable for the life of this modal instance
  const uploadSessionIdRef = useRef(crypto.randomUUID());
  const uploadSessionId = uploadSessionIdRef.current;
  
  // Track if submit completed successfully
  const submitCompletedRef = useRef(false);
  
  // Current user ID for upload ownership
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Form state management (consolidated from 30+ useState calls)
  const formState = useRatingFormState({ isEditMode, existingRating: existingRatingProp });
  const { state, prevTierRef, prevBreakdownTiersRef, totalMediaCount } = formState;
  
  // Navigation guard while submitting
  useNavigationGuard({
    active: state.isSubmitting,
    message: "Your rating is still being submitted.",
  });
  
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
    onError: (msg) => toast.error('Upload failed', { description: msg }),
  });
  
  // Cleanup pending videos on unmount
  useEffect(() => {
    isUnmounting = false;
    resetCleanupFlag();
    submitCompletedRef.current = false;
    
    return () => {
      isUnmounting = true;
      if (!submitCompletedRef.current) {
        cleanupPending().catch(err => {
          console.warn('[Rating] Unmount cleanup error (non-blocking):', err);
        });
      }
    };
  }, [uploadSessionId]);
  
  // Share review hook
  const { notifyReviewShared, isSharing } = useShareReview();
  
  // Existing rating data fetching
  const { existingRating, fetchExistingMedia } = useExistingRating({
    courseId: course?.id,
    isEditMode,
    existingRatingProp,
    onPopulate: formState.populateFromExisting,
  });
  
  // Populate form with existing rating data in edit mode
  useEffect(() => {
    if (existingRating && isEditMode) {
      fetchExistingMedia(existingRating.id).then((media) => {
        formState.populateFromExisting(existingRating, media);
      });
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
  
  // Media selection hook
  const { handleMediaSelected } = useMediaSelection({
    totalMediaCount: totalMediaCount + videoDrafts.length,
    onImagesAdded: formState.addImages,
    onVideoUpload: uploadVideo,
    setLocalVideoPosters: (fn) => {
      formState.setLocalVideoPosters(fn(state.localVideoPosters));
    },
  });
  
  // Submit rating mutation
  const submitRatingMutation = useSubmitRating({
    course,
    isEditMode,
    existingRating,
    videoDrafts,
    attachToReview,
    resetVideoDrafts,
    onOptimisticUpdate: async (rating) => {
      if (!course?.id) return undefined;
      if (isEditFlow && existingRating?.rating) {
        return await optimisticEditRating(course.id, rating, existingRating.rating);
      } else {
        return await optimisticNewRating(course.id, rating);
      }
    },
    onRollback: rollback,
    scheduleBackgroundSync,
    onSuccess: async (ratingId) => {
      submitCompletedRef.current = true;
      formState.setSubmittedRatingId(ratingId);
      formState.clearLocalMedia();
      
      // Refetch media from DB
      const mediaData = await fetchExistingMedia(ratingId);
      formState.setExistingMedia(mediaData);
      
      const hasAnyMedia = mediaData.length > 0 || state.selectedImages.length > 0 || videoDrafts.length > 0;
      
      formState.setButtonText(BUTTON_TEXT.added);
      setTimeout(() => {
        if (!hasAnyMedia) {
          toast.success(isEditMode ? 'Rating updated' : 'Rating saved');
          formState.setIsSubmitting(false);
          formState.setButtonText(BUTTON_TEXT.addToPlayed);
          onClose();
        } else {
          formState.setShowConfirmation(true);
          formState.setIsSubmitting(false);
          formState.setButtonText(BUTTON_TEXT.addToPlayed);
        }
      }, ANIMATION_TIMINGS.successButtonDelay);
    },
    onError: () => {
      formState.setIsSubmitting(false);
      formState.setButtonText(BUTTON_TEXT.addToPlayed);
    },
  });
  
  // Remove rating mutation
  const removeFromPlayedMutation = useRemoveRating({
    course,
    existingRating,
    onSuccess: () => {
      formState.setIsDeleted(true);
      
      setTimeout(() => {
        formState.setIsFadingOut(true);
      }, ANIMATION_TIMINGS.deleteSuccessFadeStart);
      
      setTimeout(() => {
        if (onRemoveFromPlayed) {
          onRemoveFromPlayed();
        }
        formState.setShowRemoveDialog(false);
        formState.setIsDeleted(false);
        formState.setIsFadingOut(false);
        onClose();
        formState.resetForm();
      }, ANIMATION_TIMINGS.deleteSuccessClose);
    },
  });
  
  // Normalize value to 1 decimal place
  const normalize = (value: number | null | undefined): number | null => {
    if (value == null) return null;
    return parseFloat(value.toFixed(1));
  };
  
  const handleSubmit = async () => {
    if (!state.overallRating) {
      toast.error("Rating required", { description: "Please leave at least an overall rating" });
      return;
    }

    formState.setIsSubmitting(true);
    formState.setButtonText(BUTTON_TEXT.adding);
    
    submitRatingMutation.mutate({
      rating: normalize(state.overallRating) || 5,
      reviewText: state.reviewText.trim(),
      imageFiles: state.selectedImages,
      design: state.designTouched ? normalize(state.designScore) : null,
      condition: state.conditionTouched ? normalize(state.conditionScore) : null,
      clubhouse: state.clubhouseTouched ? normalize(state.clubhouseScore) : null,
      facilities: state.facilitiesTouched ? normalize(state.facilitiesScore) : null,
    });
  };
  
  const handleClose = async () => {
    if (!submitCompletedRef.current) {
      await cleanupPending();
    }
    onClose();
    formState.resetForm();
  };
  
  const handleRemoveImage = (index: number) => {
    const fileToRemove = state.selectedImages[index];
    const fileKey = getFileKey(fileToRemove);
    const previewUrl = state.imagePreviews.get(fileKey);
    formState.removeImage(index, fileKey, previewUrl);
  };
  
  const handleRemoveExistingMedia = async (id: string) => {
    const { error } = await supabase
      .from('course_review_media')
      .delete()
      .eq('id', id);
    
    if (!error) {
      formState.setExistingMedia(state.existingMediaItems.filter(m => m.id !== id));
    } else {
      toast.error("Couldn't remove media");
    }
  };
  
  const triggerMediaPicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';

    const cleanup = () => {
      try { input.value = ''; } catch { /* no-op */ }
      input.remove();
    };

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const picked = Array.from(target.files || []);
      if (picked.length > 0) {
        handleMediaSelected(picked);
      }
      cleanup();
    };

    document.body.appendChild(input);
    input.click();
  };

  // Show skeleton while loading
  if (isLoading || !course) {
    return <RatingFormSkeleton />;
  }

  return (
    <>
      <div className="fixed inset-0 z-[999] bg-background overflow-y-auto">
        {!state.showConfirmation ? (
          <div>
            {/* Hero Image */}
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              
              <button
                type="button"
                onClick={handleClose}
                className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>

              <div className="absolute inset-x-0 bottom-4 px-4">
                <h1 className="text-4xl md:text-5xl font-semibold text-white drop-shadow-2xl mb-1.5">
                  {course.name}
                </h1>
                <p className="text-lg md:text-xl text-white opacity-90 drop-shadow-lg">
                  {formatCourseLocation(course)}
                </p>
              </div>
            </div>

            <OverallRatingSection
              courseId={course.id}
              courseName={course.name}
              rating={state.overallRating}
              isEditMode={isEditMode}
              isSubmitting={state.isSubmitting}
              justEnteredExceptional={state.justEnteredExceptional}
              onRatingChange={formState.setOverallRating}
              onExceptionalEntered={() => formState.setJustEnteredExceptional(!state.justEnteredExceptional)}
              prevTierRef={prevTierRef}
            />

            <ReviewTextSection
              value={state.reviewText}
              onChange={formState.setReviewText}
              disabled={state.isSubmitting}
            />

            <BreakdownSlidersSection
              isEditMode={isEditMode}
              scores={{
                design: state.designScore,
                condition: state.conditionScore,
                clubhouse: state.clubhouseScore,
                facilities: state.facilitiesScore,
              }}
              exceptionalEntry={state.breakdownExceptionalEntry}
              onScoreChange={formState.setBreakdownScore}
              onTouchChange={formState.setBreakdownTouched}
              onExceptionalEntry={formState.setBreakdownExceptionalEntry}
              prevBreakdownTiersRef={prevBreakdownTiersRef}
              disabled={state.isSubmitting}
            />

            <MediaUploadSection
              existingMediaItems={state.existingMediaItems}
              selectedImages={state.selectedImages}
              imagePreviews={state.imagePreviews}
              videoDrafts={videoDrafts}
              localVideoPosters={state.localVideoPosters}
              onRemoveExistingMedia={handleRemoveExistingMedia}
              onRemoveImage={handleRemoveImage}
              onRemoveVideo={removeVideo}
              onRetryPoster={retryPoster}
              onAddMedia={triggerMediaPicker}
              disabled={state.isSubmitting}
            />

            <RatingFormFooter
              isEditMode={isEditMode}
              isSubmitting={state.isSubmitting}
              isFormValid={!!state.overallRating}
              onSubmit={handleSubmit}
              onRemove={() => formState.setShowRemoveDialog(true)}
            />
          </div>
        ) : (
          <RatingConfirmationView
            mode={isEditFlow ? 'updated' : 'submitted'}
            courseName={course!.name}
            courseId={course!.id}
            ratingId={state.submittedRatingId || existingRating?.id || ''}
            userRating={state.overallRating || 0}
            reviewText={state.reviewText.trim() || null}
            breakdown={[
              state.designScore != null && state.designTouched ? { label: 'Course Design', value: state.designScore } : null,
              state.conditionScore != null && state.conditionTouched ? { label: 'Course Condition', value: state.conditionScore } : null,
              state.clubhouseScore != null && state.clubhouseTouched ? { label: 'Clubhouse', value: state.clubhouseScore } : null,
              state.facilitiesScore != null && state.facilitiesTouched ? { label: 'Facilities', value: state.facilitiesScore } : null,
            ].filter((item): item is { label: string; value: number } => item !== null)}
            communityScore={null}
            submittedMedia={state.existingMediaItems}
            heroImageUrl={course?.thumbnail_image || null}
            heroSubtitle={course ? formatCourseLocationShort(course) : ''}
            onBack={handleClose}
            onShareReview={async () => {
              const ratingId = state.submittedRatingId || existingRating?.id;
              if (!ratingId) {
                return { success: false };
              }
              const result = await notifyReviewShared({ ratingId });
              return result || { success: false };
            }}
          />
        )}
      </div>

      <RemoveConfirmDialog
        isOpen={state.showRemoveDialog}
        courseName={course?.name || ''}
        isDeleted={state.isDeleted}
        isFadingOut={state.isFadingOut}
        onCancel={() => formState.setShowRemoveDialog(false)}
        onConfirm={() => removeFromPlayedMutation.mutate()}
      />
    </>
  );
};

export default PostPlayRatingModal;
