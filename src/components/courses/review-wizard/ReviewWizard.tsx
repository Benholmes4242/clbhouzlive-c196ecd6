/**
 * Review Wizard - Multi-step review flow
 * Replaces the old single-page PostPlayRatingModal
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { CourseSearchSheet } from '@/components/courses/CourseSearchSheet';
import { cn } from '@/lib/utils';

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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeCourse, setActiveCourse] = useState<ReviewWizardCourse | null>(course);

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

  // Handle view review
  const handleViewReview = useCallback(() => {
    if (wizard.submittedRatingId && activeCourse) {
      onClose();
      navigate(`/courses/${activeCourse.id}`);
    }
  }, [wizard.submittedRatingId, activeCourse, onClose, navigate]);

  // Handle share
  const handleShare = useCallback(() => {
    // TODO: Implement share functionality
    console.log('Share review:', wizard.submittedRatingId);
  }, [wizard.submittedRatingId]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50",
              "bg-background rounded-t-3xl",
              "max-h-[90vh] overflow-hidden",
              "flex flex-col",
              "safe-area-inset-bottom"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex-1">
                <h1 className="font-semibold text-foreground truncate">
                  {showSuccess ? 'Success!' : isEditMode ? 'Edit Review' : 'Rate Course'}
                </h1>
                {activeCourse && !showSuccess && (
                  <p className="text-sm text-muted-foreground truncate">{activeCourse.name}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress */}
            {!showSuccess && <WizardProgress currentStep={wizard.state.step} />}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
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
                    addToTop10={wizard.state.addToTop10}
                    top10Position={wizard.state.top10Position}
                    hasUploadsInProgress={wizard.hasUploadsInProgress}
                    onTop10Change={wizard.setTop10Option}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            {!showSuccess && (
              <WizardNavigation
                currentStep={wizard.state.step}
                canProceed={wizard.canProceed}
                isSubmitting={wizard.isSubmitting}
                hasUploadsInProgress={wizard.hasUploadsInProgress}
                onBack={wizard.prevStep}
                onNext={wizard.nextStep}
                onSubmit={() => wizard.submit()}
              />
            )}
          </motion.div>

          {/* Close confirmation dialog */}
          <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have unsaved changes. Are you sure you want to close without saving?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={confirmClose}>Discard</AlertDialogAction>
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
