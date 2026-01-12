import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { arrayMove } from "@dnd-kit/sortable";
import { Bookmark, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { prefersReduced } from '@/lib/ui/motion';
import { useSnapModal, ComposerMediaItem } from "@/hooks/useSnapModal";
import { useModalContext } from '@/contexts/ModalContext';
import { useImmersiveHeader } from '@/hooks/useImmersiveHeader';
import { useChromeState } from '@/hooks/useChromeState';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useStudio } from "@/hooks/useStudio";
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useDrafts } from '@/hooks/useDrafts';
import { openMediaPicker } from "@/utils/openMediaPicker";
import { normalizeFilesToMediaItems } from "@/lib/mediaUtils";
import { enqueuePostUpload } from "@/uploads/uploadPipeline";
import StudioShelf from "@/components/studio/StudioShelf";
import { OverlayPortalProvider } from "@/context/OverlayPortalContext";

import CreateMomentHero from "./CreateMomentHero";
import CreateMomentMediaStage from "./CreateMomentMediaStage";
import CreateMomentCanvas from "./CreateMomentCanvas";
import CreateMomentControlBar from "./CreateMomentControlBar";
import { MomentCategorySheet, MomentAudienceSheet, EnhanceMomentSheet, MomentBadgesSheet, AiCaptionSheet, SmartCompilationSheet, DraftsListSheet } from "./sheets";
import { CreateMomentProps, GolfCourse, TaggableEntity, MomentVisibility } from "./types";
import type { DraftWithMedia } from "@/services/drafts";

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
  
  // UI state - using IDs for stable references (not indices)
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [isInteractingWithMedia, setIsInteractingWithMedia] = useState(false);
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
  const [showAiCaptionSheet, setShowAiCaptionSheet] = useState(false);
  const [showSmartCompilationSheet, setShowSmartCompilationSheet] = useState(false);
  const [showDraftsSheet, setShowDraftsSheet] = useState(false);
  
  // Get user session
  const { user } = useSupabaseSession();

  // Database-backed drafts
  const { 
    drafts, 
    draftCount, 
    createDraft, 
    deleteDraft, 
    canCreateDraft,
    isCreating: isSavingDraft,
  } = useDrafts();

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

  // Position mode state for text tool
  const [isPositioningText, setIsPositioningText] = useState(false);
  
  // Active overlay selection for multi-text stacking
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  
  // Reset position mode when tool changes
  useEffect(() => {
    if (activeTool !== 'text') {
      setIsPositioningText(false);
      setActiveOverlayId(null);
    }
  }, [activeTool]);
  
  // Toggle position mode handler
  const handleTogglePositionMode = () => {
    setIsPositioningText(prev => !prev);
  };

  // Derived state
  const media = useMemo(() => (mediaItems || []).slice(0, 10), [mediaItems]);
  const hasMedia = media.length > 0;
  const hasCategories = selectedCategories.length > 0;
  
  // Derive activeIndex from activeMediaId
  const activeIndex = useMemo(() => {
    if (!activeMediaId) return 0;
    const idx = media.findIndex(m => m.id === activeMediaId);
    return idx >= 0 ? idx : 0;
  }, [media, activeMediaId]);
  
  // Count videos for Smart Compilation availability
  const videoCount = useMemo(() => media.filter(m => m.type === 'video').length, [media]);
  // Soft-gated: Share button enabled if media exists - category check happens on tap
  const canPost = hasMedia && !isSubmitting && !!user;
  const course = selectedCourse || snapCourse;
  const isBusinessActor = activeActor?.type === 'business';
  const currentFilter = hasMedia ? getEdits(media[activeIndex]?.id)?.filter : undefined;
  
  // Initialize activeMediaId and coverMediaId when media changes
  useEffect(() => {
    if (media.length > 0) {
      // If current active is not in media, reset to first
      if (!activeMediaId || !media.some(m => m.id === activeMediaId)) {
        setActiveMediaId(media[0].id);
      }
      // If cover is not in media, reset to first
      if (!coverMediaId || !media.some(m => m.id === coverMediaId)) {
        setCoverMediaId(media[0].id);
      }
    } else {
      setActiveMediaId(null);
      setCoverMediaId(null);
    }
  }, [media, activeMediaId, coverMediaId]);

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
      setSelectedBadges([]);
      setVisibility('anyone');
      
      // Check for drafts (DB-backed)
      if (draftCount > 0) {
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
  }, [isOpen, mode, setCaption, setSelectedCourse, onCourseSelect, setSnapVisibility, mediaItems, hasEdits, clearEdits, draftCount]);

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

  // Animated close - no longer auto-saves to draft on close
  // Users must explicitly save drafts via the Save Draft button
  const animateAndClose = useCallback(() => {
    if (prefersReduced() || typeof window === 'undefined') {
      onClose();
      return;
    }

    setIsExiting(true);
    setTranslateY(window.innerHeight);

    setTimeout(() => {
      onClose();
    }, ECM_EXIT_DURATION);
  }, [onClose]);

  // Touch handlers for swipe-to-dismiss - HANDLE-ONLY
  // Only allow dismiss from the grabber handle area, not from hero/thumbnails
  const isHandleArea = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest('[data-ecm-handle="true"]');
  };

  const shouldBlockDismiss = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    // Block if inside media stage, thumbnail strip, or any no-dismiss zone
    return !!target.closest('[data-ecm-no-dismiss="true"]') || 
           !!target.closest('[data-ecm-scroll-container="true"]');
  };

  const handleSheetTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    // Block all dismiss gestures when interacting with media (dragging thumbs, swiping hero)
    if (isInteractingWithMedia) return;
    // Only allow drag-to-dismiss from the handle area
    if (isExiting || shouldBlockDismiss(e.target) || !isHandleArea(e.target)) return;
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };

  const handleSheetTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging || dragStartY == null || isExiting || isInteractingWithMedia) return;
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

  // Remove media handler - now using mediaId
  const handleRemoveMedia = useCallback((mediaId: string) => {
    if (!onMediaChange || media.length === 0) return;
    
    const indexToRemove = media.findIndex(m => m.id === mediaId);
    if (indexToRemove === -1) return;
    
    const newMedia = media.filter(m => m.id !== mediaId);
    onMediaChange(newMedia);
    
    // Also clear edits for removed media
    clearEdits(mediaId);
    
    // If we removed the active media, select a nearby one
    if (activeMediaId === mediaId && newMedia.length > 0) {
      const newActiveIndex = Math.min(indexToRemove, newMedia.length - 1);
      setActiveMediaId(newMedia[newActiveIndex].id);
    }
    
    // If we removed the cover media, set cover to first remaining
    if (coverMediaId === mediaId && newMedia.length > 0) {
      setCoverMediaId(newMedia[0].id);
    }
  }, [media, onMediaChange, activeMediaId, coverMediaId, clearEdits]);

  // Reorder media handler - IDs follow the media objects automatically
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (!onMediaChange) return;
    
    const reordered = arrayMove(media, fromIndex, toIndex);
    onMediaChange(reordered);
    // Note: activeMediaId and coverMediaId stay the same (they follow the media object)
  }, [media, onMediaChange]);
  
  // Set cover handler
  const handleSetCover = useCallback((mediaId: string) => {
    setCoverMediaId(mediaId);
  }, []);
  
  // Active media change handler
  const handleActiveMediaChange = useCallback((mediaId: string) => {
    setActiveMediaId(mediaId);
  }, []);

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
    
    // Check if ANY media has music - music is post-level, applies to all media
    // When music exists, all videos should have their original audio muted
    const postLevelMusic = media.reduce<{
      trackId: string;
      title: string;
      artist?: string;
      url: string;
      startAt?: number;
      volume?: number;
    } | null>((found, item) => {
      if (found) return found;
      const edits = getEdits?.(item.id);
      if (edits?.music) {
        return {
          trackId: edits.music.trackId,
          title: edits.music.title,
          artist: edits.music.artist,
          url: edits.music.url || '',
          startAt: edits.music.startAt ?? 0,
          volume: edits.music.volume ?? 0.8,
        };
      }
      return null;
    }, null);
    
    // Build full studio edits including filter, music, audioMode, textOverlays, crop, and rotate
    // When post has music, ALL media items get the same music and audioMode: 'music_only'
    const studioEditsByMediaId = media.reduce((acc, item) => {
      const edits = getEdits?.(item.id);
      const hasEdits = !!edits && (
        !!edits.filter || 
        !!edits.music || 
        !!edits.audioMode || 
        (edits.textOverlays?.length ?? 0) > 0 ||
        !!edits.crop?.ratio ||
        !!edits.rotate
      );
      
      // If post has music OR item has individual edits, include in payload
      if (hasEdits || postLevelMusic) {
        acc[item.id] = {
          ...(edits?.filter && { filter: edits.filter }),
          ...(edits?.crop?.ratio && { crop: { ratio: edits.crop.ratio } }),
          ...(edits?.rotate && { rotate: edits.rotate }),
          // Post-level music: apply same music to all media items
          ...(postLevelMusic && { music: postLevelMusic }),
          ...(edits?.textOverlays?.length ? { textOverlays: edits.textOverlays } : {}),
          // When post has music, ALL media uses music_only (mutes original video audio)
          audioMode: postLevelMusic ? 'music_only' as const : (edits?.audioMode ?? 'original' as const),
        };
      }
      return acc;
    }, {} as Record<string, { filter?: string; crop?: { ratio: string }; rotate?: number; music?: { trackId: string; title: string; artist?: string; url: string; startAt?: number; volume?: number }; textOverlays?: Array<{ id: string; text: string; x: number; y: number; scale: number; style: string; color?: string }>; audioMode?: 'original' | 'music_only' }>);
    
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
        badges: selectedBadges,
      });
      
      onClose();
    } catch (error) {
      console.error('[CreateMomentModal] Failed to enqueue post upload:', error);
      // Don't close modal on error - let user retry
    }
  };

  // Save draft handler (new DB-backed approach)
  const handleSaveDraft = async () => {
    if (!user || !canCreateDraft) {
      if (!canCreateDraft) {
        toast.error('Draft limit reached (10 max)');
      }
      return;
    }
    
    try {
      await createDraft({
        actorType: activeActor?.type || 'personal',
        actorId: activeActor?.id || user.id,
        content: caption || null,
        visibility,
        categories: selectedCategories,
        badges: selectedBadges,
        courseId: course?.id || null,
        courseName: course?.name || null,
        courseCountry: course?.country || null,
        studioMusic: null, // TODO: extract from studio edits
        audioMode: null,
      });
      toast.success('Draft saved');
    } catch (error) {
      console.error('[CreateMomentModal] Failed to save draft:', error);
      toast.error('Failed to save draft');
    }
  };

  // Load draft handler (from DraftsListSheet)
  const handleLoadDraft = (draft: DraftWithMedia) => {
    // Restore caption
    setCaption(draft.content || '');
    
    // Restore visibility
    setVisibility(draft.visibility);
    
    // Restore categories and badges
    setSelectedCategories(draft.categories || []);
    setSelectedBadges(draft.badges || []);
    
    // Restore course if available
    if (draft.courseId && draft.courseName && draft.courseCountry) {
      const restoredCourse: GolfCourse = {
        id: draft.courseId,
        name: draft.courseName,
        country: draft.courseCountry,
      };
      setSelectedCourse(restoredCourse);
      onCourseSelect?.(restoredCourse);
    }
    
    // Note: Media restoration would require downloading from storage
    // For now, drafts restore text content only
    // Media can be added fresh after loading a draft
    
    setShowDraftPrompt(false);
    toast.success('Draft loaded');
  };

  // View drafts handler
  const handleViewDrafts = () => {
    setShowDraftPrompt(false);
    setShowDraftsSheet(true);
  };

  // Dismiss draft prompt
  const handleDismissDraftPrompt = () => {
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
          {/* Header bar with grabber, save draft, and drafts access */}
          <div 
            data-ecm-handle="true"
            className="absolute left-0 right-0 flex items-center justify-between px-4 py-3 z-30"
            style={{ top: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Left: Drafts button (if has drafts) */}
            <div className="w-10">
              {draftCount > 0 && (
                <button
                  onClick={() => setShowDraftsSheet(true)}
                  className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors"
                  style={{ background: 'var(--cm-surface-card)', border: '1px solid var(--cm-border-subtle)' }}
                  aria-label="View drafts"
                >
                  <FileEdit size={16} style={{ color: 'var(--cm-text-secondary)' }} />
                  <span 
                    className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-semibold rounded-full"
                    style={{ background: 'var(--cm-surface-slate)', color: 'white' }}
                  >
                    {draftCount}
                  </span>
                </button>
              )}
            </div>
            
            {/* Center: Grabber */}
            <div className="cm-grabber" />
            
            {/* Right: Save Draft button */}
            <div className="w-10 flex justify-end">
              {(hasMedia || caption.trim()) && (
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || !canCreateDraft}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-colors disabled:opacity-50"
                  style={{ background: 'var(--cm-surface-card)', border: '1px solid var(--cm-border-subtle)' }}
                  aria-label="Save draft"
                >
                  <Bookmark size={16} style={{ color: 'var(--cm-text-secondary)' }} />
                </button>
              )}
            </div>
          </div>
          {hasMedia ? (
            <CreateMomentMediaStage
              media={media}
              activeMediaId={activeMediaId}
              coverMediaId={coverMediaId}
              onActiveMediaChange={handleActiveMediaChange}
              onSetCover={handleSetCover}
              onRemoveMedia={handleRemoveMedia}
              onReorder={handleReorder}
              getEdits={getEdits}
              activeTool={activeTool}
              onUpdateEdits={updateEdits}
              isPositioningText={isPositioningText}
              activeOverlayId={activeOverlayId}
              onSelectOverlay={setActiveOverlayId}
              selectedBadges={selectedBadges}
              onDragStateChange={setIsInteractingWithMedia}
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
              className="w-full h-10 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[.99] disabled:cursor-not-allowed flex items-center justify-center"
              style={{
                background: hasMedia ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                border: hasMedia ? 'none' : '1px solid var(--cm-border-subtle)',
                color: hasMedia ? 'white' : 'var(--cm-text-tertiary)',
                boxShadow: hasMedia ? '0 4px 12px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                opacity: hasMedia ? 1 : 0.7,
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

        {/* Draft prompt - updated for DB-backed drafts */}
        <AnimatePresence>
          {showDraftPrompt && draftCount > 0 && (
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
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--cm-text-primary)' }}>
                You have {draftCount} saved draft{draftCount !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleViewDrafts}
                  className="flex-1 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--cm-surface-slate)', color: 'white' }}
                >
                  View Drafts
                </button>
                <button
                  onClick={handleDismissDraftPrompt}
                  className="flex-1 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--cm-surface-alt)', color: 'var(--cm-text-secondary)', border: '1px solid var(--cm-border-subtle)' }}
                >
                  Start Fresh
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
        activeMediaPreviewUrl={media[activeIndex]?.previewUrl || null}
        activeMediaThumbnailUrl={media[activeIndex]?.thumbnailUrl || media[activeIndex]?.previewUrl || null}
        edits={getEdits(media[activeIndex]?.id || '')}
        updateEdits={(patch) => {
          // Music is post-level: when music is added/changed, apply to ALL media items
          // This ensures the music track plays for the entire post, not just one media item
          if ('music' in patch) {
            media.forEach(item => {
              updateEdits(item.id, { music: patch.music });
            });
          } else {
            // Other edits (filter, text, crop, etc.) remain per-media
            updateEdits(media[activeIndex]?.id || '', patch);
          }
        }}
        clearEdits={() => clearEdits(media[activeIndex]?.id || '')}
        isPositioningText={isPositioningText}
        onTogglePositionMode={handleTogglePositionMode}
        activeOverlayId={activeOverlayId}
        onSelectOverlay={setActiveOverlayId}
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
        onOpenAiCaption={() => {
          setShowEnhanceSheet(false);
          setShowAiCaptionSheet(true);
        }}
        onOpenSmartCompilation={() => {
          setShowEnhanceSheet(false);
          setShowSmartCompilationSheet(true);
        }}
        videoCount={videoCount}
      />

      <MomentBadgesSheet
        isOpen={showBadgesSheet}
        onClose={() => setShowBadgesSheet(false)}
        selectedBadges={selectedBadges}
        onBadgesChange={setSelectedBadges}
      />

      <AiCaptionSheet
        isOpen={showAiCaptionSheet}
        onClose={() => setShowAiCaptionSheet(false)}
        onInsertCaption={(text, mode) => {
          if (mode === 'replace') {
            setCaption(text);
          } else {
            setCaption(prev => prev.trim() ? `${prev}\n\n${text}` : text);
          }
        }}
        existingCaption={caption}
        prefilledCourseName={course?.name}
      />

      <SmartCompilationSheet
        isOpen={showSmartCompilationSheet}
        onClose={() => setShowSmartCompilationSheet(false)}
        mediaItems={media}
        existingMusic={hasMedia ? getEdits(media[0]?.id)?.music : null}
        onCompilationComplete={(compiledMedia) => {
          // Replace all media with the compiled video
          onMediaChange?.([compiledMedia]);
          setActiveMediaId(compiledMedia.id);
          setCoverMediaId(compiledMedia.id);
        }}
      />

      {/* Drafts List Sheet */}
      <DraftsListSheet
        isOpen={showDraftsSheet}
        onClose={() => setShowDraftsSheet(false)}
        onLoadDraft={handleLoadDraft}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
