/**
 * Review Wizard - Multi-step review flow (Full-Screen)
 * Immersive full-viewport experience with scroll-lock
 * 
 * Flow: Steps 1-3 → Submit → Success (auto-share for new reviews)
 */

import React, { useState, useEffect, useCallback, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { CourseSearchSheet } from '@/components/courses/CourseSearchSheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { OverlayPortalProvider } from '@/context/OverlayPortalContext';
import { toast } from 'sonner';
import { useShareReview } from '@/hooks/useShareReview';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { Loader2 } from 'lucide-react';
import { StudioEdits } from '@/types/studio';

import { WizardHeader } from './WizardHeader';
import { WizardProgress } from './WizardProgress';
import { DiscardActionSheet } from './DiscardActionSheet';
import { RemoveReviewActionSheet } from './RemoveReviewActionSheet';
import { ReviewPostingOptionsSheet, ReviewVisibility } from './ReviewPostingOptionsSheet';
import { RateStep, WriteStep, PostStep } from './steps';
import { SuccessScreen } from './SuccessScreen';
import { useReviewWizard } from './useReviewWizard';
import type { ReviewWizardProps, ReviewWizardCourse, WizardStepExtended } from './types';

export function ReviewWizard({
  course,
  isOpen,
  onClose,
  isEditMode = false,
  alreadyShared = false,
  existingRating,
  onRemoveFromPlayed,
  initialMediaFiles,
}: ReviewWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { notifyReviewShared, isSharing } = useShareReview();
  const { activeActor, availableActors } = useActiveActor();
  

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [showPostingOptions, setShowPostingOptions] = useState(false);
  const [activeCourse, setActiveCourse] = useState<ReviewWizardCourse | null>(course);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  // D31/D34: autoShareComplete + isAutoSharing removed; auto-share runs in
  // background and the success screen renders immediately.
  const autoShareAttempted = useRef(false);
  // Freeze previousRating at mount so it survives existingRating refetches
  const previousRatingRef = useRef<number | null>(existingRating?.rating ?? null);
  const stablePreviousRating = previousRatingRef.current;
  
  // Studio edits state (retained for media display)
  const [studioEditsByMediaId, setStudioEditsByMediaId] = useState<Record<string, StudioEdits>>({});
  const [reviewActiveMediaId, setReviewActiveMediaId] = useState<string | null>(null);
  
  // Actor and visibility state
  const [selectedActor, setSelectedActor] = useState(activeActor);
  const [visibility, setVisibility] = useState<ReviewVisibility>('anyone');
  
  // Sync with global actor on open (but only use personal for reviews)
  useEffect(() => {
    if (isOpen && activeActor) {
      const personalActor = availableActors.find(a => a.type === 'personal');
      if (personalActor) {
        setSelectedActor(personalActor);
      } else {
        setSelectedActor(activeActor);
      }
    }
  }, [isOpen, activeActor, availableActors]);
  
  // Overlay portal container
  const overlayRootRef = useRef<HTMLDivElement>(null);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  
  // Fetch current user profile
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
  
  useEffect(() => {
    if (isOpen && overlayRootRef.current) {
      setOverlayRoot(overlayRootRef.current);
    } else {
      setOverlayRoot(null);
    }
  }, [isOpen]);

  // Scroll lock
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
    initialMediaFiles,
    onSuccess: () => {
      wizard.goToStep('success');
    },
  });

  // All steps use light status bar
  useMedianStatusBar("light", "transparent", isOpen, false);

  // ---- AUTO-SHARE NOTIFICATION for new reviews ----
  // Media copy is handled server-side by trg_sync_review_media_to_post_media.
  // We wait briefly for uploads + triggers to settle, then invalidate feeds
  // and fire analytics with accurate media counts.
  useEffect(() => {
    if (
      wizard.state.step === 'success' &&
      !isEditMode &&
      !alreadyShared &&
      !autoShareAttempted.current &&
      wizard.submittedRatingId
    ) {
      autoShareAttempted.current = true;

      const timer = window.setTimeout(async () => {
        try {
          const result = await notifyReviewShared({
            ratingId: wizard.submittedRatingId!,
          });
          if (result.success) {
            setSharedPostId(result.postId || null);
          }
        } catch (err) {
          console.error('[ReviewWizard] Auto-share notify failed:', err);
        }
      }, 1500);

      return () => window.clearTimeout(timer);
    }
  }, [wizard.state.step, isEditMode, alreadyShared, wizard.submittedRatingId, notifyReviewShared]);

  // D31/D34: handleOptOutShare removed — opt-out UI is gone. Auto-share runs in
  // the background; users who don't want their review shared can delete the
  // post from their feed afterward.

  // Navigation guard
  const hasAnyBreakdown = Object.values(wizard.state.breakdowns).some(v => v !== null);
  const hasUnsavedChanges = wizard.state.rating !== null ||
    hasAnyBreakdown ||
    wizard.state.review.length > 0 ||
    wizard.allMedia.length > 0;

  const isPostSubmit = wizard.state.step === 'success' || 
    wizard.state.step === 'share-success';

  useNavigationGuard({
    active: wizard.isSubmitting || (hasUnsavedChanges && !isPostSubmit),
    message: wizard.isSubmitting 
      ? "Your review is still being submitted."
      : "You have unsaved changes. Are you sure you want to leave?",
  });

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

  const handleViewReview = useCallback(() => {
    if (wizard.submittedRatingId && activeCourse) {
      wizard.cleanup();
      onClose();
      navigate(`/courses/${activeCourse.id}?tab=reviews&review=${wizard.submittedRatingId}`, { replace: true });
    }
  }, [wizard.submittedRatingId, activeCourse, wizard, onClose, navigate]);

  const handleGoToClubhouse = useCallback(() => {
    wizard.cleanup();
    onClose();
    if (sharedPostId) {
      navigate(`/clubhouse?focusPostId=${sharedPostId}`);
    } else {
      navigate('/clubhouse');
    }
  }, [sharedPostId, wizard, onClose, navigate]);

  const handleViewPost = useCallback(() => {
    wizard.cleanup();
    onClose();
    if (sharedPostId) {
      navigate(`/clubhouse?focusPostId=${sharedPostId}`);
    } else if (wizard.submittedRatingId && activeCourse) {
      navigate(`/courses/${activeCourse.id}?tab=reviews&review=${wizard.submittedRatingId}`);
    }
  }, [sharedPostId, wizard.submittedRatingId, activeCourse, wizard, onClose, navigate]);

  const handleShareFromPreview = useCallback(async () => {
    if (!wizard.submittedRatingId) return;
    const result = await notifyReviewShared({
      ratingId: wizard.submittedRatingId,
    });
    if (result.success) {
      setSharedPostId(result.postId || null);
      wizard.goToStep('share-success');
    }
  }, [wizard, notifyReviewShared]);

  const handleDone = useCallback(() => {
    wizard.cleanup();
    onClose();
  }, [wizard, onClose]);

  const handleRemoveReviewClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteReview = useCallback(async () => {
    if (!activeCourse) return;
    
    try {
      await wizard.deleteReview();
      setShowDeleteConfirm(false);
      toast.success('Review removed');
      wizard.cleanup();
      navigate(`/courses/${activeCourse.id}`, { replace: true });
    } catch (error) {
      setShowDeleteConfirm(false);
    }
  }, [activeCourse, wizard, toast, navigate]);

  const handleBack = useCallback(() => {
    if (wizard.state.step === 1) {
      if (hasUnsavedChanges) {
        setShowCloseConfirm(true);
      } else {
        handleClose();
      }
    } else if (typeof wizard.state.step === 'number') {
      wizard.prevStep();
    }
  }, [wizard, hasUnsavedChanges, handleClose]);

  if (!isOpen) return null;

  const showStepUI = typeof wizard.state.step === 'number';

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
              "light fixed inset-0 z-[9999]",
              "flex flex-col",
              "overscroll-contain"
            )}
            style={{ 
              touchAction: 'pan-y',
              backgroundColor: 'var(--bg-page)',
            }}
          >
            {/* Header */}
            {showStepUI && (
              <WizardHeader
                currentStep={wizard.state.step}
                totalSteps={3}
                isEditMode={isEditMode}
                canProceed={wizard.canProceed}
                isSubmitting={wizard.isSubmitting}
                isDeleting={wizard.isDeleting}
                isLoadingUser={wizard.isLoadingUser}
                selectedActor={selectedActor}
                onBack={handleBack}
                onNext={wizard.nextStep}
                onSubmit={() => wizard.submit()}
                onClose={handleClose}
                onDelete={handleRemoveReviewClick}
                onOpenProfileSelector={() => setShowPostingOptions(true)}
              />
            )}

            {/* Progress bar */}
            {showStepUI && (
              <WizardProgress currentStep={wizard.state.step} totalSteps={3} />
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                <div ref={overlayRootRef} className="contents" />
                <OverlayPortalProvider container={overlayRoot}>
                  <AnimatePresence mode="wait">
                    {wizard.state.step === 'success' ? (
                      <SuccessScreen
                        key="success"
                        variant="standard"
                        course={activeCourse}
                        ratingId={wizard.submittedRatingId || ''}
                        rating={wizard.state.rating}
                        isEditMode={isEditMode}
                        previousRating={stablePreviousRating}
                        onViewReview={handleViewReview}
                        onGoToClubhouse={handleGoToClubhouse}
                        onDone={handleDone}
                      />
                    ) : wizard.state.step === 'share-success' ? (
                      <SuccessScreen
                        key="share-success"
                        variant="shared"
                        course={activeCourse}
                        ratingId={wizard.submittedRatingId || ''}
                        rating={wizard.state.rating}
                        postId={sharedPostId || undefined}
                        onViewPost={handleViewPost}
                        onDone={handleDone}
                      />
                    ) : wizard.state.step === 1 ? (
                      <RateStep
                        key="rate"
                        rating={wizard.state.rating}
                        breakdowns={wizard.state.breakdowns}
                        course={activeCourse}
                        isLegacyMigration={wizard.isLegacyMigration}
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
                      <PostStep
                        key="post"
                        course={activeCourse}
                        rating={wizard.state.rating}
                        breakdowns={wizard.state.breakdowns}
                        title={wizard.state.title}
                        review={wizard.state.review}
                        media={wizard.allMedia}
                        coverMediaId={wizard.state.coverMediaId}
                        selectedTags={wizard.state.selectedTags}
                        hasUploadsInProgress={wizard.hasUploadsInProgress}
                        isEditMode={isEditMode}
                        isSubmitting={wizard.isSubmitting}
                        onAddImages={wizard.addImages}
                        onAddVideo={wizard.addVideo}
                        onRemoveMedia={wizard.removeMedia}
                        onSetCover={wizard.setCoverMedia}
                        onRetryMedia={wizard.retryMedia}
                        onReorderMedia={wizard.reorderMedia}
                        onGoToStep={(step) => wizard.goToStep(step)}
                        onSubmit={() => wizard.submit()}
                      />
                    ) : null}
                  </AnimatePresence>
                </OverlayPortalProvider>
              </div>

              {/* Scroll fade indicator */}
              {typeof wizard.state.step === 'number' && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-page)] to-transparent pointer-events-none z-10" />
              )}
            </div>
          </motion.div>

          {/* Apple-style Exit Confirmation Action Sheet */}
          <DiscardActionSheet
            open={showCloseConfirm}
            onDiscard={confirmClose}
            onKeepEditing={() => setShowCloseConfirm(false)}
            isEditMode={isEditMode}
          />

          {/* Account & Visibility Bottom Sheet */}
          <ReviewPostingOptionsSheet
            isOpen={showPostingOptions}
            onClose={() => setShowPostingOptions(false)}
            selectedActor={selectedActor}
            availableActors={availableActors}
            visibility={visibility}
            onActorChange={setSelectedActor}
            onVisibilityChange={setVisibility}
          />

          {/* Remove Review Confirmation Action Sheet */}
          <RemoveReviewActionSheet
            open={showDeleteConfirm}
            onCancel={() => setShowDeleteConfirm(false)}
            onRemove={confirmDeleteReview}
            isRemoving={wizard.isDeleting}
          />

          {/* Course Search Sheet */}
          <CourseSearchSheet
            isOpen={showCourseSearch}
            onClose={() => setShowCourseSearch(false)}
            onSelectCourse={(selectedCourse) => {
              setActiveCourse(selectedCourse);
              setShowCourseSearch(false);
            }}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}