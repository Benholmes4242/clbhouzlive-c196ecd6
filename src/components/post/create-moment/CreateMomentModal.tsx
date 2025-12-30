import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { arrayMove } from "@dnd-kit/sortable";
import { prefersReduced } from '@/lib/ui/motion';
import { useSnapModal, ComposerMediaItem } from "@/hooks/useSnapModal";
import { useModalContext } from '@/contexts/ModalContext';
import { useImmersiveHeader } from '@/hooks/useImmersiveHeader';
import { useChromeState } from '@/hooks/useChromeState';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useStudio } from "@/hooks/useStudio";
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { openMediaPicker } from "@/utils/openMediaPicker";
import { normalizeFilesToMediaItems } from "@/lib/mediaUtils";
import { enqueuePostUpload } from "@/uploads/uploadPipeline";
import StudioShelf from "@/components/studio/StudioShelf";
import { OverlayPortalProvider } from "@/context/OverlayPortalContext";

import CreateMomentHero from "./CreateMomentHero";
import CreateMomentMediaStage from "./CreateMomentMediaStage";
import CreateMomentCanvas from "./CreateMomentCanvas";
import CreateMomentControlBar from "./CreateMomentControlBar";
import { MomentCategorySheet, MomentAudienceSheet, EnhanceMomentSheet, MomentBadgesSheet } from "./sheets";
import { useDraftPersistence } from "./useDraftPersistence";
import { CreateMomentProps, GolfCourse, TaggableEntity, MomentVisibility } from "./types";

// Animation constants
const ECM_ENTRY_DURATION = 500;
const ECM_EXIT_DURATION = 500;
const ECM_ENTRY_EASING = 'ease-in-out';
const ECM_EXIT_EASING = 'ease-in-out';
const DRAG_THRESHOLD = 120;

export default function CreateMomentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting,
  mediaItems = [],
  selectedCourse,
  onCourseSelect,
  onMediaChange,
  initialActorOverride
}: CreateMomentProps) {
  const { setCreateMomentModalOpen } = useModalContext();
  const { activeActor, availableActors, setActiveActor } = useActiveActor();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hasAppliedOverride, setHasAppliedOverride] = useState(false);
  const overlayRootRef = useRef<HTMLDivElement>(null);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  // Animation state
  const [translateY, setTranslateY] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return prefersReduced() ? 0 : window.innerHeight;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [hasEntered, setHasEntered] = useState(() => prefersReduced());
  const [isExiting, setIsExiting] = useState(false);
  
  // UI state
  const [activeIndex, setActiveIndex] = useState(0);
  const [coverIndex, setCoverIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
  
  // New v2 state - categories, badges, and visibility
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<MomentVisibility>('anyone');
  
  // Sheet states
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showAudienceSheet, setShowAudienceSheet] = useState(false);
  const [showEnhanceSheet, setShowEnhanceSheet] = useState(false);
  const [showBadgesSheet, setShowBadgesSheet] = useState(false);
  
  // Get user session
  const { user } = useSupabaseSession();

  // Hooks
  const {
    caption,
    setCaption,
    selectedCourse: snapCourse,
    setSelectedCourse,
    visibility: snapVisibility,
    setVisibility: setSnapVisibility,
    mode
  } = useSnapModal();

  const {
    studioOpen,
    activeTool,
    openStudio,
    closeStudio,
    setActiveTool,
    updateEdits,
    clearEdits,
    getEdits,
    hasEdits
  } = useStudio();

  const { hasDraft, saveDraft, clearDraft, restoreDraft } = useDraftPersistence();

  // Derived state
  const media = useMemo(() => (mediaItems || []).slice(0, 10), [mediaItems]);
  const hasMedia = media.length > 0;
  const hasCategories = selectedCategories.length > 0;
  // Soft-gated: Share button enabled if media exists - category check happens on tap
  const canPost = hasMedia && !isSubmitting && !!user;
  const course = selectedCourse || snapCourse;
  const isBusinessActor = activeActor?.type === 'business';
  const currentFilter = hasMedia ? getEdits(media[activeIndex]?.id)?.filter : undefined;

  // Modal context sync
  useEffect(() => {
    setCreateMomentModalOpen(isOpen);
  }, [isOpen, setCreateMomentModalOpen]);

  // Apply initial actor override once when modal opens (session-only, not persisted)
  useEffect(() => {
    if (!isOpen || hasAppliedOverride || !initialActorOverride) return;
    if (availableActors.length === 0) return; // Wait for actors to load
    
    // Verify the override actor exists in available actors
    const overrideActor = availableActors.find(
      a => a.type === initialActorOverride.type && a.id === initialActorOverride.id
    );
    
    if (overrideActor) {
      console.log('[CreateMomentModal] Applying actor override:', overrideActor.name);
      setActiveActor(overrideActor, { persist: false });
    }
    
    setHasAppliedOverride(true);
  }, [isOpen, initialActorOverride, availableActors, hasAppliedOverride, setActiveActor]);

  // Reset override flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasAppliedOverride(false);
    }
  }, [isOpen]);

  // Set overlay root for portal-based components (dropdowns, popovers)
  useEffect(() => {
    if (isOpen && overlayRootRef.current) {
      setOverlayRoot(overlayRootRef.current);
    } else {
      setOverlayRoot(null);
    }
  }, [isOpen]);

  // Header hiding
  useImmersiveHeader(Boolean(isOpen));
  useChromeState({ forceHidden: isOpen, disabled: false });

  // Body scroll lock and class for global styles
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    if (isOpen) {
      // Save scroll position
      scrollPositionRef.current = {
        x: window.scrollX,
        y: window.scrollY,
      };
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current.y}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('ecm-open');
    }
    return () => {
      // Restore scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('ecm-open');
      
      if (scrollPositionRef.current.y > 0) {
        window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
      }
    };
  }, [isOpen]);

  // Reset state on new post
  const wasOpenRef = useRef(false);
  useEffect(() => {
    const isOpening = isOpen && !wasOpenRef.current;

    if (isOpening && mode === 'create') {
      setCaption('');
      setSelectedCourse(null);
      onCourseSelect?.(null);
      setSnapVisibility('public');
      setSelectedTags([]);
      setSelectedCategories([]);
      setVisibility('anyone');
      
      // Check for draft
      if (hasDraft) {
        setShowDraftPrompt(true);
      }
      
      // Clear studio edits
      mediaItems.forEach(item => {
        if (hasEdits(item.id)) {
          clearEdits(item.id);
        }
      });
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, mode, setCaption, setSelectedCourse, onCourseSelect, setSnapVisibility, mediaItems, hasEdits, clearEdits, hasDraft]);

  // Slide-in animation
  useEffect(() => {
    if (!isOpen) return;

    if (prefersReduced() || typeof window === 'undefined') {
      setTranslateY(0);
      setHasEntered(true);
      return;
    }

    setTranslateY(window.innerHeight);
    setIsExiting(false);
    setHasEntered(false);

    requestAnimationFrame(() => {
      setHasEntered(true);
      setTranslateY(0);
    });
  }, [isOpen]);

  // Animated close
  const animateAndClose = useCallback(() => {
    // Save draft on close if there's content
    if (caption.trim() || course) {
      saveDraft({
        caption,
        actorType: activeActor?.type || 'personal',
        actorId: activeActor?.id,
        course,
        visibility: snapVisibility,
      });
    }

    if (prefersReduced() || typeof window === 'undefined') {
      onClose();
      return;
    }

    setIsExiting(true);
    setTranslateY(window.innerHeight);

    setTimeout(() => {
      onClose();
    }, ECM_EXIT_DURATION);
  }, [onClose, caption, course, saveDraft, activeActor, snapVisibility]);

  // Touch handlers for swipe-to-dismiss
  const isInsideScrollContainer = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest('[data-ecm-scroll-container="true"]');
  };

  const handleSheetTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (isExiting || isInsideScrollContainer(e.target)) return;
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };

  const handleSheetTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging || dragStartY == null || isExiting) return;
    const deltaY = e.touches[0].clientY - dragStartY;
    if (deltaY <= 0) {
      setTranslateY(0);
      return;
    }
    setTranslateY(deltaY);
  };

  const handleSheetTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (!isDragging || isExiting) return;
    if (translateY > DRAG_THRESHOLD) {
      animateAndClose();
    } else {
      setTranslateY(0);
    }
    setIsDragging(false);
    setDragStartY(null);
  };

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        animateAndClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [animateAndClose, isOpen]);

  // Camera capture handler
  const handlePickFromCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.capture = 'environment';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async () => {
      const files = Array.from(input.files ?? []);
      if (files.length > 0) {
        const newItems = await normalizeFilesToMediaItems(files);
        const combined = [...media, ...newItems].slice(0, 10);
        onMediaChange?.(combined);
      }
      document.body.removeChild(input);
    });

    input.click();
  };

  // Gallery picker handler
  const handlePickFromLibrary = () => {
    openMediaPicker(async (files) => {
      if (files.length > 0) {
        const newItems = await normalizeFilesToMediaItems(files);
        const combined = [...media, ...newItems].slice(0, 10);
        onMediaChange?.(combined);
      }
    }, 10);
  };

  // Remove media handler
  const handleRemoveMedia = (index: number) => {
    if (!onMediaChange || media.length === 0) return;
    
    const newMedia = media.filter((_, idx) => idx !== index);
    onMediaChange(newMedia);
    
    if (activeIndex >= newMedia.length) {
      setActiveIndex(Math.max(0, newMedia.length - 1));
    }
    
    // Adjust cover index if needed
    if (coverIndex >= newMedia.length) {
      setCoverIndex(Math.max(0, newMedia.length - 1));
    } else if (coverIndex > index) {
      setCoverIndex(coverIndex - 1);
    }
  };

  // Reorder media handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (!onMediaChange) return;
    
    const reordered = arrayMove(media, fromIndex, toIndex);
    onMediaChange(reordered);
    
    // Update active index to follow the item
    if (activeIndex === fromIndex) {
      setActiveIndex(toIndex);
    } else if (activeIndex > fromIndex && activeIndex <= toIndex) {
      setActiveIndex(activeIndex - 1);
    } else if (activeIndex < fromIndex && activeIndex >= toIndex) {
      setActiveIndex(activeIndex + 1);
    }
    
    // Update cover index to follow the item
    if (coverIndex === fromIndex) {
      setCoverIndex(toIndex);
    } else if (coverIndex > fromIndex && coverIndex <= toIndex) {
      setCoverIndex(coverIndex - 1);
    } else if (coverIndex < fromIndex && coverIndex >= toIndex) {
      setCoverIndex(coverIndex + 1);
    }
  };

  // Post handler - soft-gated flow (auto-open category sheet if missing)
  const handlePost = () => {
    if (!hasMedia || !user) return;
    
    // Soft-gated: if no categories, open category sheet instead of blocking
    if (selectedCategories.length === 0) {
      setShowCategorySheet(true);
      return;
    }

    // Extract files from media items and filter out any undefined/null
    const files = media.map(item => item.file).filter((f): f is File => f instanceof File);
    
    // CRITICAL: Validate we actually have files to upload
    if (files.length === 0) {
      console.error('[CreateMomentModal] No valid files found in media items');
      // Don't close modal - show error instead
      return;
    }
    
    // Build full studio edits including filter, music, and audioMode
    const studioEditsByMediaId = media.reduce((acc, item) => {
      const edits = getEdits?.(item.id);
      if (edits && (edits.filter || edits.music || edits.audioMode)) {
        acc[item.id] = {
          ...(edits.filter && { filter: edits.filter }),
          ...(edits.music && { 
            music: {
              trackId: edits.music.trackId,
              title: edits.music.title,
              artist: edits.music.artist,
              url: edits.music.url || '',
              startAt: edits.music.startAt ?? 0,
              volume: edits.music.volume ?? 0.8,
            }
          }),
          audioMode: edits.music ? 'music_only' as const : 'original' as const,
        };
      }
      return acc;
    }, {} as Record<string, { filter?: string; music?: { trackId: string; title: string; artist?: string; url: string; startAt?: number; volume?: number }; audioMode?: 'original' | 'music_only' }>);
    
    try {
      // Enqueue upload and close immediately
      enqueuePostUpload({
        userId: user.id,
        actorType: activeActor?.type === 'business' ? 'business' : 'personal',
        actorId: activeActor?.type === 'business' ? activeActor.id : user.id,
        caption,
        courseInfo: course ? { id: course.id, name: course.name, country: course.country || '' } : undefined,
        selectedTags,
        files,
        mediaItems: media,
        studioEditsByMediaId,
        categories: selectedCategories,
        visibility,
      });
      
      clearDraft();
      onClose();
    } catch (error) {
      console.error('[CreateMomentModal] Failed to enqueue post upload:', error);
      // Don't close modal on error - let user retry
    }
  };

  // Restore draft handler
  const handleRestoreDraft = () => {
    const draft = restoreDraft();
    if (draft) {
      setCaption(draft.caption);
      if (draft.course) {
        setSelectedCourse(draft.course);
        onCourseSelect?.(draft.course);
      }
      setSnapVisibility(draft.visibility);
    }
    setShowDraftPrompt(false);
  };

  // Discard draft handler
  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftPrompt(false);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999]"
      style={{ touchAction: 'none' }}
    >
      {/* Backdrop - subtle dim, no blur */}
      <div 
        className="absolute inset-0"
        style={{ background: 'var(--cm-backdrop)' }}
        onClick={animateAndClose}
      />
      
      {/* Main sheet - light slate surface */}
      <div 
        ref={wrapperRef}
        role="dialog"
        aria-modal="true"
        aria-label="Create a Moment"
        className="fixed inset-0 flex flex-col"
        style={{
          background: 'var(--cm-surface-card)',
          transform: `translateY(${translateY}px)`,
          transition:
            isDragging || !hasEntered || prefersReduced()
              ? 'none'
              : isExiting
                ? `transform ${ECM_EXIT_DURATION}ms ${ECM_EXIT_EASING}`
                : `transform ${ECM_ENTRY_DURATION}ms ${ECM_ENTRY_EASING}`,
        }}
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        onTouchEnd={handleSheetTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Stage - grey background flows to top, FULL-BLEED */}
        <section
          id="media" 
          className="relative flex-1 min-h-0 overflow-hidden z-[1002]"
          style={{ 
            background: 'var(--cm-surface-alt)',
          }}
        >
          {/* Grabber bar - white, positioned at top */}
          {!hasMedia && (
            <div 
              className="cm-grabber"
              style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 8px)', left: '50%', transform: 'translateX(-50%)' }}
            />
          )}
          {hasMedia ? (
            <CreateMomentMediaStage
              media={media}
              activeIndex={activeIndex}
              coverIndex={coverIndex}
              onIndexChange={setActiveIndex}
              onSetCover={setCoverIndex}
              onRemoveMedia={handleRemoveMedia}
              onReorder={handleReorder}
              getEdits={getEdits}
            />
          ) : (
            <CreateMomentHero
              hasMedia={false}
              isBusinessActor={isBusinessActor}
              isTyping={isTyping}
              onPickFromCamera={handlePickFromCamera}
              onPickFromLibrary={handlePickFromLibrary}
            />
          )}
        </section>

        {/* Canvas - Caption + Course (simplified, canvas-first) */}
        <section
          className="composer relative z-[1003] flex flex-col"
          style={{
            background: 'var(--cm-surface-card)',
            borderTop: '1px solid var(--cm-border-subtle)',
          }}
        >
          <OverlayPortalProvider container={overlayRoot}>
            <CreateMomentCanvas
              hasMedia={hasMedia}
              caption={caption}
              onCaptionChange={setCaption}
              selectedCourse={course}
              onCourseSelect={(c) => {
                setSelectedCourse(c);
                onCourseSelect?.(c);
              }}
              onTypingStateChange={setIsTyping}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </OverlayPortalProvider>

          {/* Control Bar - 4 icons */}
          <CreateMomentControlBar
            hasMedia={hasMedia}
            hasCategories={hasCategories}
            hasEnhanced={!!currentFilter && currentFilter !== 'normal'}
            visibilityChanged={visibility !== 'anyone'}
            onMediaClick={handlePickFromLibrary}
            onEnhanceClick={() => setShowEnhanceSheet(true)}
            onCategoriesClick={() => setShowCategorySheet(true)}
            onVisibilityClick={() => setShowAudienceSheet(true)}
          />

          {/* Share Button */}
          <div
            className="flex-shrink-0 px-4 pt-2"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
              background: 'var(--cm-surface-card)',
            }}
          >
            <button
              disabled={!hasMedia}
              onClick={handlePost}
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[.99] disabled:cursor-not-allowed flex items-center justify-center"
              style={{
                background: hasMedia ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                border: hasMedia ? 'none' : '1px solid var(--cm-border-subtle)',
                color: hasMedia ? 'white' : 'var(--cm-text-tertiary)',
                boxShadow: hasMedia ? 'var(--cm-shadow-button)' : 'none',
              }}
            >
              Share
            </button>
          </div>
        </section>

        {/* Overlay root for dropdowns/popovers inside the modal */}
        <div
          ref={overlayRootRef}
          id="create-moment-overlay-root"
          className="pointer-events-none absolute inset-0 z-[1010]"
        />

        {/* Draft prompt - light slate */}
        <AnimatePresence>
          {showDraftPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-20 left-4 right-4 z-[1010] p-4 rounded-2xl"
              style={{
                background: 'var(--cm-surface-card)',
                border: '1px solid var(--cm-border)',
                boxShadow: 'var(--cm-shadow-soft)',
              }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--cm-text-primary)' }}>Resume your draft?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleRestoreDraft}
                  className="flex-1 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--cm-surface-slate)', color: 'white' }}
                >
                  Resume
                </button>
                <button
                  onClick={handleDiscardDraft}
                  className="flex-1 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--cm-surface-alt)', color: 'var(--cm-text-secondary)', border: '1px solid var(--cm-border-subtle)' }}
                >
                  Discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Studio Shelf */}
      <StudioShelf
        open={studioOpen}
        onClose={closeStudio}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeMediaId={media[activeIndex]?.id || ''}
        activeMediaType={media[activeIndex]?.type || 'image'}
        edits={getEdits(media[activeIndex]?.id || '')}
        updateEdits={(patch) => updateEdits(media[activeIndex]?.id || '', patch)}
        clearEdits={() => clearEdits(media[activeIndex]?.id || '')}
      />

      {/* Bottom Sheets */}
      <MomentCategorySheet
        isOpen={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        caption={caption}
        hasCourse={!!course}
        mediaTypes={media.map(m => m.type === 'video' ? 'video' : 'photo')}
      />

      <MomentAudienceSheet
        isOpen={showAudienceSheet}
        onClose={() => setShowAudienceSheet(false)}
        visibility={visibility}
        onVisibilityChange={setVisibility}
      />

      <EnhanceMomentSheet
        isOpen={showEnhanceSheet}
        onClose={() => setShowEnhanceSheet(false)}
        onOpenStudio={() => {
          setShowEnhanceSheet(false);
          openStudio();
        }}
        onOpenBadges={() => {
          setShowEnhanceSheet(false);
          setShowBadgesSheet(true);
        }}
      />

      <MomentBadgesSheet
        isOpen={showBadgesSheet}
        onClose={() => setShowBadgesSheet(false)}
        selectedBadges={selectedBadges}
        onBadgesChange={setSelectedBadges}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
