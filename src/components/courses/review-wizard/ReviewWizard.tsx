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

import React, { useState, useEffect, useCallback, useLayoutEffect, useRef, useMemo } from 'react';
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
import { useActiveActor } from '@/context/ActiveActorContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { Loader2 } from 'lucide-react';
import { StudioTool, StudioEdits } from '@/types/studio';
import StudioShelf from '@/components/studio/StudioShelf';
import { MomentBadgesSheet } from '@/components/post/create-moment/sheets';

import { WizardHeader } from './WizardHeader';
import { WizardHeroImage } from './WizardHeroImage';
import { WizardProgress } from './WizardProgress';
import { DiscardActionSheet } from './DiscardActionSheet';
import { RemoveReviewActionSheet } from './RemoveReviewActionSheet';
import { ReviewPostingOptionsSheet, ReviewVisibility } from './ReviewPostingOptionsSheet';
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
  initialMediaFiles,
}: ReviewWizardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { shareReview, isSharing } = useShareReview();
  const { activeActor, availableActors } = useActiveActor();
  
  // Status bar is set dynamically after wizard state is available (see below)
  

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [showPostingOptions, setShowPostingOptions] = useState(false);
  const [activeCourse, setActiveCourse] = useState<ReviewWizardCourse | null>(course);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  
  // Studio & Badges state
  const [showStudio, setShowStudio] = useState(false);
  const [studioTool, setStudioTool] = useState<StudioTool>(null);
  const [isPositioningText, setIsPositioningText] = useState(false);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [showBadgesSheet, setShowBadgesSheet] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [studioEditsByMediaId, setStudioEditsByMediaId] = useState<Record<string, StudioEdits>>({});
  const [reviewActiveMediaId, setReviewActiveMediaId] = useState<string | null>(null);
  
  // Actor and visibility state (local to this wizard, not persisted globally)
  const [selectedActor, setSelectedActor] = useState(activeActor);
  const [visibility, setVisibility] = useState<ReviewVisibility>('anyone');
  
  // Sync with global actor on open (but only use personal for reviews)
  useEffect(() => {
    if (isOpen && activeActor) {
      // For reviews, always default to personal profile if available
      const personalActor = availableActors.find(a => a.type === 'personal');
      if (personalActor) {
        setSelectedActor(personalActor);
      } else {
        setSelectedActor(activeActor);
      }
    }
  }, [isOpen, activeActor, availableActors]);
  
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
    initialMediaFiles,
    onSuccess: () => {
      // For edit mode - go directly to success
      wizard.goToStep('success');
    },
    onPreview: () => {
      // For new reviews - go to preview step
      wizard.goToStep('preview');
    },
  });

  // Immersive steps (1 & 2) get transparent status bar so hero bleeds through;
  // non-immersive steps (3, 4, preview) use solid light background
  const isImmersiveStep = isOpen && typeof wizard.state.step === 'number' && (wizard.state.step === 1 || wizard.state.step === 2);
  useMedianStatusBar(
    isImmersiveStep ? "dark" : "light",
    "transparent",
    isOpen,
    false
  );

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
    
    // Fetch media directly from the database (since background upload may have completed)
    // This ensures we get the actual uploaded URLs, not stale local state
    const { data: dbMedia, error: mediaError } = await supabase
      .from('course_review_media')
      .select('id, media_url, media_type, poster_url, stream_id')
      .eq('review_id', wizard.submittedRatingId)
      .eq('status', 'attached')
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

  // Studio handlers
  const handleOpenStudio = useCallback(() => {
    if (!reviewActiveMediaId && wizard.allMedia.length > 0) {
      setReviewActiveMediaId(wizard.allMedia[0].id);
    }
    setShowStudio(true);
  }, [reviewActiveMediaId, wizard.allMedia]);

  const handleCloseStudio = useCallback(() => {
    setShowStudio(false);
    setStudioTool(null);
    setIsPositioningText(false);
  }, []);

  const handleUpdateStudioEdits = useCallback((patch: Partial<StudioEdits>) => {
    if (!reviewActiveMediaId) return;
    setStudioEditsByMediaId(prev => ({
      ...prev,
      [reviewActiveMediaId]: { ...(prev[reviewActiveMediaId] || {}), ...patch },
    }));
  }, [reviewActiveMediaId]);

  const handleClearStudioEdits = useCallback(() => {
    if (!reviewActiveMediaId) return;
    setStudioEditsByMediaId(prev => ({
      ...prev,
      [reviewActiveMediaId]: {},
    }));
  }, [reviewActiveMediaId]);

  // Get active media info for studio
  const activeMedia = useMemo(() => {
    if (!reviewActiveMediaId) return null;
    return wizard.allMedia.find(m => m.id === reviewActiveMediaId) || null;
  }, [reviewActiveMediaId, wizard.allMedia]);

  const activeMediaEdits = useMemo((): StudioEdits => {
    if (!reviewActiveMediaId) return {};
    return studioEditsByMediaId[reviewActiveMediaId] || {};
  }, [reviewActiveMediaId, studioEditsByMediaId]);

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

  // Determine if we're showing the step UI (header, progress) - only on steps 1-4
  const showStepUI = typeof wizard.state.step === 'number';
  
  // Hero image only on steps 1 & 2 (immersive bleed); steps 3 & 4 use standard safe area
  const showHeroImage = showStepUI && (wizard.state.step === 1 || wizard.state.step === 2);

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
              wizard.state.step === 'preview' ? "bg-black" : "",
              "flex flex-col",
              "overscroll-contain"
            )}
            style={{ 
              touchAction: 'pan-y',
              backgroundColor: wizard.state.step === 'preview' ? undefined : '#FFFBEB',
              backgroundImage: wizard.state.step === 'preview' ? undefined : 'linear-gradient(to bottom, rgba(254,243,199,0.3), white, white)',
            }}
          >
            {/* Hero image - extends into safe area */}
            {showHeroImage && typeof wizard.state.step === 'number' && (
              <WizardHeroImage 
                course={activeCourse} 
                currentStep={wizard.state.step as 1 | 2 | 3 | 4}
                onBack={wizard.prevStep}
                onClose={handleClose}
                hideBackButton={true}
              />
            )}

            {/* Steps with hero (1 & 2): Header below hero */}
            {showStepUI && showHeroImage && (
                <WizardHeader
                  currentStep={wizard.state.step}
                  totalSteps={4}
                  isEditMode={isEditMode}
                  canProceed={wizard.canProceed}
                  isSubmitting={wizard.isSubmitting}
                  isDeleting={wizard.isDeleting}
                  isLoadingUser={wizard.isLoadingUser}
                  hasHeroAbove={true}
                  selectedActor={selectedActor}
                  onBack={handleBack}
                  onNext={wizard.nextStep}
                  onSubmit={() => wizard.submit()}
                  onClose={handleClose}
                  onDelete={handleRemoveReviewClick}
                  onOpenProfileSelector={() => setShowPostingOptions(true)}
                />
            )}

            {/* Steps without hero (3 & 4): Header with safe area */}
            {showStepUI && !showHeroImage && (
                <WizardHeader
                  currentStep={wizard.state.step}
                  totalSteps={4}
                  isEditMode={isEditMode}
                  canProceed={wizard.canProceed}
                  isSubmitting={wizard.isSubmitting}
                  isDeleting={wizard.isDeleting}
                  isLoadingUser={wizard.isLoadingUser}
                  hasHeroAbove={false}
                  selectedActor={selectedActor}
                  onBack={handleBack}
                  onNext={wizard.nextStep}
                  onSubmit={() => wizard.submit()}
                  onClose={handleClose}
                  onDelete={handleRemoveReviewClick}
                  onOpenProfileSelector={() => setShowPostingOptions(true)}
                />
            )}

            {/* Content Area - flex-1 with internal structure */}
            <div className="flex-1 flex flex-col min-h-0 relative">

              {/* Step Content - grows to fill, scrollable */}
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
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
                        visibility={visibility}
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
                        rating={wizard.state.rating}
                        isEditMode={isEditMode}
                        onViewReview={handleViewReview}
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
                        course={activeCourse}
                        onAddImages={wizard.addImages}
                        onAddVideo={wizard.addVideo}
                        onRemoveMedia={wizard.removeMedia}
                        onSetCover={wizard.setCoverMedia}
                        onRetryMedia={wizard.retryMedia}
                        onReorderMedia={wizard.reorderMedia}
                        onOpenStudio={handleOpenStudio}
                        onOpenBadges={() => setShowBadgesSheet(true)}
                        studioEditsByMediaId={studioEditsByMediaId}
                        activeMediaId={reviewActiveMediaId}
                        onActiveMediaChange={setReviewActiveMediaId}
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
                        selectedTags={wizard.state.selectedTags}
                        hasUploadsInProgress={wizard.hasUploadsInProgress}
                        isEditMode={isEditMode}
                        onGoToStep={(step) => wizard.goToStep(step)}
                      />
                    )}
                  </AnimatePresence>
                </OverlayPortalProvider>
              </div>

              {/* Scroll fade indicator — signals more content below */}
              {typeof wizard.state.step === 'number' && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
              )}
            </div>

            {/* Footer navigation REMOVED - now in header */}
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
            onActorChange={setSelectedActor}
            visibility={visibility}
            onVisibilityChange={setVisibility}
          />

          {/* Delete review confirmation - iOS-style action sheet */}
          <RemoveReviewActionSheet
            open={showDeleteConfirm}
            onRemove={confirmDeleteReview}
            onCancel={() => setShowDeleteConfirm(false)}
            isRemoving={wizard.isDeleting}
          />

          {/* Course search for adding another review - REMOVED per requirements */}
          <CourseSearchSheet
            isOpen={showCourseSearch}
            onClose={() => setShowCourseSearch(false)}
            onSelectCourse={() => {}}
          />

          {/* Badges Sheet */}
          <MomentBadgesSheet
            isOpen={showBadgesSheet}
            onClose={() => setShowBadgesSheet(false)}
            selectedBadges={selectedBadges}
            onBadgesChange={setSelectedBadges}
          />

          {/* Studio Shelf */}
          {activeMedia && (
            <StudioShelf
              open={showStudio}
              onClose={handleCloseStudio}
              activeTool={studioTool}
              setActiveTool={setStudioTool}
              activeMediaId={activeMedia.id}
              activeMediaType={activeMedia.type}
              activeMediaPreviewUrl={activeMedia.previewUrl}
              activeMediaThumbnailUrl={activeMedia.posterUrl || activeMedia.previewUrl}
              edits={activeMediaEdits}
              updateEdits={handleUpdateStudioEdits}
              clearEdits={handleClearStudioEdits}
              isPositioningText={isPositioningText}
              onTogglePositionMode={() => setIsPositioningText(!isPositioningText)}
              activeOverlayId={activeOverlayId}
              onSelectOverlay={setActiveOverlayId}
            />
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
