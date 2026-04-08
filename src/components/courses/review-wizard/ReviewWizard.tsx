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
  
  const { shareReview, isSharing } = useShareReview();
  const { activeActor, availableActors } = useActiveActor();
  

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [showPostingOptions, setShowPostingOptions] = useState(false);
  const [activeCourse, setActiveCourse] = useState<ReviewWizardCourse | null>(course);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const [autoShareComplete, setAutoShareComplete] = useState(false);
  const [isAutoSharing, setIsAutoSharing] = useState(false);
  const autoShareAttempted = useRef(false);
  
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

  // ---- AUTO-SHARE for new reviews ----
  useEffect(() => {
    if (
      wizard.state.step === 'success' &&
      !isEditMode &&
      !alreadyShared &&
      !autoShareAttempted.current &&
      wizard.submittedRatingId &&
      activeCourse
    ) {
      autoShareAttempted.current = true;
      setIsAutoSharing(true);

      (async () => {
        try {
          // Fetch media from DB (same as handleShareFromPreview)
          const { data: dbMedia } = await supabase
            .from('course_review_media')
            .select('id, media_url, media_type, poster_url, stream_id, is_cover')
            .eq('review_id', wizard.submittedRatingId!)
            .in('status', ['attached', 'ready'])
            .order('created_at', { ascending: true });

          const media = (dbMedia || []).map(m => ({
            id: m.id,
            media_url: m.media_url,
            media_type: m.media_type,
            poster_url: m.poster_url,
            stream_id: m.stream_id,
            is_cover: m.is_cover ?? false,
          }));

          const result = await shareReview({
            ratingId: wizard.submittedRatingId!,
            courseId: activeCourse.id,
            reviewText: wizard.state.review || null,
            media,
          });

          if (result.success) {
            setSharedPostId(result.postId || null);
            setAutoShareComplete(true);
            // Invalidate feed queries
            queryClient.invalidateQueries({ queryKey: ['media-feed'] });
            queryClient.invalidateQueries({ queryKey: ['media-feed', 'suggested'] });
            queryClient.invalidateQueries({ queryKey: ['media-feed', 'friends'] });
            queryClient.invalidateQueries({ queryKey: ['review-shared', wizard.submittedRatingId] });
          }
        } catch (err) {
          console.error('[ReviewWizard] Auto-share failed:', err);
        } finally {
          setIsAutoSharing(false);
        }
      })();
    }
  }, [wizard.state.step, isEditMode, alreadyShared, wizard.submittedRatingId, activeCourse]);

  // ---- OPT-OUT: remove shared post ----
  const handleOptOutShare = useCallback(async () => {
    if (!wizard.submittedRatingId) return;
    try {
      await supabase
        .from('posts')
        .delete()
        .eq('source_review_id', wizard.submittedRatingId);

      setSharedPostId(null);
      setAutoShareComplete(false);

      queryClient.invalidateQueries({ queryKey: ['media-feed'] });
      queryClient.invalidateQueries({ queryKey: ['media-feed', 'suggested'] });
      queryClient.invalidateQueries({ queryKey: ['media-feed', 'friends'] });
      queryClient.invalidateQueries({ queryKey: ['review-shared', wizard.submittedRatingId] });
      queryClient.invalidateQueries({ queryKey: ['trending-posts'] });
      queryClient.invalidateQueries({ queryKey: ['actor-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });

      toast.success('Removed from Clubhouse');
    } catch (err) {
      console.error('[ReviewWizard] Opt-out share failed:', err);
      toast.error('Could not remove. Try again.');
    }
  }, [wizard.submittedRatingId, queryClient]);

  // Navigation guard
  const hasUnsavedChanges = wizard.state.rating !== null || 
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
    if (!wizard.submittedRatingId || !activeCourse) return;
    
    const { data: dbMedia, error: mediaError } = await supabase
      .from('course_review_media')
      .select('id, media_url, media_type, poster_url, stream_id, is_cover')
      .eq('review_id', wizard.submittedRatingId)
      .in('status', ['attached', 'ready'])
      .order('created_at', { ascending: true });
    
    if (mediaError) {
      console.error('[ShareReview] Failed to fetch review media:', mediaError);
    }
    
    const media = (dbMedia || []).map(m => ({
      id: m.id,
      media_url: m.media_url,
      media_type: m.media_type,
      poster_url: m.poster_url,
      stream_id: m.stream_id,
      is_cover: m.is_cover ?? false,
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
                        previousRating={existingRating?.rating ?? null}
                        isAutoSharing={isAutoSharing}
                        autoShareComplete={autoShareComplete}
                        onViewReview={handleViewReview}
                        onGoToClubhouse={handleGoToClubhouse}
                        onDone={handleDone}
                        onOptOutShare={handleOptOutShare}
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