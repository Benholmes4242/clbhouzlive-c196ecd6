import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Globe, Lock, Sparkles, BarChart3, Play, Layers, Camera, X } from "lucide-react";
import { prefersReduced } from '@/lib/ui/motion';
import { useSnapModal, ComposerMediaItem } from "@/hooks/useSnapModal";
import { useOptimisticPostSubmission } from "@/hooks/useOptimisticPostSubmission";
import { supabase } from "@/integrations/supabase/client";
import PostSuccessOverlay from './PostSuccessOverlay';
import { useModalContext } from '@/contexts/ModalContext';
import { useImmersiveHeader } from '@/hooks/useImmersiveHeader';
import { useChromeState } from '@/hooks/useChromeState';
import CourseTagInput from "@/components/posts/CourseTagInput";
import BackgroundMusicSelector from "@/components/posts/BackgroundMusicSelector";
import MediaCarousel from "@/components/posts/MediaCarousel";
import CarouselDots from "@/components/posts/CarouselDots";
import { MediaNavigationDots } from "@/components/posts/user-post/overlays/MediaNavigationDots";
import { openMediaPicker } from "@/utils/openMediaPicker";
import { normalizeFilesToMediaItems } from "@/lib/mediaUtils";
import { useStudio } from "@/hooks/useStudio";
import StudioShelf from "@/components/studio/StudioShelf";

const CAPTION_OVERLAP_PX = 16; // small, neat overlap

// Liquid Glass Backdrop Component
const LiquidGlassBackdrop = ({ isVisible }: { isVisible: boolean }) => {
  const prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
  
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-[1001]"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {/* Liquid glass layer with frosted effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'var(--ecm-glass-bg)',
          backdropFilter: prefersReducedTransparency ? 'none' : `blur(var(--ecm-glass-blur)) saturate(var(--ecm-glass-saturate))`,
          WebkitBackdropFilter: prefersReducedTransparency ? 'none' : `blur(var(--ecm-glass-blur)) saturate(var(--ecm-glass-saturate))`,
        }}
      />
      
      {/* Inner glow for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center top, var(--ecm-inner-glow) 0%, transparent 60%)',
          pointerEvents: 'none'
        }}
      />
      
      {/* Border highlight */}
      <div 
        className="absolute inset-0 rounded-[inherit]"
        style={{
          boxShadow: 'inset 0 0 0 1px var(--ecm-glass-border), inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none'
        }}
      />
    </motion.div>
  );
};

// Stars loading component
const StarsLoading = () => (
  <span className="inline-flex items-center gap-1" aria-live="polite" aria-busy="true">
    <span className="animate-star1 text-lg">✨</span>
    <span className="animate-star2 text-lg">✨</span>
    <span className="animate-star3 text-lg">✨</span>
  </span>
);

type Props = { 
  theme?: "dark" | "light";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialFiles?: File[]; // Deprecated: kept for backward compatibility but not used
  mediaItems?: ComposerMediaItem[]; // Single source of truth
  selectedCourse?: any;
  onCourseSelect?: (course: any) => void;
  onMediaChange?: (items: ComposerMediaItem[]) => void;
};

export default function EnhancedCreateMomentModalCinematic({ 
  theme = "dark", 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting,
  initialFiles = [],
  mediaItems = [],
  selectedCourse,
  onCourseSelect,
  onMediaChange
}: Props) {
  const { setCreateMomentModalOpen } = useModalContext();
  const [aiLoading, setAiLoading] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Hub-style animation constants
  const ECM_ENTRY_DURATION = 240;
  const ECM_EXIT_DURATION = 240;
  const ECM_ENTRY_EASING = 'cubic-bezier(.2,.8,.2,1)';
  const ECM_EXIT_EASING = 'cubic-bezier(.2,.8,.2,1)';
  const DRAG_THRESHOLD = 120;
  
  // Hub-style animation state
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const reduced = prefersReduced();
    if (reduced) return 0;
    return window.innerHeight;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasEntered, setHasEntered] = useState(() => {
    if (typeof window === 'undefined') return true;
    return prefersReduced();
  });
  const [isExiting, setIsExiting] = useState(false);
  
  // Studio hook integration
  const {
    studioOpen,
    activeTool,
    studioState,
    openStudio,
    closeStudio,
    setActiveTool,
    updateEdits,
    clearEdits,
    getEdits,
    hasEdits
  } = useStudio();

  // Check for reduced motion preference
  const prefersReducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Update modal context when create moment modal opens/closes
  useEffect(() => {
    setCreateMomentModalOpen(isOpen);
  }, [isOpen, setCreateMomentModalOpen]);

  // Global header hiding for reliable cross-environment support
  useImmersiveHeader(Boolean(isOpen));

  // Chrome auto-hide integration - force hidden when ECM is open (matches Hub behavior)
  useChromeState({
    forceHidden: isOpen,
    disabled: false,
  });

  // Hide global header while modal is active (body class approach)
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('ecm-open');
    }
    return () => {
      document.body.classList.remove('ecm-open');
    };
  }, [isOpen]);
  
  console.log('🔍 EnhancedCreateMomentModal state:', { isOpen, hasDataImmersive: document.documentElement.hasAttribute('data-immersive') });

  // Media carousel state - use mediaItems as single source of truth
  const media = useMemo(() => {
    return (mediaItems || []).slice(0, 5);
  }, [mediaItems]);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [coverIndex, setCoverIndex] = useState(0);
  const canSlide = media.length > 1;
  
  // Touch handlers for swipe
  const startX = useRef<number | null>(null);

  // Dynamic height measurement for overlap
  const wrapperRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const [mediaHeight, setMediaHeight] = useState<number | undefined>(undefined);

  const {
    caption,
    setCaption,
    selectedCourse: snapCourse,
    setSelectedCourse,
    openComposerWithFiles
  } = useSnapModal();

  // Use the media items from props
  const course = selectedCourse || snapCourse;

  const canPost = useMemo(() => media?.length > 0 && !isSubmitting, [media, isSubmitting]);
  const hasMedia = media.length > 0;

  // Format video duration helper
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Remove current media item
  const handleRemoveMedia = () => {
    if (!onMediaChange || media.length === 0) return;
    
    const newMedia = media.filter((_, idx) => idx !== activeIndex);
    onMediaChange(newMedia);
    
    // Adjust active index if necessary
    if (activeIndex >= newMedia.length) {
      setActiveIndex(Math.max(0, newMedia.length - 1));
    }
  };

  // Helper: is this touch inside a scroll container?
  const isInsideScrollContainer = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest('[data-ecm-scroll-container="true"]');
  };

  // Animated close with slide-down (Hub-style)
  const animateAndClose = useCallback(() => {
    const reduced = prefersReduced();

    if (reduced) {
      onClose();
      return;
    }

    if (typeof window === 'undefined') {
      onClose();
      return;
    }

    setIsExiting(true);
    setTranslateY(window.innerHeight);

    window.setTimeout(() => {
      onClose();
    }, ECM_EXIT_DURATION);
  }, [onClose, ECM_EXIT_DURATION]);

  // Close handler
  const close = () => animateAndClose();

  // Touch handlers for swipe-to-dismiss (Hub-style)
  const handleSheetTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (isExiting) return;

    const touch = e.touches[0];
    const target = e.target;

    // Ignore touches starting inside scroll containers
    if (isInsideScrollContainer(target)) {
      return;
    }

    setIsDragging(true);
    setDragStartY(touch.clientY);
  };

  const handleSheetTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging || dragStartY == null || isExiting) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY;

    if (deltaY <= 0) {
      // Don't drag upwards
      setTranslateY(0);
      return;
    }

    // Directly follow the finger
    setTranslateY(deltaY);
  };

  const handleSheetTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (!isDragging || isExiting) return;

    if (translateY > DRAG_THRESHOLD) {
      animateAndClose();
    } else {
      // Snap back
      setTranslateY(0);
    }

    setIsDragging(false);
    setDragStartY(null);
  };

  // Carousel navigation
  const prevMedia = () => setActiveIndex((i) => (i - 1 + media.length) % media.length);
  const nextMedia = () => setActiveIndex((i) => (i + 1) % media.length);

  // Touch handlers for mobile swipe (media carousel)
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const delta = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(delta) > 40) {
      delta < 0 ? nextMedia() : prevMedia();
    }
    startX.current = null;
  };

  // Measure and set media height
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    const cap = captionRef.current;
    if (!el || !cap) return;

    const measure = () => {
      const wrapperH = el.clientHeight;
      const captionH = cap.clientHeight;
      const h = Math.max(120, wrapperH - (captionH - CAPTION_OVERLAP_PX));
      setMediaHeight(h);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(cap);
    return () => ro.disconnect();
  }, []);

  // Listen for close modal events from carousel slides
  useEffect(() => {
    const handleCloseModal = () => animateAndClose();
    window.addEventListener('closeModal', handleCloseModal);
    return () => window.removeEventListener('closeModal', handleCloseModal);
  }, [animateAndClose]);

  // Slide-in from bottom on mount (Hub-style)
  useEffect(() => {
    if (!isOpen) return;

    const reduced = prefersReduced();

    if (reduced || typeof window === 'undefined') {
      setTranslateY(0);
      setHasEntered(true);
      return;
    }

    // Reset state for fresh entry
    setTranslateY(window.innerHeight);
    setIsExiting(false);
    setHasEntered(false);

    // Next frame: enable transition and slide up to 0
    requestAnimationFrame(() => {
      setHasEntered(true);
      setTranslateY(0);
    });
  }, [isOpen]);

  // Escape key to close (Hub-style with animation)
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        animateAndClose();
      }
      // Carousel navigation still available
      if (canSlide && e.key === "ArrowLeft") prevMedia();
      if (canSlide && e.key === "ArrowRight") nextMedia();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [animateAndClose, canSlide, isOpen]);

  // AI Caption Generation
  const handleAICaption = async () => {
    try {
      setAiLoading(true);
      const firstMedia = media?.[0];
      if (!firstMedia) return;

      const body = {
        type: firstMedia.type === 'video' ? "video" : "image",
        previewUrl: 'previewUrl' in firstMedia ? firstMedia.previewUrl : URL.createObjectURL(firstMedia),
        captionContext: caption || "",
      };

      const { data, error } = await supabase.functions.invoke('ai-caption-generator', {
        body
      });
      
      if (error) throw error;
      
      if (data?.caption) {
        setCaption(data.caption);
      } else {
        throw new Error('Failed to generate caption');
      }
    } catch (error) {
      console.error('AI caption error:', error);
      // No toast here anymore - keep it simple
    } finally {
      setAiLoading(false);
    }
  };

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
        const combined = [...media, ...newItems].slice(0, 10); // Max 10 media items
        onMediaChange?.(combined);
      }
      document.body.removeChild(input);
    });

    input.click();
  };

  // Photo/Video library picker handler
  const handlePickFromLibrary = () => {
    openMediaPicker(async (files) => {
      if (files.length > 0) {
        const newItems = await normalizeFilesToMediaItems(files);
        const combined = [...media, ...newItems].slice(0, 10); // Max 10 media items
        onMediaChange?.(combined);
      }
    }, 10);
  };

  const handlePost = async () => {
    if (!canPost) return;
    
    // Show success overlay immediately for better UX
    setShowSuccessOverlay(true);
    
    // Derive files from media (single source of truth)
    const files = media.map(item => item.file);
    
    // Build studio edits mapping keyed by media ID
    const studioEditsByMediaId = media.reduce((acc, item) => {
      const edits = getEdits?.(item.id);
      if (edits?.filter) {
        acc[item.id] = { filter: edits.filter };
      }
      return acc;
    }, {} as Record<string, { filter: string }>);
    
    onSubmit({
      caption,
      files,
      mediaItems: media,
      selectedCourse: course,
      visibility,
      isPrivate: visibility === "private",
      backgroundMusic: null,
      coverIndex,
      studioEditsByMediaId
    });
  };

  const handleSuccessComplete = () => {
    setShowSuccessOverlay(false);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      onClose();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Glass Sheet with Hub-style slide animation */}
      <div 
        ref={wrapperRef}
        role="dialog"
        aria-modal="true"
        aria-label="Create a Moment"
        className="ecm-glass-sheet fixed inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.28)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.16)',
          transform: `translateY(${translateY}px)`,
          transition:
            // no transition while dragging or before first frame
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
        {/* Grabber bar - matching Hub page */}
        <div className="hub-grabber" />

              {/* MEDIA STAGE - full-bleed, top-anchored */}
              <section
                id="media" 
                className="absolute inset-x-0 overflow-hidden z-[1002]"
                style={{ 
                  top: 'env(safe-area-inset-top, 0px)',
                  bottom: 'var(--composer-height)'
                }}
              >
                {/* Top scrim for badge readability */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/28 to-transparent z-10" 
                  style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
                />

                {/* Bottom scrim for controls */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/18 to-transparent z-10" />

                <motion.div
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  transition={prefersReducedMotion ? 
                    { delay: 0.05, duration: 0.15 } : 
                    { 
                      delay: 0.1, 
                      duration: 0.3,
                      staggerChildren: 0.04
                    }
                  }
                  className="h-full w-full"
                >
                  {media.length === 0 ? (
                    /* Empty State Panel - with CTAs centered, no generic tap */
                    <div
                      className="h-full w-full flex items-center justify-center bg-transparent pointer-events-none"
                    >
                      <motion.div 
                        className="text-center px-6 max-w-[520px] flex flex-col items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      >
                        <Camera 
                          className="w-16 h-16 mb-4 opacity-80" 
                          strokeWidth={1.5}
                          aria-hidden="true"
                          style={{ color: 'white' }}
                        />
                        <h2 className="text-white/90 text-[18px] font-medium leading-snug max-w-[520px]">
                          Capture your next great golf moment – add a photo or video to share with your community.
                        </h2>
                        
                        {/* 16px gap below text */}
                        <div className="h-4" />
                        
                        {/* CTA row - re-enable pointer events only for buttons */}
                        <div className="pointer-events-auto flex items-center justify-center gap-3 sm:gap-4 z-10">
                          <button
                            type="button"
                            onClick={handlePickFromCamera}
                            aria-label="Open Camera"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white text-gray-900 px-4 py-2 shadow-sm active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-orange-300"
                          >
                            <Camera className="w-5 h-5" />
                            <span className="font-medium">Camera</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={handlePickFromLibrary}
                            aria-label="Choose Photos and Videos"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white text-gray-900 px-4 py-2 shadow-sm active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-orange-300"
                          >
                            <Sparkles className="w-5 h-5" />
                            <span className="font-medium">Photos &amp; Videos</span>
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <MediaCarousel
                      items={media.map((item, index) => {
                        const edits = getEdits?.(item.id);
                        return {
                          id: item.id,
                          type: item.type,
                          previewUrl: item.previewUrl,
                          file: item.file,
                          alt: `Media item ${item.id}`,
                          filterId: edits?.filter
                        };
                      })}
                      initialIndex={0}
                      onIndexChange={setActiveIndex}
                      onSetCover={setCoverIndex}
                      coverIndex={coverIndex}
                      enableSwipe
                      loop={false}
                      className="h-full w-full"
                    />
                  )}
                </motion.div>

                {/* Media counter - top left, 8px from top - only show when media exists */}
                {media.length > 0 && (
                  <div 
                    className="absolute left-4 z-20 flex items-center gap-2"
                    style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
                  >
                    <div className="rounded-full bg-white/55 backdrop-blur-[10px] border border-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-[rgba(25,25,28,0.85)] text-xs px-3 py-1.5 flex items-center gap-1">
                      <span className="font-medium">{activeIndex + 1}/{media.length}</span>
                    </div>
                  </div>
                )}

                {/* Remove media button - top right */}
                {media.length > 0 && (
                  <div 
                    className="absolute right-4 z-20"
                    style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
                  >
                    <button
                      onClick={handleRemoveMedia}
                      className="rounded-full bg-white/55 backdrop-blur-[10px] border border-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.12)] w-8 h-8 flex items-center justify-center transition-all hover:bg-white/70 active:scale-95"
                      aria-label="Remove current media"
                    >
                      <X className="w-4 h-4 text-[rgba(25,25,28,0.85)]" />
                    </button>
                  </div>
                )}


                {/* Video duration - bottom left, 8px from media bottom, frosted white */}
                {media[activeIndex]?.type === 'video' && (media[activeIndex] as ComposerMediaItem)?.duration && (
                  <div className="absolute bottom-[8px] left-4 z-20">
                    <div className="rounded-full bg-white/55 backdrop-blur-[10px] border border-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-[rgba(25,25,28,0.85)] text-xs px-3 py-1.5 flex items-center gap-1.5">
                      <Play className="w-2.5 h-2.5" />
                      <span className="font-medium">{formatDuration((media[activeIndex] as ComposerMediaItem)?.duration)}</span>
                    </div>
                  </div>
                )}

                {/* Media Navigation Dots - centered, 8px from bottom of media frame - only show when media exists */}
                {media.length > 0 && (
                  <MediaNavigationDots
                    mediaCount={media.length}
                    currentIndex={activeIndex}
                    onJump={setActiveIndex}
                    bottomOffset={8}
                    className="z-20"
                  />
                )}

              </section>

              {/* COMPOSER PANEL - fixed height, bottom-anchored with glass effect */}
              <section 
                className="composer absolute bottom-0 left-0 right-0 z-[1003] rounded-t-none border-t border-white/35"
                style={{ 
                  height: 'var(--composer-height)',
                  background: 'var(--ecm-glass)',
                  backdropFilter: 'blur(var(--ecm-blur))',
                  WebkitBackdropFilter: 'blur(var(--ecm-blur))',
                  boxShadow: '0 -1px 0 0 rgba(255,255,255,0.35), 0 10px 40px rgba(0,0,0,0.15)'
                }}
              >
                <div 
                  className="composer-scroll flex h-full flex-col px-4 pt-4 gap-4 overflow-auto"
                  style={{ 
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
                    maxHeight: 'var(--composer-height)',
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-y'
                  }}
                >
                  {/* Unified Details Section - No tabs, everything visible */}
                  <div className="flex flex-col gap-4 flex-1">
                    {/* Caption Section */}
                    <div className="flex flex-col">
                      <label className="block text-base font-semibold text-white mb-3">Add a caption</label>
                      
                      <textarea
                        className="caption-input w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-[15px] leading-snug resize-none placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-[rgba(255,156,64,0.5)] focus:shadow-[0_0_0_1px_rgba(255,156,64,0.35)] transition-all duration-200 min-h-[100px]"
                        placeholder="Write a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={4}
                      />
                    </div>

                    {/* Course Tagging Section */}
                    <div className="flex flex-col">
                      <CourseTagInput
                        onCourseSelect={onCourseSelect}
                        selectedCourse={course}
                      />
                      <p className="mt-2 text-xs text-white/60">
                        Tag a course to help other golfers discover your round
                      </p>
                    </div>

                    {/* Studio Entry Row */}
                    <button
                      onClick={openStudio}
                      disabled={media.length === 0}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                        media.length === 0
                          ? 'border-zinc-200 bg-zinc-100 cursor-not-allowed'
                          : 'border-zinc-300 bg-white hover:bg-zinc-50 hover:shadow-sm'
                      }`}
                      title={media.length === 0 ? 'Add media to open Studio' : 'Open Studio to edit your media'}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <div className={`text-sm font-semibold ${media.length === 0 ? 'text-zinc-400' : 'text-zinc-900'}`}>
                            Open Studio
                          </div>
                          <div className={`text-xs ${media.length === 0 ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            Add music, text, filters and edits
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${media.length === 0 ? 'text-zinc-300' : 'text-zinc-400'}`} />
                    </button>
                  </div>

                  {/* Visibility status line */}
                  {hasMedia && (
                    <div className="flex items-center justify-center gap-2 text-xs text-white/70">
                      <span>Sharing to: Clubhouse</span>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        {visibility === 'public' ? (
                          <>
                            <Globe className="w-3 h-3" />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Private</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Primary Share button */}
                  <button
                    disabled={!canPost}
                    onClick={handlePost}
                    className="w-full h-12 rounded-2xl bg-white border border-[rgba(255,156,64,0.35)] shadow-sm text-zinc-900 font-semibold transition-all duration-200 hover:bg-zinc-50 hover:border-[rgba(255,156,64,0.5)] active:scale-[.99] disabled:bg-zinc-200 disabled:text-zinc-500 disabled:border-zinc-300 focus:outline-none focus:border-[rgba(255,156,64,0.5)] focus:shadow-[0_0_0_1px_rgba(255,156,64,0.35)]"
                    aria-label="Post your moment"
                  >
                    {isSubmitting ? "Sharing..." : "Share"}
                  </button>
                </div>
              </section>

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

// Segmented Control Component - matches Snap Modal style
interface SegmentedOption {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

const Segmented = ({ options, value, onChange }: SegmentedProps) => {
  return (
    <div className="flex rounded-lg bg-white/5 border border-white/10 p-1">
      {options.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// Enhanced Media Carousel Component - simplified for this modal
interface EnhancedMediaCarouselProps {
  items: Array<{
    id: string;
    type: 'image' | 'video';
    previewUrl?: string;
    url?: string;
    file?: File;
  }>;
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onClose?: () => void;
}

const EnhancedMediaCarousel = ({ 
  items, 
  activeIndex, 
  onIndexChange, 
  onClose 
}: EnhancedMediaCarouselProps) => {
  const currentItem = items[activeIndex];
  
  if (!currentItem) return null;

  const imageUrl = currentItem.previewUrl || currentItem.url || (currentItem.file ? URL.createObjectURL(currentItem.file) : '');

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">

      {/* Media display */}
      <div className="w-full h-full flex items-center justify-center">
        {currentItem.type === 'video' ? (
          <video
            src={imageUrl}
            className="max-w-full max-h-full object-contain"
            controls
            muted
            playsInline
          />
        ) : (
          <img
            src={imageUrl}
            alt={`Media item ${currentItem.id}`}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Navigation dots */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => onIndexChange(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === activeIndex
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
