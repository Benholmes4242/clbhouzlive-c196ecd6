/**
 * Review Wizard - Multi-step review flow (Full-Screen)
 * Immersive full-viewport experience with scroll-lock
 * 
 * New Flow (for new reviews):
 * Steps 1-4 → Submit → Preview Step → Success/Share-Success
 * 
 * Edit Mode Flow:
 * Steps 1-4 → Submit → Success (skips preview)
 */

import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { CourseSearchSheet } from '@/components/courses/CourseSearchSheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { OverlayPortalProvider } from '@/context/OverlayPortalContext';
import { useToast } from '@/hooks/use-toast';
import { useShareReview } from '@/hooks/useShareReview';
import { Loader2 } from 'lucide-react';

import { WizardHeroImage } from './WizardHeroImage';
import { WizardProgress } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { RateStep, WriteStep, MediaStep, ConfirmStep, PreviewStep } from './steps';
import { SuccessScreen } from './SuccessScreen';
import { useReviewWizard } from './useReviewWizard';
import type { ReviewWizardProps, ReviewWizardCourse, WizardStepExtended } from './types';

export function ReviewWizard({
  course,
  isOpen,
  onClose,
  isEditMode = false,
  existingRating,
  onRemoveFromPlayed,
}: ReviewWizardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { shareReview, isSharing } = useShareReview();
  
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [activeCourse, setActiveCourse] = useState<ReviewWizardCourse | null>(course);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  
  // Overlay portal container for dropdowns/popovers to render within the modal
  const overlayRootRef = useRef<HTMLDivElement>(null);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  
  // Fetch current user profile for preview
  const { data: userProfile } = useQuery({
    queryKey: ['current-user-profile-wizard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: isOpen,
  });
  
  // Set overlay root when modal opens
  useEffect(() => {
    if (isOpen && overlayRootRef.current) {
      setOverlayRoot(overlayRootRef.current);
    } else {
      setOverlayRoot(null);
    }
  }, [isOpen]);

  // Scroll lock - save position and lock body when modal opens
  useLayoutEffect(() => {
    if (!isOpen) return;
    
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Update active course when prop changes
  useEffect(() => {
    if (course) {
      setActiveCourse(course);
    }
  }, [course]);

  const wizard = useReviewWizard({
    course: activeCourse,
    isEditMode,
    existingRating,
    onSuccess: () => {
      // For edit mode - go directly to success
      wizard.goToStep('success');
    },
    onPreview: () => {
      // For new reviews - go to preview step
      wizard.goToStep('preview');
    },
  });

  // Navigation guard while submitting or has unsaved changes
  const hasUnsavedChanges = wizard.state.rating !== null || 
    wizard.state.review.length > 0 || 
    wizard.allMedia.length > 0;

  const isPostSubmit = wizard.state.step === 'preview' || 
    wizard.state.step === 'success' || 
    wizard.state.step === 'share-success';

  useNavigationGuard({
    active: wizard.isSubmitting || (hasUnsavedChanges && !isPostSubmit),
    message: wizard.isSubmitting 
      ? "Your review is still being submitted."
      : "You have unsaved changes. Are you sure you want to leave?",
  });

  // Handle close with confirmation
  const handleClose = useCallback(() => {
    if (isPostSubmit) {
      wizard.cleanup();
      onClose();
      return;
    }

    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      wizard.cleanup();
      onClose();
    }
  }, [hasUnsavedChanges, isPostSubmit, wizard, onClose]);

  const confirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    wizard.cleanup();
    onClose();
  }, [wizard, onClose]);

  // Handle view review - navigate with reviewId query param for deep linking
  const handleViewReview = useCallback(() => {
    if (wizard.submittedRatingId && activeCourse) {
      wizard.cleanup();
      onClose();
      navigate(`/courses/${activeCourse.id}?reviewId=${wizard.submittedRatingId}`);
    }
  }, [wizard.submittedRatingId, activeCourse, wizard, onClose, navigate]);

  // Handle view post - navigate to the shared post
  const handleViewPost = useCallback(() => {
    wizard.cleanup();
    onClose();
    // Navigate to clubhouse/profile where the post would appear
    if (sharedPostId) {
      navigate('/clubhouse');
    } else if (wizard.submittedRatingId && activeCourse) {
      navigate(`/courses/${activeCourse.id}?reviewId=${wizard.submittedRatingId}`);
    }
  }, [sharedPostId, wizard.submittedRatingId, activeCourse, wizard, onClose, navigate]);

  // Handle share from preview step
  const handleShareFromPreview = useCallback(async () => {
    if (!wizard.submittedRatingId || !activeCourse) return;
    
    // Get media for sharing
    const media = wizard.allMedia
      .filter(m => m.uploadedUrl || m.status === 'existing')
      .map(m => ({
        id: m.id,
        media_url: m.uploadedUrl || m.previewUrl,
        media_type: m.type,
        poster_url: m.posterUrl || null,
        stream_id: m.streamId || null,
      }));
    
    const result = await shareReview({
      ratingId: wizard.submittedRatingId,
      courseId: activeCourse.id,
      reviewText: wizard.state.review || null,
      media,
    });
    
    if (result.success) {
      setSharedPostId(result.postId || null);
      wizard.goToStep('share-success');
    }
  }, [wizard, activeCourse, shareReview]);

  // Handle skip share from preview step
  const handleSkipShare = useCallback(() => {
    wizard.goToStep('success');
  }, [wizard]);

  // Handle close from preview step - shows confirmation since review is already saved
  const handleCloseFromPreview = useCallback(() => {
    // Review is already saved, so just close (user can skip share without confirmation)
    wizard.cleanup();
    onClose();
  }, [wizard, onClose]);

  // Handle remove review (edit mode only)
  const handleRemoveReviewClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteReview = useCallback(async () => {
    if (!activeCourse) return;
    
    try {
      await wizard.deleteReview();
      setShowDeleteConfirm(false);
      
      // Show success toast
      toast({
        title: 'Review removed',
        description: 'Your review has been successfully removed.',
      });
      
      // Cleanup and navigate back to course page
      wizard.cleanup();
      navigate(`/courses/${activeCourse.id}`, { replace: true });
    } catch (error) {
      // Error toast is handled in the mutation
      setShowDeleteConfirm(false);
    }
  }, [activeCourse, wizard, toast, navigate]);

  // Handle back within wizard
  const handleBack = useCallback(() => {
    if (wizard.state.step === 1) {
      // On step 1, back should trigger close confirmation if changes made
      if (hasUnsavedChanges) {
        setShowCloseConfirm(true);
      } else {
        handleClose();
      }
    } else if (typeof wizard.state.step === 'number') {
      wizard.prevStep();
    }
  }, [wizard, hasUnsavedChanges, handleClose]);

  // Handle done from success screens
  const handleDone = useCallback(() => {
    wizard.cleanup();
    onClose();
  }, [wizard, onClose]);

  if (!isOpen) return null;

  // Build creator object for preview
  const creator = userProfile ? {
    id: userProfile.id,
    name: userProfile.display_name || userProfile.username || 'You',
    username: userProfile.username || undefined,
    avatar: userProfile.profile_photo_url || undefined,
  } : { id: '', name: 'You' };

  // Determine if we're showing the hero image (only on steps 1-4)
  const showHeroImage = typeof wizard.state.step === 'number';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen container */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              "fixed inset-0 z-[9999]",
              wizard.state.step === 'preview' ? "bg-black" : "bg-[#F8FAFC]",
              "flex flex-col",
              "overscroll-contain"
            )}
            style={{ touchAction: 'pan-y' }}
          >
            {/* Hero image with back button - only on steps 1-4 */}
            {showHeroImage && <WizardHeroImage course={activeCourse} onClose={handleClose} />}

            {/* Content Area - flex-1 with internal structure */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Progress indicator - hidden on post-submit screens */}
              {showHeroImage && (
                <div className="pt-5 pb-4 shrink-0 px-4">
                  <WizardProgress currentStep={wizard.state.step} />
                </div>
              )}

              {/* Step Content - grows to fill, content stays at top */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Overlay portal container for dropdowns */}
                <div ref={overlayRootRef} className="contents" />
                <OverlayPortalProvider container={overlayRoot}>
                  <AnimatePresence mode="wait">
                    {wizard.state.step === 'preview' ? (
                      <PreviewStep
                        key="preview"
                        course={activeCourse}
                        reviewId={wizard.submittedRatingId || ''}
                        rating={wizard.state.rating}
                        breakdowns={wizard.state.breakdowns}
                        title={wizard.state.title}
                        review={wizard.state.review}
                        media={wizard.allMedia}
                        coverMediaId={wizard.state.coverMediaId}
                        creator={creator}
                        onSkip={handleSkipShare}
                        onShare={handleShareFromPreview}
                        onClose={handleCloseFromPreview}
                        isSharing={isSharing}
                      />
                    ) : wizard.state.step === 'success' ? (
                      <SuccessScreen
                        key="success"
                        variant="standard"
                        course={activeCourse}
                        ratingId={wizard.submittedRatingId || ''}
                        onViewReview={handleViewReview}
                        onDone={handleDone}
                      />
                    ) : wizard.state.step === 'share-success' ? (
                      <SuccessScreen
                        key="share-success"
                        variant="shared"
                        course={activeCourse}
                        ratingId={wizard.submittedRatingId || ''}
                        postId={sharedPostId || undefined}
                        onViewPost={handleViewPost}
                        onDone={handleDone}
                      />
                    ) : wizard.state.step === 1 ? (
                      <RateStep
                        key="rate"
                        rating={wizard.state.rating}
                        breakdowns={wizard.state.breakdowns}
                        onRatingChange={wizard.setRating}
                        onBreakdownChange={wizard.setBreakdown}
                      />
                    ) : wizard.state.step === 2 ? (
                      <WriteStep
                        key="write"
                        title={wizard.state.title}
                        review={wizard.state.review}
                        selectedTags={wizard.state.selectedTags}
                        onTitleChange={wizard.setTitle}
                        onReviewChange={wizard.setReview}
                        onTagsChange={wizard.setTags}
                      />
                    ) : wizard.state.step === 3 ? (
                      <MediaStep
                        key="media"
                        media={wizard.allMedia}
                        coverMediaId={wizard.state.coverMediaId}
                        onAddImages={wizard.addImages}
                        onAddVideo={wizard.addVideo}
                        onRemoveMedia={wizard.removeMedia}
                        onSetCover={wizard.setCoverMedia}
                        onRetryMedia={wizard.retryMedia}
                      />
                    ) : (
                      <ConfirmStep
                        key="confirm"
                        course={activeCourse}
                        rating={wizard.state.rating}
                        breakdowns={wizard.state.breakdowns}
                        title={wizard.state.title}
                        review={wizard.state.review}
                        media={wizard.allMedia}
                        hasUploadsInProgress={wizard.hasUploadsInProgress}
                      />
                    )}
                  </AnimatePresence>
                </OverlayPortalProvider>
                
                {/* Spacer pushes navigation to bottom - only on steps 1-4 */}
                {showHeroImage && <div className="flex-1" />}
              </div>
            </div>

            {/* Navigation - hidden on post-submit screens */}
            {showHeroImage && (
              <div className="pb-[env(safe-area-inset-bottom)]">
                <WizardNavigation
                  currentStep={wizard.state.step}
                  canProceed={wizard.canProceed}
                  isSubmitting={wizard.isSubmitting}
                  isEditMode={isEditMode}
                  isDeleting={wizard.isDeleting}
                  onBack={handleBack}
                  onNext={wizard.nextStep}
                  onSubmit={() => wizard.submit()}
                  onRemoveReview={handleRemoveReviewClick}
                />
              </div>
            )}
          </motion.div>

          {/* Close confirmation dialog */}
          <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
            <AlertDialogContent className="z-[10000] rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Discard review?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your review isn't saved. Are you sure you want to leave?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Keep editing</AlertDialogCancel>
                <Button variant="destructive" onClick={confirmClose} className="rounded-xl">Discard</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete review confirmation dialog */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent className="z-[10000] rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this review?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Your review will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={wizard.isDeleting} className="rounded-xl">Cancel</AlertDialogCancel>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteReview}
                  disabled={wizard.isDeleting}
                  className="rounded-xl"
                >
                  {wizard.isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Removing...
                    </>
                  ) : (
                    'Remove Review'
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Course search for adding another review - REMOVED per requirements */}
          <CourseSearchSheet
            isOpen={showCourseSearch}
            onClose={() => setShowCourseSearch(false)}
            onSelectCourse={() => {}}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}