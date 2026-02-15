// Post Wizard - Main Component
// Multi-step post creation wizard following Review Wizard pattern

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, RefreshCw } from 'lucide-react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { PostWizardProps } from './types';
import { usePostWizard } from './usePostWizard';
import { PostWizardHeader } from './PostWizardHeader';
import { PostSuccessScreen } from './PostSuccessScreen';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useDrafts } from '@/hooks/useDrafts';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { enqueuePostUploadWithResilience } from '@/hooks/usePostUploadResilience';
import { toast } from 'sonner';
import { StudioTool, StudioEdits } from '@/types/studio';
import type { DraftWithMedia } from '@/services/drafts';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Step components
import { MediaStep, CaptionStep, ConfirmStep } from './steps';

// Sheets from existing modal
import { 
  MomentBadgesSheet, 
  MomentCategorySheet,
  DraftsAndScheduledSheet,
  ScheduleSheet,
} from '@/components/post/create-moment/sheets';
import { CourseSearchSheet } from '@/components/courses/CourseSearchSheet';
import PostingOptionsSheet from '@/components/post/create-moment/PostingOptionsSheet';
import StudioShelf from '@/components/studio/StudioShelf';

// Apple-style action sheet for discard confirmation
import { DiscardActionSheet } from './DiscardActionSheet';

/**
 * Fix 1: Scoped error boundary for CourseSearchSheet.
 * Search failures render inline "Couldn't load" message instead of killing the wizard.
 */
function CourseSearchSheetFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[10011] rounded-t-[24px] bg-background p-8 text-center"
      style={{ boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.1)' }}
    >
      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-5 h-5 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">Couldn't load course search</p>
      <p className="text-xs text-muted-foreground mb-4">Check your connection and try again.</p>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary} className="gap-2">
        <RefreshCw className="w-3.5 h-3.5" />
        Tap to retry
      </Button>
    </div>
  );
}

function CourseSearchSheetBoundary(props: React.ComponentProps<typeof CourseSearchSheet>) {
  return (
    <ReactErrorBoundary FallbackComponent={CourseSearchSheetFallback}>
      <CourseSearchSheet {...props} />
    </ReactErrorBoundary>
  );
}

export function PostWizard({
  isOpen,
  onClose,
  initialMedia,
  initialCourses,
  initialActorOverride,
}: PostWizardProps) {
  const {
    state,
    dispatch,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    currentStepIndex,
    totalSteps,
    canProceedFromMedia,
    canSubmit,
    reset,
    setCategories,
    addCourse,
    removeCourse,
    setActor,
    setScheduledAt,
    setSubmitting,
    setVisibility,
    setBadges,
    setStudioEdits,
    setActiveMediaId,
    loadDraft,
  } = usePostWizard({
    initialMedia,
    initialCourses,
    initialActorOverride,
  });

  // Active actor context for profile info
  const { activeActor, setActiveActor, availableActors, isLoading: actorLoading } = useActiveActor();
  
  // Derived personal and business actors from availableActors
  const personalActor = useMemo(() => 
    availableActors.find(a => a.type === 'personal'), 
    [availableActors]
  );
  const businessActors = useMemo(() => 
    availableActors.filter(a => a.type === 'business'), 
    [availableActors]
  );
  
  // Drafts and scheduled posts
  const { drafts, createDraft, canCreateDraft, uploadMedia } = useDrafts();
  const { scheduledPosts } = useScheduledPosts();

  // Sheet states
  const [showStudio, setShowStudio] = useState(false);
  const [showBadgesSheet, setShowBadgesSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showDraftsSheet, setShowDraftsSheet] = useState(false);
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Studio state
  const [studioTool, setStudioTool] = useState<StudioTool>(null);
  const [isPositioningText, setIsPositioningText] = useState(false);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);

  // Control native status bar appearance when wizard is open
  // "light" = black icons for light backgrounds (#F8FAFC)
  useMedianStatusBar("light", "transparent", true, false, isOpen);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setShowSuccess(false);
      setShowCloseConfirm(false);
    }
  }, [isOpen, reset]);

  // Sync actor from context
  useEffect(() => {
    if (activeActor && !initialActorOverride) {
      setActor({
        type: activeActor.type === 'business' ? 'business' : 'personal',
        id: activeActor.id,
      });
    }
  }, [activeActor, initialActorOverride, setActor]);

  // Handle close with dirty check
  const handleClose = useCallback(() => {
    if (state.isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [state.isDirty, onClose]);

  // Confirm close (discard changes)
  const confirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (isFirstStep) {
      handleClose();
    } else {
      prevStep();
    }
  }, [isFirstStep, handleClose, prevStep]);

  // Handle submission
  const handleSubmit = useCallback(async () => {
    if (state.isSubmitting || !canSubmit) return;
    
    // If no categories, show category sheet first
    if (state.selectedCategories.length === 0) {
      setShowCategorySheet(true);
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Extract files from media items
      const files = state.mediaItems
        .filter(item => item.file)
        .map(item => item.file as File);
      
      // Build course info from first selected course (for backwards compat)
      // Defensive null checks to prevent white screen crashes
      const firstCourse = state.selectedCourses[0];
      const courseInfo = firstCourse?.id && firstCourse?.name
        ? {
            id: firstCourse.id,
            name: firstCourse.name,
            country: firstCourse.country || '',
          }
        : undefined;
      
      // Build courseIds array with defensive filter for multi-course support
      const courseIds = state.selectedCourses
        .map(c => c?.id)
        .filter((id): id is string => Boolean(id));
      
      // Convert categories to string IDs for the upload
      const categoryIds = state.selectedCategories.map(cat => 
        typeof cat === 'string' ? cat : cat.id
      );
      
      // Enqueue upload with resilience
      await enqueuePostUploadWithResilience({
        userId: state.actor.id,
        actorType: state.actor.type,
        actorId: state.actor.id,
        caption: state.caption,
        courseInfo,
        courseIds, // Multi-course support for junction table
        selectedTags: state.selectedTags,
        files,
        mediaItems: state.mediaItems,
        studioEditsByMediaId: state.studioEditsByMediaId,
        categories: categoryIds,
        visibility: state.visibility,
        badges: state.selectedBadges,
        scheduledAt: state.scheduledAt ?? undefined,
      });
      
      // Show success screen
      setShowSuccess(true);
      
    } catch (error) {
      console.error('[PostWizard] Submission failed:', error);
      toast.error('Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [state, canSubmit, setSubmitting]);

  // Handle next/submit
  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleSubmit();
    } else {
      nextStep();
    }
  }, [isLastStep, nextStep, handleSubmit]);

  // Handle course selection (add to list)
  const handleCourseSelect = useCallback((course: { id: string; name: string; country: string; region?: string }) => {
    try {
      // Validate course object before adding
      if (!course?.id || !course?.name) {
        console.error('PostWizard: Invalid course object received:', course);
        setShowCourseSearch(false);
        return;
      }
      
      addCourse(course);
      setShowCourseSearch(false);
    } catch (error) {
      console.error('PostWizard: Error adding course:', error);
      setShowCourseSearch(false);
      // Fail gracefully - don't crash the wizard
    }
  }, [addCourse]);

  // Handle category selection
  const handleCategoriesChange = useCallback((categories: string[]) => {
    setCategories(categories as any);
  }, [setCategories]);

  // Handle badges selection
  const handleBadgesChange = useCallback((badges: string[]) => {
    setBadges(badges);
  }, [setBadges]);

  // Handle profile/visibility selection from PostingOptionsSheet
  const handleActorChange = useCallback((actor: { type: 'personal' | 'business'; id: string; name: string; avatarUrl?: string }) => {
    setActor({ type: actor.type, id: actor.id });
    // Also update context so it persists
    const selected = availableActors.find(a => a.id === actor.id);
    if (selected) {
      setActiveActor(selected);
    }
  }, [setActor, availableActors, setActiveActor]);

  // Handle visibility change
  const handleVisibilityChange = useCallback((visibility: 'anyone' | 'followers' | 'private') => {
    setVisibility(visibility);
  }, [setVisibility]);

  // Handle schedule selection
  const handleScheduleSelect = useCallback((date: Date) => {
    setScheduledAt(date);
    setShowScheduleSheet(false);
  }, [setScheduledAt]);

  // Handle draft loading
  const handleLoadDraft = useCallback((draft: DraftWithMedia) => {
    loadDraft(draft);
    setShowDraftsSheet(false);
    toast.success('Draft loaded');
  }, [loadDraft]);

  // Handle save draft (for Drafts sheet)
  const handleSaveDraft = useCallback(async () => {
    if (!canCreateDraft) {
      toast.error('Maximum drafts reached');
      return;
    }
    
    try {
      // Convert categories to string IDs
      const categoryIds = state.selectedCategories.map(cat => 
        typeof cat === 'string' ? cat : cat.id
      );
      
      await createDraft({
        actorType: state.actor.type,
        actorId: state.actor.id,
        content: state.caption || null,
        visibility: state.visibility,
        categories: categoryIds,
        badges: state.selectedBadges,
        courseId: state.selectedCourses[0]?.id || null,
        courseName: state.selectedCourses[0]?.name || null,
        courseCountry: state.selectedCourses[0]?.country || null,
      });
      
      toast.success('Draft saved');
    } catch (error) {
      console.error('[PostWizard] Failed to save draft:', error);
      toast.error('Failed to save draft');
    }
  }, [state, canCreateDraft, createDraft]);

  // Handle save draft and close (for Discard Action Sheet)
  const handleSaveDraftAndClose = useCallback(async () => {
    if (!canCreateDraft) {
      toast.error('Maximum drafts reached');
      return;
    }
    
    setIsSavingDraft(true);
    
    try {
      // Convert categories to string IDs
      const categoryIds = state.selectedCategories.map(cat => 
        typeof cat === 'string' ? cat : cat.id
      );
      
      // Create the draft first
      const draft = await createDraft({
        actorType: state.actor.type,
        actorId: state.actor.id,
        content: state.caption || null,
        visibility: state.visibility,
        categories: categoryIds,
        badges: state.selectedBadges,
        courseId: state.selectedCourses[0]?.id || null,
        courseName: state.selectedCourses[0]?.name || null,
        courseCountry: state.selectedCourses[0]?.country || null,
      });
      
      // Upload media if draft was created and there are media items with files
      if (draft?.id && state.mediaItems.length > 0) {
        const mediaWithFiles = state.mediaItems.filter(item => item.file);
        if (mediaWithFiles.length > 0) {
          await uploadMedia(
            draft.id,
            mediaWithFiles,
            (mediaId) => state.studioEditsByMediaId[mediaId]
          );
        }
      }
      
      toast.success('Draft saved');
      setShowCloseConfirm(false);
      onClose();
    } catch (error) {
      console.error('[PostWizard] Failed to save draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  }, [state, canCreateDraft, createDraft, uploadMedia, onClose]);

  // Studio handlers
  const handleOpenStudio = useCallback(() => {
    // Set first media as active if none selected
    if (!state.activeMediaId && state.mediaItems.length > 0) {
      setActiveMediaId(state.mediaItems[0].id);
    }
    setShowStudio(true);
  }, [state.activeMediaId, state.mediaItems, setActiveMediaId]);

  const handleCloseStudio = useCallback(() => {
    setShowStudio(false);
    setStudioTool(null);
    setIsPositioningText(false);
  }, []);

  const handleUpdateStudioEdits = useCallback((patch: Partial<StudioEdits>) => {
    if (!state.activeMediaId) return;
    
    const currentEdits = state.studioEditsByMediaId[state.activeMediaId] || {};
    setStudioEdits(state.activeMediaId, { ...currentEdits, ...patch });
  }, [state.activeMediaId, state.studioEditsByMediaId, setStudioEdits]);

  const handleClearStudioEdits = useCallback(() => {
    if (!state.activeMediaId) return;
    setStudioEdits(state.activeMediaId, {});
  }, [state.activeMediaId, setStudioEdits]);

  // Get active media info for studio
  const activeMedia = useMemo(() => {
    if (!state.activeMediaId) return null;
    return state.mediaItems.find(m => m.id === state.activeMediaId) || null;
  }, [state.activeMediaId, state.mediaItems]);

  const activeMediaEdits = useMemo((): StudioEdits => {
    if (!state.activeMediaId) return {};
    return state.studioEditsByMediaId[state.activeMediaId] || {};
  }, [state.activeMediaId, state.studioEditsByMediaId]);

  // Determine if next button should be enabled
  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case 'media':
        return canProceedFromMedia;
      case 'caption':
        // Now requires at least 1 category to proceed
        return state.selectedCategories.length > 0;
      case 'confirm':
        return canSubmit && state.selectedCategories.length > 0;
      default:
        return false;
    }
  }, [state.currentStep, canProceedFromMedia, canSubmit, state.selectedCategories.length]);

  // Get actor display info
  const actorDisplayInfo = useMemo(() => {
    if (state.actor.type === 'personal' && personalActor) {
      return {
        name: personalActor.name,
        avatarUrl: personalActor.avatarUrl,
        verified: personalActor.verified,
      };
    }
    const business = businessActors?.find(b => b.id === state.actor.id);
    if (business) {
      return {
        name: business.name,
        avatarUrl: business.avatarUrl,
        verified: business.verified,
      };
    }
    return { name: 'You', avatarUrl: undefined, verified: false };
  }, [state.actor, personalActor, businessActors]);

  // Build selected actor for PostingOptionsSheet
  const selectedActorForSheet = useMemo(() => {
    const found = availableActors.find(a => a.id === state.actor.id);
    return found || null;
  }, [availableActors, state.actor.id]);

  // Handle success actions
  const handleViewPost = useCallback(() => {
    // TODO: Navigate to the post
    onClose();
  }, [onClose]);

  const handleCreateAnother = useCallback(() => {
    reset();
    setShowSuccess(false);
  }, [reset]);

  const handleSuccessDone = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // Show success screen if post was successful
  if (showSuccess) {
    return createPortal(
      <PostSuccessScreen
        isScheduled={!!state.scheduledAt}
        scheduledAt={state.scheduledAt}
        firstMediaUrl={state.mediaItems[0]?.previewUrl || null}
        firstMediaType={state.mediaItems[0]?.type || 'image'}
        mediaCount={state.mediaItems.length}
        onViewPost={handleViewPost}
        onCreateAnother={handleCreateAnother}
        onDone={handleSuccessDone}
      />,
      document.body
    );
  }

  return createPortal(
    <ErrorBoundary
      fallback={
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center pt-safe pb-safe">
          <div className="text-center p-6 max-w-sm">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="light fixed inset-0 z-[9999] flex flex-col overflow-hidden pb-safe"
          style={{ 
            ...{
              touchAction: 'pan-y pinch-zoom',
              overscrollBehavior: 'contain',
            },
            backgroundColor: '#FFFBEB',
          }}
        >
          {/* Header + progress bar — single amber surface that bleeds behind status bar */}
          <div className="flex-shrink-0 bg-amber-50" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}>
            <PostWizardHeader
              currentStep={state.currentStep}
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              actor={state.actor}
              actorName={actorDisplayInfo.name}
              actorAvatarUrl={actorDisplayInfo.avatarUrl}
              actorVerified={actorDisplayInfo.verified}
              onOpenProfileSelector={() => setShowProfileSelector(true)}
              draftCount={drafts?.length ?? 0}
              scheduledCount={scheduledPosts?.length ?? 0}
              scheduledAt={state.scheduledAt}
              onClearSchedule={() => setScheduledAt(null)}
              onBack={handleBack}
              onOpenDrafts={() => setShowDraftsSheet(true)}
              onOpenScheduled={() => setShowDraftsSheet(true)}
              onOpenScheduleSheet={() => setShowScheduleSheet(true)}
              canProceed={canProceed}
              isSubmitting={state.isSubmitting}
              onNext={handleNext}
              hasHeroAbove
            />
            {/* Progress bar inside amber surface */}
              <div className="h-2 w-full bg-amber-200/50 overflow-hidden">
                <motion.div
                  className="h-full shadow-sm"
                  style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)' }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
          </div>

          {/* Step content - fills remaining space */}
          <main className="flex-1 min-h-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={state.currentStep}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full"
              >
                {state.currentStep === 'media' && (
                  <MediaStep
                    state={state}
                    dispatch={dispatch}
                    onOpenStudio={handleOpenStudio}
                    onOpenBadges={() => setShowBadgesSheet(true)}
                  />
                )}
                {state.currentStep === 'caption' && (
                  <CaptionStep
                    state={state}
                    dispatch={dispatch}
                    onOpenCourseSearch={() => setShowCourseSearch(true)}
                    onOpenCategories={() => setShowCategorySheet(true)}
                  />
                )}
                {state.currentStep === 'confirm' && (
                  <ConfirmStep
                    state={state}
                    dispatch={dispatch}
                    onOpenCategories={() => setShowCategorySheet(true)}
                    onEditCaption={() => dispatch({ type: 'SET_STEP', payload: 'caption' })}
                    onEditLocation={() => {
                      dispatch({ type: 'SET_STEP', payload: 'caption' });
                      // Auto-open course search after step transition
                      setTimeout(() => setShowCourseSearch(true), 150);
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Apple-style Discard Action Sheet */}
          <DiscardActionSheet
            open={showCloseConfirm}
            onDiscard={confirmClose}
            onSaveToDrafts={handleSaveDraftAndClose}
            onKeepEditing={() => setShowCloseConfirm(false)}
            isSaving={isSavingDraft}
            canSaveDraft={canCreateDraft}
          />

          {/* Sheets & Overlays */}
          
          {/* Profile Selector */}
          <PostingOptionsSheet
            isOpen={showProfileSelector}
            onClose={() => setShowProfileSelector(false)}
            selectedActor={selectedActorForSheet}
            availableActors={availableActors}
            onActorChange={handleActorChange}
            visibility={state.visibility}
            onVisibilityChange={handleVisibilityChange}
          />

          {/* Badges Sheet */}
          <MomentBadgesSheet
            isOpen={showBadgesSheet}
            onClose={() => setShowBadgesSheet(false)}
            selectedBadges={state.selectedBadges}
            onBadgesChange={handleBadgesChange}
          />

          {/* Category Sheet */}
          <MomentCategorySheet
            isOpen={showCategorySheet}
            onClose={() => setShowCategorySheet(false)}
            selectedCategories={state.selectedCategories.map(c => typeof c === 'string' ? c : c.id)}
            onCategoriesChange={handleCategoriesChange}
          />

          {/* Course Search Sheet — scoped error boundary so search failures don't kill the wizard */}
          <CourseSearchSheetBoundary
            isOpen={showCourseSearch}
            onClose={() => setShowCourseSearch(false)}
            onSelectCourse={handleCourseSelect}
            userId={state.actor.id || undefined}
            existingCourseIds={state.selectedCourses.map(c => c.id).filter(Boolean)}
          />

          {/* Drafts & Scheduled Sheet */}
          <DraftsAndScheduledSheet
            isOpen={showDraftsSheet}
            onClose={() => setShowDraftsSheet(false)}
            onLoadDraft={handleLoadDraft}
            onEditScheduledPost={() => {
              // TODO: Load scheduled post into state for editing
              setShowDraftsSheet(false);
            }}
            onSaveDraft={handleSaveDraft}
            canSaveDraft={canCreateDraft && state.isDirty}
          />

          {/* Schedule Sheet */}
          <ScheduleSheet
            isOpen={showScheduleSheet}
            onClose={() => setShowScheduleSheet(false)}
            onSchedule={handleScheduleSelect}
            initialDate={state.scheduledAt ?? undefined}
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
              activeMediaThumbnailUrl={(activeMedia as any).posterUrl || activeMedia.previewUrl}
              edits={activeMediaEdits}
              updateEdits={handleUpdateStudioEdits}
              clearEdits={handleClearStudioEdits}
              isPositioningText={isPositioningText}
              onTogglePositionMode={() => setIsPositioningText(!isPositioningText)}
              activeOverlayId={activeOverlayId}
              onSelectOverlay={setActiveOverlayId}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </ErrorBoundary>,
    document.body
  );
}

export default PostWizard;