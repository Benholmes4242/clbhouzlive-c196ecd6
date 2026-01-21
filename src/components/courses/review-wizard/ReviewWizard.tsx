/**
 * Review Wizard - Multi-step review flow (Full-Screen)
 * Immersive full-viewport experience with scroll-lock
 */

import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { CourseSearchSheet } from '@/components/courses/CourseSearchSheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { OverlayPortalProvider } from '@/context/OverlayPortalContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import { WizardHeroImage } from './WizardHeroImage';
import { WizardProgress } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { RateStep, WriteStep, MediaStep, ConfirmStep } from './steps';
import { SuccessScreen } from './SuccessScreen';
import { useReviewWizard } from './useReviewWizard';
import type { ReviewWizardProps, ReviewWizardCourse } from './types';

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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeCourse, setActiveCourse] = useState<ReviewWizardCourse | null>(course);
  
  // Overlay portal container for dropdowns/popovers to render within the modal
  const overlayRootRef = useRef<HTMLDivElement>(null);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  
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
      setShowSuccess(true);
    },
  });

  // Navigation guard while submitting or has unsaved changes
  const hasUnsavedChanges = wizard.state.rating !== null || 
    wizard.state.review.length > 0 || 
    wizard.allMedia.length > 0;

  useNavigationGuard({
    active: wizard.isSubmitting || (hasUnsavedChanges && !showSuccess),
    message: wizard.isSubmitting 
      ? "Your review is still being submitted."
      : "You have unsaved changes. Are you sure you want to leave?",
  });

  // Handle close with confirmation
  const handleClose = useCallback(() => {
    if (showSuccess) {
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
  }, [hasUnsavedChanges, showSuccess, wizard, onClose]);

  const confirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    wizard.cleanup();
    onClose();
  }, [wizard, onClose]);

  // Handle adding another review
  const handleAddAnother = useCallback(() => {
    setShowSuccess(false);
    setShowCourseSearch(true);
  }, []);

  // Handle course selection for another review
  const handleCourseSelect = useCallback((courseData: any) => {
    setShowCourseSearch(false);
    setActiveCourse({
      id: courseData.id,
      name: courseData.name,
      thumbnail_image: courseData.thumbnail_image,
      country: courseData.country,
      sub_country: courseData.sub_country,
      region: courseData.region,
    });
    wizard.reset();
  }, [wizard]);

  // Handle view review - navigate with reviewId query param for deep linking
  const handleViewReview = useCallback(() => {
    if (wizard.submittedRatingId && activeCourse) {
      onClose();
      navigate(`/courses/${activeCourse.id}?reviewId=${wizard.submittedRatingId}`);
    }
  }, [wizard.submittedRatingId, activeCourse, onClose, navigate]);

  // Handle share to Clubhouse - navigate to share preview page
  // NOTE: We navigate directly WITHOUT calling onClose() because onClose() 
  // triggers RateCoursePage's handleClose which also navigates and wins the race
  const handleShare = useCallback(async () => {
    if (!wizard.submittedRatingId || !activeCourse) return;
    
    // Cleanup wizard state first
    wizard.cleanup();
    
    // Navigate to share preview route - replace current route to avoid back-nav issues
    navigate(`/courses/${activeCourse.id}/share-review/${wizard.submittedRatingId}`, { replace: true });
  }, [wizard.submittedRatingId, activeCourse, wizard, navigate]);

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
    } else {
      wizard.prevStep();
    }
  }, [wizard, hasUnsavedChanges, handleClose]);

  if (!isOpen) return null;

  const isFirstStep = wizard.state.step === 1;

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
              "bg-[#F8FAFC]",
              "flex flex-col",
              "overscroll-contain"
            )}
            style={{ touchAction: 'pan-y' }}
          >
            {/* Hero image with back button */}
            {!showSuccess && <WizardHeroImage course={activeCourse} onClose={handleClose} />}

            {/* Content Area - flex-1 with internal structure */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Progress indicator with breathing room */}
              {!showSuccess && (
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
                {showSuccess ? (
                  <SuccessScreen
                    key="success"
                    course={activeCourse}
                    ratingId={wizard.submittedRatingId || ''}
                    onViewReview={handleViewReview}
                    onAddAnother={handleAddAnother}
                    onClose={handleClose}
                    onShare={handleShare}
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
                    onTitleChange={wizard.setTitle}
                    onReviewChange={wizard.setReview}
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
              
              {/* Spacer pushes navigation to bottom */}
              {!showSuccess && <div className="flex-1" />}
              </div>
            </div>

            {/* Navigation - fixed at bottom with safe area */}
            {!showSuccess && (
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

          {/* Course search for adding another review */}
          <CourseSearchSheet
            isOpen={showCourseSearch}
            onClose={() => setShowCourseSearch(false)}
            onSelectCourse={handleCourseSelect}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
