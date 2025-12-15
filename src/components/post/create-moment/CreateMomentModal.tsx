import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { arrayMove } from "@dnd-kit/sortable";
import { prefersReduced } from '@/lib/ui/motion';
import { useSnapModal, ComposerMediaItem } from "@/hooks/useSnapModal";
import { useModalContext } from '@/contexts/ModalContext';
import { useImmersiveHeader } from '@/hooks/useImmersiveHeader';
import { useChromeState } from '@/hooks/useChromeState';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useStudio } from "@/hooks/useStudio";
import { openMediaPicker } from "@/utils/openMediaPicker";
import { normalizeFilesToMediaItems } from "@/lib/mediaUtils";
import StudioShelf from "@/components/studio/StudioShelf";
import PostSuccessOverlay from '../PostSuccessOverlay';

import CreateMomentHero from "./CreateMomentHero";
import CreateMomentMediaStage from "./CreateMomentMediaStage";
import CreateMomentComposerPanel from "./CreateMomentComposerPanel";
import CreateMomentShareBar from "./CreateMomentShareBar";
import { useDraftPersistence } from "./useDraftPersistence";
import { CreateMomentProps, GolfCourse, UploadProgressState } from "./types";

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
  onMediaChange
}: CreateMomentProps) {
  const { setCreateMomentModalOpen } = useModalContext();
  const { activeActor, availableActors } = useActiveActor();
  const wrapperRef = useRef<HTMLDivElement>(null);
  
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
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  
  // Upload progress
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({
    status: 'idle',
    uploadedFiles: 0,
    totalFiles: 0,
  });

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
  const canPost = hasMedia && !isSubmitting && uploadProgress.status !== 'uploading';
  const course = selectedCourse || snapCourse;
  const isBusinessActor = activeActor?.type === 'business';
  const currentFilter = hasMedia ? getEdits(media[activeIndex]?.id)?.filter : undefined;

  // Modal context sync
  useEffect(() => {
    setCreateMomentModalOpen(isOpen);
  }, [isOpen, setCreateMomentModalOpen]);

  // Header hiding
  useImmersiveHeader(Boolean(isOpen));
  useChromeState({ forceHidden: isOpen, disabled: false });

  // Body class for global styles
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('ecm-open');
    }
    return () => {
      document.body.classList.remove('ecm-open');
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
      setUploadProgress({ status: 'idle', uploadedFiles: 0, totalFiles: 0 });
      
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

  // Post handler with progress tracking
  const handlePost = async () => {
    if (!canPost) return;
    
    setUploadProgress({
      status: 'uploading',
      uploadedFiles: 0,
      totalFiles: media.length,
    });

    const files = media.map(item => item.file);
    
    const studioEditsByMediaId = media.reduce((acc, item) => {
      const edits = getEdits?.(item.id);
      if (edits?.filter) {
        acc[item.id] = { filter: edits.filter };
      }
      return acc;
    }, {} as Record<string, { filter: string }>);
    
    try {
      await onSubmit({
        caption,
        files,
        mediaItems: media,
        selectedCourse: course,
        visibility: snapVisibility,
        isPrivate: snapVisibility === "private",
        backgroundMusic: null,
        coverIndex,
        studioEditsByMediaId
      });
      
      setUploadProgress({
        status: 'success',
        uploadedFiles: media.length,
        totalFiles: media.length,
      });
      
      clearDraft();
      setShowSuccessOverlay(true);
    } catch (error) {
      setUploadProgress({
        status: 'failed',
        uploadedFiles: 0,
        totalFiles: media.length,
        error: 'Upload failed. Please try again.',
      });
    }
  };

  // Success overlay handler
  const handleSuccessComplete = () => {
    setShowSuccessOverlay(false);
    setTimeout(() => {
      onClose();
    }, 100);
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

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Main sheet */}
      <div 
        ref={wrapperRef}
        role="dialog"
        aria-modal="true"
        aria-label="Create a Moment"
        className="ecm-glass-sheet fixed inset-0"
        style={{
          background: 'rgba(15, 15, 15, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
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
        {/* Grabber bar */}
        {!hasMedia && <div className="hub-grabber" />}

        {/* Media Stage */}
        <section
          id="media" 
          className="absolute inset-x-0 overflow-hidden z-[1002]"
          style={{ 
            top: 'env(safe-area-inset-top, 0px)',
            bottom: 'var(--composer-height)'
          }}
        >
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

        {/* Composer Panel */}
        <section 
          className="composer absolute bottom-0 left-0 right-0 z-[1003] rounded-t-none flex flex-col"
          style={{ 
            height: 'var(--composer-height)',
            background: 'rgba(15, 15, 15, 0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Scrollable content area */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <CreateMomentComposerPanel
              hasMedia={hasMedia}
              caption={caption}
              onCaptionChange={setCaption}
              selectedCourse={course}
              onCourseSelect={(c) => {
                setSelectedCourse(c);
                onCourseSelect?.(c);
              }}
              onOpenStudio={openStudio}
              availableActorsCount={availableActors.length}
              currentFilter={currentFilter}
              onTypingStateChange={setIsTyping}
            />
          </div>

          {/* Share Bar - sticky at bottom, safe-area aware */}
          <div 
            className="flex-shrink-0 px-4 pt-2 border-t border-white/8"
            style={{ 
              paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
              background: 'rgba(15, 15, 15, 0.98)'
            }}
          >
            <CreateMomentShareBar
              canPost={canPost}
              uploadProgress={uploadProgress}
              onPost={handlePost}
              onRetry={() => setUploadProgress({ status: 'idle', uploadedFiles: 0, totalFiles: 0 })}
            />
          </div>
        </section>

        {/* Draft prompt */}
        <AnimatePresence>
          {showDraftPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-20 left-4 right-4 z-[1010] p-4 rounded-2xl"
              style={{
                background: 'rgba(30, 30, 35, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p className="text-white text-sm font-medium mb-3">Resume your draft?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleRestoreDraft}
                  className="flex-1 py-2 rounded-xl bg-white/20 text-white text-sm font-medium"
                >
                  Resume
                </button>
                <button
                  onClick={handleDiscardDraft}
                  className="flex-1 py-2 rounded-xl bg-white/10 text-white/70 text-sm"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success overlay */}
        <PostSuccessOverlay 
          isVisible={showSuccessOverlay} 
          onComplete={handleSuccessComplete}
        />
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
    </div>
  );
}
