// Post Wizard - Main Component
// Multi-step post creation wizard following Review Wizard pattern

import { useEffect, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PostWizardProps, PostWizardStep } from './types';
import { usePostWizard } from './usePostWizard';
import { PostWizardHeader } from './PostWizardHeader';
import { PostSuccessScreen } from './PostSuccessScreen';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useDrafts } from '@/hooks/useDrafts';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { enqueuePostUploadWithResilience } from '@/hooks/usePostUploadResilience';
import { toast } from 'sonner';

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

export function PostWizard({
  isOpen,
  onClose,
  initialMedia,
  initialCourse,
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
    setCourse,
    setActor,
    setScheduledAt,
    setSubmitting,
    setVisibility,
  } = usePostWizard({
    initialMedia,
    initialCourse,
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
  const { drafts } = useDrafts();
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
      // TODO: Show confirmation dialog
      onClose();
    } else {
      onClose();
    }
  }, [state.isDirty, onClose]);

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
      
      // Build course info
      const courseInfo = state.selectedCourse 
        ? {
            id: state.selectedCourse.id,
            name: state.selectedCourse.name,
            country: state.selectedCourse.country || '',
          }
        : undefined;
      
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
        selectedTags: state.selectedTags,
        files,
        mediaItems: state.mediaItems,
        studioEditsByMediaId: state.studioEditsByMediaId,
        categories: categoryIds,
        visibility: state.visibility,
        badges: [], // TODO: Wire up badges
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

  // Handle course selection
  const handleCourseSelect = useCallback((course: { id: string; name: string; country: string; region?: string }) => {
    setCourse(course);
    setShowCourseSearch(false);
  }, [setCourse]);

  // Handle category selection
  const handleCategoriesChange = useCallback((categories: string[]) => {
    setCategories(categories as any);
  }, [setCategories]);

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

  // Determine if next button should be enabled
  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case 'media':
        return canProceedFromMedia;
      case 'caption':
        return true; // Caption is optional
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
        onViewPost={handleViewPost}
        onCreateAnother={handleCreateAnother}
        onDone={handleSuccessDone}
      />,
      document.body
    );
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-background"
        style={{ touchAction: 'none' }}
      >
        {/* Header */}
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
          onBack={handleBack}
          onOpenDrafts={() => setShowDraftsSheet(true)}
          onOpenScheduled={() => setShowDraftsSheet(true)}
          onOpenScheduleSheet={() => setShowScheduleSheet(true)}
          canProceed={canProceed}
          isSubmitting={state.isSubmitting}
          onNext={handleNext}
        />

        {/* Progress bar */}
        <div className="h-1 w-full bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Step content */}
        <main className="h-[calc(100vh-60px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {state.currentStep === 'media' && (
                <MediaStep
                  state={state}
                  dispatch={dispatch}
                  onOpenStudio={() => setShowStudio(true)}
                  onOpenBadges={() => setShowBadgesSheet(true)}
                />
              )}
              {state.currentStep === 'caption' && (
                <CaptionStep
                  state={state}
                  dispatch={dispatch}
                  onOpenCourseSearch={() => setShowCourseSearch(true)}
                />
              )}
              {state.currentStep === 'confirm' && (
                <ConfirmStep
                  state={state}
                  dispatch={dispatch}
                  onOpenCategories={() => setShowCategorySheet(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

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
          selectedBadges={[]}
          onBadgesChange={() => {}}
        />

        {/* Category Sheet */}
        <MomentCategorySheet
          isOpen={showCategorySheet}
          onClose={() => setShowCategorySheet(false)}
          selectedCategories={state.selectedCategories.map(String)}
          onCategoriesChange={handleCategoriesChange}
        />

        {/* Course Search Sheet */}
        <CourseSearchSheet
          isOpen={showCourseSearch}
          onClose={() => setShowCourseSearch(false)}
          onSelectCourse={handleCourseSelect}
        />

        {/* Drafts & Scheduled Sheet */}
        <DraftsAndScheduledSheet
          isOpen={showDraftsSheet}
          onClose={() => setShowDraftsSheet(false)}
          onLoadDraft={() => {
            // TODO: Load draft into state
            setShowDraftsSheet(false);
          }}
          onEditScheduledPost={() => {
            // TODO: Load scheduled post into state
            setShowDraftsSheet(false);
          }}
        />

        {/* Schedule Sheet */}
        <ScheduleSheet
          isOpen={showScheduleSheet}
          onClose={() => setShowScheduleSheet(false)}
          onSchedule={handleScheduleSelect}
          initialDate={state.scheduledAt ?? undefined}
        />
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default PostWizard;
