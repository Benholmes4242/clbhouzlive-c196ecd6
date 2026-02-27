import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { arrayMove } from "@dnd-kit/sortable";
import { Bookmark, Images } from "lucide-react";
import { POST_LIMITS } from "@/constants/postLimits";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { prefersReduced } from '@/lib/ui/motion';
import { useSnapModal, ComposerMediaItem } from "@/hooks/useSnapModal";
import { useModalContext } from '@/contexts/ModalContext';
import { useImmersiveHeader } from '@/hooks/useImmersiveHeader';
import { useChromeState } from '@/hooks/useChromeState';
import { useActiveActor, ActiveActor } from '@/context/ActiveActorContext';
import { useStudio } from "@/hooks/useStudio";
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useDrafts } from '@/hooks/useDrafts';
import { useScheduledPosts, type ScheduledPost } from '@/hooks/useScheduledPosts';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { publishNow as publishScheduledNow, updateScheduledPost } from '@/services/posts/scheduledPosts';
import { pickMediaFiles } from "@/utils/media/pickMediaFiles";
import { normalizeFilesToMediaItems } from "@/lib/mediaUtils";
import { enqueuePostUpload } from "@/uploads/uploadPipeline";
import { enqueuePostUploadWithResilience } from "@/hooks/usePostUploadResilience";
import StudioShelf from "@/components/studio/StudioShelf";
import { OverlayPortalProvider } from "@/context/OverlayPortalContext";

import CreateMomentHero from "./CreateMomentHero";
import CreateMomentMediaStage from "./CreateMomentMediaStage";
import CreateMomentCanvas from "./CreateMomentCanvas";
import CreateMomentControlBar from "./CreateMomentControlBar";
import CourseTagInput from "@/components/posts/CourseTagInput";
import { CourseSearchSheet } from "@/components/courses/CourseSearchSheet";
import CreateMomentHeader from "./CreateMomentHeader";
import PostingOptionsSheet from "./PostingOptionsSheet";
import { UploadProgressBar } from "./UploadProgressBar";
import { SmartCompilationSheet, DraftsAndScheduledSheet, ScheduleSheet } from "./sheets";
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
  const [showPostingOptionsSheet, setShowPostingOptionsSheet] = useState(false);
  const [showEnhanceSheet, setShowEnhanceSheet] = useState(false);
  const [showBadgesSheet, setShowBadgesSheet] = useState(false);
  
  const [showSmartCompilationSheet, setShowSmartCompilationSheet] = useState(false);
  const [showDraftsSheet, setShowDraftsSheet] = useState(false);
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showScheduledPostsSheet, setShowScheduledPostsSheet] = useState(false);
  const [showCourseSearchSheet, setShowCourseSearchSheet] = useState(false);
  const [showUploadCancelConfirm, setShowUploadCancelConfirm] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  
  // Local actor override for this post (doesn't change global context)
  const [localActorOverride, setLocalActorOverride] = useState<ActiveActor | null>(null);
  
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
  
  // Upload progress tracking
  const uploadProgress = useUploadProgress();
  
  // Edit mode indicator
  const isEditMode = !!editingPostId;
  
  // Manual draft save ref (used to cancel pending saves on modal close)
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
  const canPost = hasMedia && !!user;
  const course = selectedCourse || snapCourse;
  
  // Determine the effective actor for posting (local override takes precedence)
  const effectiveActor = localActorOverride || activeActor;
  const isBusinessActor = effectiveActor?.type === 'business';
  const currentFilter = hasMedia ? getEdits(media[activeIndex]?.id)?.filter : undefined;
  
  // Sync activeMediaId and coverMediaId when media changes
  // Only reset if current selection doesn't exist in the new media array
  useEffect(() => {
    if (media.length > 0) {
      // Only reset activeMediaId if current one doesn't exist in media array
      const activeExists = activeMediaId && media.some(m => m.id === activeMediaId);
      if (!activeExists) {
        setActiveMediaId(media[0].id);
      }
      
      // Only reset coverMediaId if current one doesn't exist in media array
      const coverExists = coverMediaId && media.some(m => m.id === coverMediaId);
      if (!coverExists) {
        setCoverMediaId(media[0].id);
      }
    } else {
      setActiveMediaId(null);
      setCoverMediaId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media]); // Remove activeMediaId and coverMediaId from dependencies to prevent loop

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
      setLocalActorOverride(null); // Reset local actor override on new post
      
      // CRITICAL: Reset submission guard to prevent stuck state from previous sessions
      isSubmittingRef.current = false;
      
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
  // Auto-save disabled - users must manually save drafts via the Save Draft button
  // The timer logic has been removed to prevent automatic draft creation

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

  // Check if upload is in progress
  const isUploadInProgress = uploadProgress.isUploading;

  // Animated close - no longer auto-saves to draft on close
  // Users must explicitly save drafts via the Save Draft button
  const animateAndClose = useCallback(() => {
    // If upload is in progress, show confirmation dialog instead
    if (isUploadInProgress) {
      setShowUploadCancelConfirm(true);
      return;
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
  }, [onClose, isUploadInProgress]);
  
  // Force close (after user confirms cancellation)
  const forceClose = useCallback(() => {
    setShowUploadCancelConfirm(false);
    uploadProgress.stopTracking();
    
    if (prefersReduced() || typeof window === 'undefined') {
      onClose();
      return;
    }

    setIsExiting(true);
    setTranslateY(window.innerHeight);

    setTimeout(() => {
      onClose();
    }, ECM_EXIT_DURATION);
  }, [onClose, uploadProgress]);

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
        const result = await normalizeFilesToMediaItems(files);
        
        // Show validation errors to user
        if (result.errors.length > 0) {
          result.errors.forEach(err => {
            toast.error(`${err.fileName}: ${err.error}`);
          });
        }
        
        // Only add valid items
        if (result.validItems.length > 0) {
          const combined = [...media, ...result.validItems].slice(0, POST_LIMITS.MAX_MEDIA_COUNT);
          onMediaChange?.(combined);
        }
      }
      document.body.removeChild(input);
    });

    input.click();
  };

  // Gallery picker handler
  const handlePickFromLibrary = async () => {
    const remainingSlots = POST_LIMITS.MAX_MEDIA_COUNT - media.length;
    if (remainingSlots <= 0) return;
    
    const files = await pickMediaFiles({ 
      accept: 'image/*,video/*', 
      multiple: remainingSlots > 1,
      maxFiles: remainingSlots
    });
    
    if (files.length > 0) {
      const result = await normalizeFilesToMediaItems(files);
      
      // Show validation errors to user
      if (result.errors.length > 0) {
        result.errors.forEach(err => {
          toast.error(`${err.fileName}: ${err.error}`);
        });
      }
      
      // Only add valid items
      if (result.validItems.length > 0) {
        const combined = [...media, ...result.validItems].slice(0, POST_LIMITS.MAX_MEDIA_COUNT);
        onMediaChange?.(combined);
      }
    }
  };

  // Remove media handler - now using mediaId
  const handleRemoveMedia = useCallback((mediaId: string) => {
    if (!onMediaChange || media.length === 0) return;
    
    const indexToRemove = media.findIndex(m => m.id === mediaId);
    if (indexToRemove === -1) return;
    
    // Revoke blob URLs to prevent memory leak
    const itemToRemove = media[indexToRemove];
    if (itemToRemove?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }
    if (itemToRemove?.thumbnailUrl && itemToRemove.thumbnailUrl !== itemToRemove.previewUrl && itemToRemove.thumbnailUrl.startsWith('blob:')) {
      URL.revokeObjectURL(itemToRemove.thumbnailUrl);
    }
    
    const newMedia = media.filter(m => m.id !== mediaId);
    
    // Clear any studio edits for this media
    clearEdits(mediaId);
    
    // Pre-calculate new active/cover IDs before state update to avoid race condition
    let newActiveId: string | null = activeMediaId;
    let newCoverId: string | null = coverMediaId;
    
    if (newMedia.length === 0) {
      newActiveId = null;
      newCoverId = null;
    } else {
      if (activeMediaId === mediaId) {
        const newActiveIndex = Math.min(indexToRemove, newMedia.length - 1);
        newActiveId = newMedia[newActiveIndex].id;
      }
      if (coverMediaId === mediaId) {
        newCoverId = newMedia[0].id;
      }
    }
    
    // Batch state updates - set IDs first, then media
    setActiveMediaId(newActiveId);
    setCoverMediaId(newCoverId);
    onMediaChange(newMedia);
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
      effectiveActor: effectiveActor?.type,
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
        actorType: effectiveActor?.type === 'business' ? 'business' : 'personal',
        actorId: effectiveActor?.type === 'business' ? effectiveActor.id : user.id,
        filesCount: files.length,
        categories: selectedCategories,
      });
      
      // Update media items to show pending status
      const mediaWithStatus = media.map(m => ({
        ...m,
        uploadStatus: 'pending' as const,
      }));
      onMediaChange?.(mediaWithStatus);
      
      // Use resilient upload with IndexedDB persistence
      // This returns the job ID that will be used for progress tracking
      const pipelineJobId = await enqueuePostUploadWithResilience({
        userId: user.id,
        actorType: effectiveActor?.type === 'business' ? 'business' : 'personal',
        actorId: effectiveActor?.type === 'business' ? effectiveActor.id : user.id,
        caption,
        courseInfo: course ? { id: course.id, name: course.name, country: course.country || '' } : undefined,
        selectedTags,
        files,
        mediaItems: media,
        studioEditsByMediaId,
        visibility,
      });
      
      // Start tracking with the SAME job ID used by the pipeline
      // This ensures progress events are correctly received
      const fileIds = media.map(m => m.id);
      uploadProgress.startTracking(pipelineJobId, files.length, fileIds);
      
      console.log('[CreateMomentModal] Post upload enqueued with job ID:', pipelineJobId);
      
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
      
      // Show feedback that upload is happening in background
      toast.success('Posting in background...', {
        description: 'Your moment will appear in feeds once uploaded.',
        duration: 3000,
      });
      
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
        actorType: effectiveActor?.type === 'business' ? 'business' : 'personal',
        actorId: effectiveActor?.type === 'business' ? effectiveActor.id : user.id,
        caption,
        courseInfo: course ? { id: course.id, name: course.name, country: course.country || '' } : undefined,
        selectedTags,
        files,
        mediaItems: media,
        studioEditsByMediaId: {},
        visibility,
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
    
    // Get new media items that need uploading (not restored from a previous draft)
    const newMediaItems = media.filter(m => !m.isRestored && m.file);
    
    const draftInput = {
      actorType: effectiveActor?.type || 'personal',
      actorId: effectiveActor?.id || user.id,
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

  // Load draft handler
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
        {/* LinkedIn-style Header */}
        <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)', background: '#F8FAFC' }}>
          <CreateMomentHeader
            selectedActor={effectiveActor}
            onOpenPostingOptions={() => setShowPostingOptionsSheet(true)}
            onClose={animateAndClose}
            draftCount={draftCount}
            onOpenDrafts={() => setShowDraftsSheet(true)}
            scheduledCount={scheduledCount}
            onOpenScheduled={() => setShowScheduledPostsSheet(true)}
            onOpenScheduleSheet={() => setShowScheduleSheet(true)}
            canPost={canPost && !uploadProgress.isUploading}
            isSubmitting={isScheduling || uploadProgress.isUploading}
            onPost={isEditMode ? handlePublishScheduledNow : handlePost}
            isEditMode={isEditMode}
          />
          
          {/* Upload Progress Bar */}
          <UploadProgressBar
            isUploading={uploadProgress.isUploading}
            uploadedCount={uploadProgress.uploadedCount}
            totalCount={uploadProgress.totalCount}
          />
        </div>

        {/* Media Stage - grey background */}
        <section
          id="media" 
          data-ecm-handle="true"
          className="relative flex-1 min-h-0 overflow-hidden z-[1002]"
          style={{ 
            background: 'var(--cm-surface-alt)',
          }}
        >
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

        {/* Canvas - Caption & Location (modern flat design) */}
        <section
          className="composer relative z-[1003] flex flex-col"
          style={{
            background: '#F8FAFC',
          }}
        >
          <OverlayPortalProvider container={overlayRoot}>
            <CreateMomentCanvas
              hasMedia={hasMedia}
              caption={caption}
              onCaptionChange={setCaption}
              selectedCourse={null}
              onCourseSelect={() => {}}
              onTypingStateChange={setIsTyping}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </OverlayPortalProvider>

          {/* Separator using page background */}
          <div className="h-1" style={{ background: '#F8FAFC' }} />

          {/* Tag a course - Edge to edge with 6px gap to viewport */}
          <button 
            onClick={() => setShowCourseSearchSheet(true)}
            className="flex items-center justify-between py-4 transition-colors mx-auto"
            style={{ background: '#f1f5f9', width: 'calc(100% - 12px)', paddingLeft: '16px', paddingRight: '16px' }}
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {course ? (
                <span className="text-[15px]" style={{ color: '#1e293b' }}>{course.name}</span>
              ) : (
                <span className="text-[15px]" style={{ color: '#64748b' }}>Tag where this was played</span>
              )}
            </div>
            {course ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCourse(null);
                  onCourseSelect?.(null);
                }}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Clear course"
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {/* Action buttons - Gallery, Studio and Tag */}
          <div 
            className="flex items-center justify-center gap-2 px-4 py-3"
            style={{ background: '#F8FAFC' }}
          >
            {/* Gallery button - only show if under media limit */}
            {media.length < POST_LIMITS.MAX_MEDIA_COUNT && (
              <button
                onClick={handlePickFromLibrary}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
                style={{ 
                  background: '#f1f5f9',
                  color: '#1e293b',
                }}
              >
                <Images className="h-4 w-4" />
                Add
              </button>
            )}
            <button
              onClick={() => openStudio()}
              disabled={!hasMedia}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
              style={{ 
                background: '#f1f5f9',
                color: hasMedia ? '#1e293b' : '#94a3b8',
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              Studio
            </button>
            <button
              onClick={() => setShowCategorySheet(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
              style={{ 
                background: selectedCategories.length > 0 ? '#e2e8f0' : '#f1f5f9',
                color: '#1e293b',
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              {selectedCategories.length > 0 ? `${selectedCategories.length} Tag${selectedCategories.length > 1 ? 's' : ''}` : 'Tags'}
            </button>
          </div>

          {/* Safe area padding at bottom */}
          <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }} />
        </section>

        {/* Overlay root for dropdowns/popovers inside the modal */}
        <div
          ref={overlayRootRef}
          id="create-moment-overlay-root"
          className="pointer-events-none absolute inset-0 z-[1010]"
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
      <PostingOptionsSheet
        isOpen={showPostingOptionsSheet}
        onClose={() => setShowPostingOptionsSheet(false)}
        selectedActor={effectiveActor}
        availableActors={availableActors}
        onActorChange={(actor) => setLocalActorOverride(actor)}
        visibility={visibility}
        onVisibilityChange={setVisibility}
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

      {/* Combined Drafts & Scheduled Sheet */}
      <DraftsAndScheduledSheet
        isOpen={showDraftsSheet || showScheduledPostsSheet}
        onClose={() => {
          setShowDraftsSheet(false);
          setShowScheduledPostsSheet(false);
        }}
        onLoadDraft={handleLoadDraft}
        onEditScheduledPost={handleEditScheduledPost}
        onSaveDraft={handleSaveDraft}
        canSaveDraft={media.length > 0 || caption.trim().length > 0}
        defaultTab={showScheduledPostsSheet ? 'scheduled' : 'drafts'}
      />
      
      {/* Schedule Sheet - handles both create and edit mode */}
      <ScheduleSheet
        isOpen={showScheduleSheet}
        onClose={() => setShowScheduleSheet(false)}
        onSchedule={isEditMode ? handleUpdateScheduledPost : handleSchedulePost}
        isScheduling={isScheduling}
        initialDate={editingScheduledAt || undefined}
      />

      {/* Course Search Sheet */}
      <CourseSearchSheet
        isOpen={showCourseSearchSheet}
        onClose={() => setShowCourseSearchSheet(false)}
        onSelectCourse={(c) => {
          setSelectedCourse({ id: c.id, name: c.name, country: c.country, region: c.region || undefined });
          onCourseSelect?.({ id: c.id, name: c.name, country: c.country, region: c.region || undefined });
          setShowCourseSearchSheet(false);
        }}
      />

      {/* Upload Cancel Confirmation Dialog */}
      <AlertDialog open={showUploadCancelConfirm} onOpenChange={setShowUploadCancelConfirm}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel upload?</AlertDialogTitle>
            <AlertDialogDescription>
              Your media is still uploading. If you close now, your post won't be shared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep uploading</AlertDialogCancel>
            <AlertDialogAction 
              onClick={forceClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return createPortal(modalContent, document.body);
}
