import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { arrayMove } from "@dnd-kit/sortable";
import { Bookmark, FileEdit, Clock } from "lucide-react";
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
import { useScheduledPosts, type ScheduledPost } from '@/hooks/useScheduledPosts';
import { publishNow as publishScheduledNow, updateScheduledPost } from '@/services/posts/scheduledPosts';
import { openMediaPicker } from "@/utils/openMediaPicker";
import { normalizeFilesToMediaItems } from "@/lib/mediaUtils";
import { enqueuePostUpload } from "@/uploads/uploadPipeline";
import { enqueuePostUploadWithResilience } from "@/hooks/usePostUploadResilience";
import StudioShelf from "@/components/studio/StudioShelf";
import { OverlayPortalProvider } from "@/context/OverlayPortalContext";

import CreateMomentHero from "./CreateMomentHero";
import CreateMomentMediaStage from "./CreateMomentMediaStage";
import CreateMomentCanvas from "./CreateMomentCanvas";
import CreateMomentControlBar from "./CreateMomentControlBar";
import { MomentCategorySheet, MomentAudienceSheet, EnhanceMomentSheet, MomentBadgesSheet, AiCaptionSheet, SmartCompilationSheet, DraftsListSheet, ScheduleSheet } from "./sheets";
import { ScheduledPostsList } from "@/components/post/scheduled";
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
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showScheduledPostsSheet, setShowScheduledPostsSheet] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  
  // Edit mode state for scheduled posts
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingScheduledAt, setEditingScheduledAt] = useState<Date | null>(null);
  const [isLoadingEditPost, setIsLoadingEditPost] = useState(false);
  
  // Current draft ID for update vs create logic (prevents duplicate drafts)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  
  // Pending scheduled date (used when user needs to select category first)
  const [pendingScheduledAt, setPendingScheduledAt] = useState<Date | null>(null);
  
  // Get user session
  const { user } = useSupabaseSession();

  // Database-backed drafts with media persistence
  const { 
    drafts, 
    draftCount, 
    createDraft,
    updateDraft: updateExistingDraft,
    uploadMedia: uploadDraftMedia,
    deleteDraft, 
    canCreateDraft,
    isCreating: isSavingDraft,
    isUploadingMedia,
    draftMediaToComposerItem,
    refetch: refetchDrafts,
  } = useDrafts();
  
  // Scheduled posts
  const { count: scheduledCount, refetch: refetchScheduledPosts } = useScheduledPosts();
  
  // Edit mode indicator
  const isEditMode = !!editingPostId;
  
  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMediaCountRef = useRef(0);

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
      setCurrentDraftId(null); // Reset draft tracking on new post
      
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
  
  // Auto-save timer: Start 30s countdown when media changes
  // Updates existing draft if currentDraftId is set, otherwise creates new (prevents duplicates)
  useEffect(() => {
    // Only run when modal is open and we have new media (not restored)
    const newMediaItems = media.filter(m => !m.isRestored && m.file);
    const newMediaCount = newMediaItems.length;
    
    // Clear existing timer on any change
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    // Don't start timer if modal is closed
    if (!isOpen) {
      return;
    }
    
    // Start timer if we have new media and user is authenticated
    // Skip if we're updating an existing draft and can't create new (to avoid errors)
    const canAutoSave = currentDraftId || canCreateDraft;
    if (newMediaCount > 0 && user && canAutoSave) {
      autoSaveTimerRef.current = setTimeout(async () => {
        const draftInput = {
          actorType: activeActor?.type || 'personal',
          actorId: activeActor?.id || user.id,
          content: caption || null,
          visibility,
          categories: selectedCategories,
          badges: selectedBadges,
          courseId: course?.id || null,
          courseName: course?.name || null,
          courseCountry: course?.country || null,
          studioMusic: null,
          audioMode: null,
        };
        
        try {
          let draftId = currentDraftId;
          
          if (currentDraftId) {
            // Update existing draft (prevents duplicates)
            console.log('[CreateMomentModal] Auto-save: updating existing draft:', currentDraftId);
            await updateExistingDraft(currentDraftId, draftInput);
          } else {
            // Create new draft only if none exists for this session
            console.log('[CreateMomentModal] Auto-save: creating new draft...');
            const draft = await createDraft(draftInput);
            draftId = draft?.id || null;
            if (draftId) {
              setCurrentDraftId(draftId);
              console.log('[CreateMomentModal] Auto-save: new draft created:', draftId);
            }
          }
          
          // Upload media if we have any new files and draft exists
          if (draftId && newMediaItems.length > 0) {
            const result = await uploadDraftMedia(draftId, newMediaItems, getEdits);
            console.log('[CreateMomentModal] Auto-save complete:', result.uploaded.length, 'media uploaded');
            toast.success(currentDraftId ? 'Draft updated' : `Draft auto-saved with ${result.uploaded.length} media`);
          }
        } catch (error) {
          console.error('[CreateMomentModal] Auto-save failed:', error);
          // Silent fail for auto-save
        }
      }, 30000); // 30 seconds
    }
    
    lastMediaCountRef.current = newMediaCount;
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isOpen, media, user, canCreateDraft, createDraft, updateExistingDraft, uploadDraftMedia, activeActor, caption, visibility, selectedCategories, selectedBadges, course, getEdits, currentDraftId]);
  
  // Clear auto-save timer when modal closes (fix timer leak)
  useEffect(() => {
    if (!isOpen && autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, [isOpen]);

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

  // Ref to prevent duplicate submissions
  const isSubmittingRef = useRef(false);
  
  // Post handler - soft-gated flow (auto-open category sheet if missing)
  const handlePost = async () => {
    // Prevent duplicate submissions from rapid taps
    if (isSubmittingRef.current) {
      console.log('[CreateMomentModal] Submission already in progress, ignoring tap');
      return;
    }
    
    console.log('[CreateMomentModal] handlePost called:', {
      hasMedia,
      userId: user?.id,
      mediaCount: media.length,
      categories: selectedCategories,
      activeActor: activeActor?.type,
    });
    
    if (!hasMedia || !user) {
      console.log('[CreateMomentModal] BLOCKED: Missing media or user');
      return;
    }
    
    // Soft-gated: if no categories, open category sheet instead of blocking
    if (selectedCategories.length === 0) {
      console.log('[CreateMomentModal] No categories selected - showing category sheet');
      setShowCategorySheet(true);
      return;
    }

    // Extract files from media items and filter out any undefined/null
    const files = media.map(item => item.file).filter((f): f is File => f instanceof File);
    
    // Check for restored media (already uploaded from drafts)
    const restoredMedia = media.filter(m => m.isRestored && m.restoredMediaUrl);
    
    console.log('[CreateMomentModal] Media validation:', {
      filesCount: files.length,
      restoredMediaCount: restoredMedia.length,
    });
    
    // CRITICAL: Validate we have at least some media to post (files OR restored)
    if (files.length === 0 && restoredMedia.length === 0) {
      console.error('[CreateMomentModal] BLOCKED: No valid files or restored media found');
      toast.error('No media to upload');
      return;
    }
    
    // Mark as submitting to prevent duplicate submissions
    isSubmittingRef.current = true;
    
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
      console.log('[CreateMomentModal] Enqueueing post upload:', {
        userId: user.id,
        actorType: activeActor?.type === 'business' ? 'business' : 'personal',
        actorId: activeActor?.type === 'business' ? activeActor.id : user.id,
        filesCount: files.length,
        categories: selectedCategories,
      });
      
      // Use resilient upload with IndexedDB persistence
      await enqueuePostUploadWithResilience({
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
      
      console.log('[CreateMomentModal] Post upload enqueued successfully');
      
      // If this was from a draft, delete it after successful post
      if (currentDraftId) {
        try {
          await deleteDraft(currentDraftId);
          console.log('[CreateMomentModal] Deleted draft after posting:', currentDraftId);
          setCurrentDraftId(null);
          refetchDrafts(); // Update the drafts list/count
        } catch (err) {
          console.error('[CreateMomentModal] Failed to delete draft:', err);
          // Don't block - post was successful
        }
      }
      
      onClose();
    } catch (error: any) {
      console.error('[CreateMomentModal] Failed to enqueue post upload:', error);
      // Show specific error message if available
      const errorMessage = error?.message || 'Failed to start upload';
      toast.error(errorMessage);
    } finally {
      // Reset submission guard
      isSubmittingRef.current = false;
    }
  };
  
  // Schedule post handler - actually processes the scheduled upload
  const proceedWithScheduledPost = async (scheduledAt: Date) => {
    if (!hasMedia || !user) return;
    
    const files = media.map(item => item.file).filter((f): f is File => f instanceof File);
    const restoredMedia = media.filter(m => m.isRestored && m.restoredMediaUrl);
    
    // Allow either new files OR restored media
    if (files.length === 0 && restoredMedia.length === 0) {
      console.error('[CreateMomentModal] No media to schedule');
      toast.error('No media to schedule');
      return;
    }
    
    setIsScheduling(true);
    
    console.log('[CreateMomentModal] Scheduling post for:', scheduledAt.toISOString(), {
      status: 'scheduled',
      categories: selectedCategories,
    });
    
    try {
      // Use resilient upload with IndexedDB persistence for scheduled posts
      await enqueuePostUploadWithResilience({
        userId: user.id,
        actorType: activeActor?.type === 'business' ? 'business' : 'personal',
        actorId: activeActor?.type === 'business' ? activeActor.id : user.id,
        caption,
        courseInfo: course ? { id: course.id, name: course.name, country: course.country || '' } : undefined,
        selectedTags,
        files,
        mediaItems: media,
        studioEditsByMediaId: {},
        categories: selectedCategories,
        visibility,
        badges: selectedBadges,
        scheduledAt,
      });
      
      // If this was from a draft, delete it after successful schedule
      if (currentDraftId) {
        try {
          await deleteDraft(currentDraftId);
          console.log('[CreateMomentModal] Deleted draft after scheduling:', currentDraftId);
          setCurrentDraftId(null);
          refetchDrafts(); // Update the drafts list/count
        } catch (err) {
          console.error('[CreateMomentModal] Failed to delete draft:', err);
          // Don't block - schedule was successful
        }
      }
      
      setShowScheduleSheet(false);
      setPendingScheduledAt(null);
      toast.success(`Post scheduled for ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      
      // Refetch scheduled posts count
      refetchScheduledPosts();
      
      onClose();
    } catch (error) {
      console.error('[CreateMomentModal] Failed to schedule post:', error);
      toast.error('Failed to schedule post');
    } finally {
      setIsScheduling(false);
    }
  };

  // Schedule post handler - entry point from ScheduleSheet
  const handleSchedulePost = async (scheduledAt: Date) => {
    if (!hasMedia || !user) return;
    
    // If no category selected, remember the schedule and redirect to category selection
    if (selectedCategories.length === 0) {
      setPendingScheduledAt(scheduledAt);
      setShowScheduleSheet(false);
      setShowCategorySheet(true);
      return;
    }
    
    // Proceed with scheduling
    await proceedWithScheduledPost(scheduledAt);
  };
  
  // Handler when category is selected from MomentCategorySheet
  const handleCategoryConfirm = (categories: string[]) => {
    setSelectedCategories(categories);
    setShowCategorySheet(false);
    
    // If we have a pending schedule, proceed with it now that we have categories
    if (pendingScheduledAt) {
      proceedWithScheduledPost(pendingScheduledAt);
    }
  };

  // Save draft handler (new DB-backed approach with media upload)
  // Supports update if currentDraftId is set, otherwise creates new
  const handleSaveDraft = async () => {
    if (!user) return;
    
    // If updating existing draft, skip canCreateDraft check
    if (!currentDraftId && !canCreateDraft) {
      toast.error('Draft limit reached (10 max)');
      return;
    }
    
    // Cancel any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    // Get new media items that need uploading (not restored from a previous draft)
    const newMediaItems = media.filter(m => !m.isRestored && m.file);
    
    const draftInput = {
      actorType: activeActor?.type || 'personal',
      actorId: activeActor?.id || user.id,
      content: caption || null,
      visibility,
      categories: selectedCategories,
      badges: selectedBadges,
      courseId: course?.id || null,
      courseName: course?.name || null,
      courseCountry: course?.country || null,
      studioMusic: null,
      audioMode: null,
    };
    
    try {
      let draftId = currentDraftId;
      
      if (currentDraftId) {
        // Update existing draft
        await updateExistingDraft(currentDraftId, draftInput);
        console.log('[CreateMomentModal] Updated existing draft:', currentDraftId);
      } else {
        // Create new draft
        const draft = await createDraft(draftInput);
        draftId = draft?.id || null;
        if (draftId) {
          setCurrentDraftId(draftId);
          console.log('[CreateMomentModal] Created new draft:', draftId);
        }
      }
      
      // Upload media if we have any new files and draft exists
      if (draftId && newMediaItems.length > 0) {
        toast.loading('Uploading media...', { id: 'draft-media-upload' });
        const result = await uploadDraftMedia(draftId, newMediaItems, getEdits);
        toast.dismiss('draft-media-upload');
        
        if (result.failed.length > 0) {
          toast.warning(`Draft saved with ${result.uploaded.length}/${newMediaItems.length} media`);
        } else {
          toast.success(currentDraftId ? 'Draft updated' : `Draft saved with ${result.uploaded.length} media`);
        }
      } else {
        toast.success(currentDraftId ? 'Draft updated' : 'Draft saved');
      }
    } catch (error) {
      console.error('[CreateMomentModal] Failed to save draft:', error);
      toast.dismiss('draft-media-upload');
      toast.error('Failed to save draft');
    }
  };

  // Load draft handler (from DraftsListSheet)
  const handleLoadDraft = (draft: DraftWithMedia) => {
    // Track the loaded draft ID for updates
    setCurrentDraftId(draft.id);
    
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
    
    // Restore media from draft
    if (draft.media && draft.media.length > 0 && onMediaChange) {
      const restoredMedia = draft.media.map(draftMediaToComposerItem);
      onMediaChange(restoredMedia);
    }
    
    // Close drafts sheet and prompt
    setShowDraftsSheet(false);
    setShowDraftPrompt(false);
    
    toast.success(`Draft loaded${draft.media?.length ? ` with ${draft.media.length} media` : ''}`);
  };

  // Load scheduled post for editing
  const handleEditScheduledPost = async (post: ScheduledPost) => {
    if (!onMediaChange) return;
    
    setIsLoadingEditPost(true);
    
    try {
      // Set edit mode
      setEditingPostId(post.id);
      setEditingScheduledAt(new Date(post.scheduledAt));
      
      // Restore caption
      setCaption(post.content || '');
      
      // Restore visibility
      setVisibility(post.visibility as MomentVisibility);
      
      // Restore categories and badges
      setSelectedCategories(post.categories || []);
      setSelectedBadges(post.badges || []);
      
      // Restore course if available
      if (post.courseId) {
        // We need to fetch the course details - for now use courseId only
        // The course will be displayed by ID if we don't have full details
        // Future: could add course lookup here
      }
      
      // Restore media from scheduled post
      if (post.media && post.media.length > 0) {
        const restoredMedia: ComposerMediaItem[] = post.media.map((m, idx) => ({
          id: m.id,
          type: m.mediaType,
          previewUrl: m.mediaUrl,
          thumbnailUrl: m.posterUrl || undefined,
          duration: m.durationSeconds || undefined,
          width: m.width || undefined,
          height: m.height || undefined,
          aspectRatio: m.aspectRatio || undefined,
          isRestored: true,
          restoredMediaUrl: m.mediaUrl,
          restoredStreamId: m.streamId || undefined,
        }));
        onMediaChange(restoredMedia);
        
        // Restore studio edits if present
        post.media.forEach(m => {
          if (m.studioEdits || m.filterId) {
            updateEdits(m.id, {
              ...(m.filterId ? { filter: m.filterId } : {}),
              ...(m.studioEdits || {}),
            });
          }
        });
      }
      
      // Close scheduled posts sheet
      setShowScheduledPostsSheet(false);
      
      toast.success('Editing scheduled post');
    } catch (error) {
      console.error('[CreateMomentModal] Failed to load scheduled post:', error);
      toast.error('Failed to load scheduled post');
      setEditingPostId(null);
      setEditingScheduledAt(null);
    } finally {
      setIsLoadingEditPost(false);
    }
  };

  // Clear edit mode
  const clearEditMode = () => {
    setEditingPostId(null);
    setEditingScheduledAt(null);
  };

  // Update scheduled post handler
  const handleUpdateScheduledPost = async (newScheduledAt?: Date) => {
    if (!editingPostId || !user) return;
    
    setIsScheduling(true);
    
    try {
      const success = await updateScheduledPost(editingPostId, {
        content: caption || null,
        categories: selectedCategories,
        badges: selectedBadges,
        visibility,
        courseId: course?.id || null,
        scheduledAt: newScheduledAt || editingScheduledAt || undefined,
      });
      
      if (success) {
        await refetchScheduledPosts();
        setShowScheduleSheet(false);
        toast.success(newScheduledAt ? 'Schedule updated' : 'Scheduled post updated');
        clearEditMode();
        onClose();
      } else {
        toast.error('Failed to update scheduled post');
      }
    } catch (error) {
      console.error('[CreateMomentModal] Failed to update scheduled post:', error);
      toast.error('Failed to update scheduled post');
    } finally {
      setIsScheduling(false);
    }
  };

  // Publish scheduled post now (in edit mode)
  const handlePublishScheduledNow = async () => {
    if (!editingPostId) return;
    
    setIsScheduling(true);
    
    try {
      // First update the content
      await updateScheduledPost(editingPostId, {
        content: caption || null,
        categories: selectedCategories,
        badges: selectedBadges,
        visibility,
        courseId: course?.id || null,
      });
      
      // Then publish
      const success = await publishScheduledNow(editingPostId);
      
      if (success) {
        await refetchScheduledPosts();
        toast.success('Post published!');
        clearEditMode();
        onClose();
      } else {
        toast.error('Failed to publish post');
      }
    } catch (error) {
      console.error('[CreateMomentModal] Failed to publish scheduled post:', error);
      toast.error('Failed to publish post');
    } finally {
      setIsScheduling(false);
    }
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
          {/* Header bar - grabber at top center, drafts left, bookmark right */}
          <div 
            data-ecm-handle="true"
            className="absolute left-0 right-0 flex items-center justify-between px-4 z-30"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
          >
            {/* Left: Drafts button (if has drafts) - Glass style with dark badge */}
            <div className="w-8">
              {draftCount > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[Drafts] Icon clicked, opening sheet');
                    setShowDraftsSheet(true);
                  }}
                  className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center relative"
                  aria-label="View drafts"
                >
                  <FileEdit size={14} className="text-white/90" />
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-black/50 backdrop-blur-sm text-white text-[9px] font-medium flex items-center justify-center border border-white/10">
                    {draftCount}
                  </span>
                </button>
              )}
            </div>
            
            {/* Center: Grabber bar */}
            <div className="w-9 h-1 rounded-full bg-white/30" />
            
            {/* Right: Scheduled + Save Draft (Bookmark) buttons - Glass style */}
            <div className="flex items-center gap-2">
              {/* Scheduled posts button */}
              {scheduledCount > 0 && (
                <button
                  onClick={() => setShowScheduledPostsSheet(true)}
                  className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center relative"
                  aria-label={`View ${scheduledCount} scheduled posts`}
                >
                  <Clock size={14} className="text-white/90" />
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-black/50 backdrop-blur-sm text-white text-[9px] font-medium flex items-center justify-center border border-white/10">
                    {scheduledCount > 9 ? '9+' : scheduledCount}
                  </span>
                </button>
              )}
              
              {/* Save Draft (Bookmark) button */}
              {(hasMedia || caption.trim()) && (
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || !canCreateDraft}
                  className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center disabled:opacity-50"
                  aria-label="Save draft"
                >
                  <Bookmark size={14} className="text-white/90" />
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

          {/* Share + Schedule Buttons - Different in edit mode */}
          <div
            className="flex-shrink-0 px-4 pt-2"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
              background: 'var(--cm-surface-card)',
            }}
          >
            {isEditMode ? (
              /* Edit mode buttons */
              <div className="flex gap-2">
                {/* Update Schedule button */}
                <button
                  disabled={!hasMedia || isScheduling}
                  onClick={() => setShowScheduleSheet(true)}
                  className="h-10 px-4 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[.99] disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  style={{
                    background: 'var(--cm-surface-alt)',
                    border: '1px solid var(--cm-border-subtle)',
                    color: hasMedia ? 'var(--cm-text-secondary)' : 'var(--cm-text-tertiary)',
                    opacity: hasMedia && !isScheduling ? 1 : 0.7,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {editingScheduledAt ? 'Reschedule' : 'Schedule'}
                </button>
                
                {/* Post Now button (publishes immediately) */}
                <button
                  disabled={!hasMedia || isScheduling}
                  onClick={handlePublishScheduledNow}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[.99] disabled:cursor-not-allowed flex items-center justify-center"
                  style={{
                    background: hasMedia ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                    border: hasMedia ? 'none' : '1px solid var(--cm-border-subtle)',
                    color: hasMedia ? 'white' : 'var(--cm-text-tertiary)',
                    boxShadow: hasMedia ? '0 4px 12px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                    opacity: hasMedia && !isScheduling ? 1 : 0.7,
                  }}
                >
                  {isScheduling ? 'Publishing...' : 'Post Now'}
                </button>
              </div>
            ) : (
              /* Create mode buttons */
              <div className="flex gap-2">
                {/* Schedule button */}
                <button
                  disabled={!hasMedia}
                  onClick={() => setShowScheduleSheet(true)}
                  className="h-10 px-4 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[.99] disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  style={{
                    background: 'var(--cm-surface-alt)',
                    border: '1px solid var(--cm-border-subtle)',
                    color: hasMedia ? 'var(--cm-text-secondary)' : 'var(--cm-text-tertiary)',
                    opacity: hasMedia ? 1 : 0.7,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Schedule
                </button>
                
                {/* Share Now button */}
                <button
                  disabled={!hasMedia}
                  onClick={handlePost}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[.99] disabled:cursor-not-allowed flex items-center justify-center"
                  style={{
                    background: hasMedia ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
                    border: hasMedia ? 'none' : '1px solid var(--cm-border-subtle)',
                    color: hasMedia ? 'white' : 'var(--cm-text-tertiary)',
                    boxShadow: hasMedia ? '0 4px 12px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                    opacity: hasMedia ? 1 : 0.7,
                  }}
                >
                  Share Now
                </button>
              </div>
            )}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[DraftPrompt] View Drafts clicked');
                    handleViewDrafts();
                  }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--cm-surface-slate)', color: 'white' }}
                >
                  View Drafts
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDismissDraftPrompt();
                  }}
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
        onClose={() => {
          setShowCategorySheet(false);
          // Clear pending schedule if user dismisses without selecting
          if (pendingScheduledAt) {
            setPendingScheduledAt(null);
          }
        }}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        onConfirm={handleCategoryConfirm}
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
      
      {/* Schedule Sheet - handles both create and edit mode */}
      <ScheduleSheet
        isOpen={showScheduleSheet}
        onClose={() => setShowScheduleSheet(false)}
        onSchedule={isEditMode ? handleUpdateScheduledPost : handleSchedulePost}
        isScheduling={isScheduling}
        initialDate={editingScheduledAt || undefined}
      />
      
      {/* Scheduled Posts List */}
      <ScheduledPostsList
        isOpen={showScheduledPostsSheet}
        onClose={() => setShowScheduledPostsSheet(false)}
        onEditPost={handleEditScheduledPost}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
