import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, useEffect, useRef, useLayoutEffect } from "react";
import { X, ChevronLeft, ChevronRight, Globe, Lock, Sparkles, BarChart3, Play, Layers, Camera } from "lucide-react";
import { useSnapModal, ComposerMediaItem } from "@/hooks/useSnapModal";
import { useOptimisticPostSubmission } from "@/hooks/useOptimisticPostSubmission";
import { supabase } from "@/integrations/supabase/client";
import PostSuccessOverlay from './PostSuccessOverlay';
import { useModalContext } from '@/contexts/ModalContext';
import { useImmersiveHeader } from '@/hooks/useImmersiveHeader';
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
  initialFiles?: File[];
  mediaItems?: ComposerMediaItem[];
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
  const [activeCard, setActiveCard] = useState<'caption' | 'course'>('caption');
  const prefersReducedMotion = useReducedMotion();
  
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

  // Media carousel state - use mediaItems if available, fallback to initialFiles
  const media = useMemo(() => {
    if (mediaItems?.length > 0) {
      return mediaItems.slice(0, 5);
    }
    return (initialFiles || []).slice(0, 5).map(file => ({
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      type: file.type.startsWith('video') ? 'video' as const : 'image' as const,
      file,
      previewUrl: URL.createObjectURL(file)
    }));
  }, [mediaItems, initialFiles]);
  
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

  // Use the media items or files and course from props
  const files = mediaItems?.length > 0 ? mediaItems.map(item => item.file) : initialFiles;
  const course = selectedCourse || snapCourse;

  const canPost = useMemo(() => media?.length > 0 && !isSubmitting, [media, isSubmitting]);

  // Close handler
  const close = () => onClose?.();

  // Listen for close modal events from carousel slides
  useEffect(() => {
    const handleCloseModal = () => close();
    window.addEventListener('closeModal', handleCloseModal);
    return () => window.removeEventListener('closeModal', handleCloseModal);
  }, []);

  // Carousel navigation
  const prevMedia = () => setActiveIndex((i) => (i - 1 + media.length) % media.length);
  const nextMedia = () => setActiveIndex((i) => (i + 1) % media.length);

  // Touch handlers for mobile swipe
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

  // Measure and set media height so it ends just beneath the caption,
  // leaving only a small CAPTION_OVERLAP_PX overlap.
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    const cap = captionRef.current;
    if (!el || !cap) return;

    const measure = () => {
      const wrapperH = el.clientHeight;
      const captionH = cap.clientHeight;
      // media area should be wrapper height minus caption height + small overlap
      const h = Math.max(120, wrapperH - (captionH - CAPTION_OVERLAP_PX));
      setMediaHeight(h);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(cap);
    return () => ro.disconnect();
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (canSlide && e.key === "ArrowLeft") prevMedia();
      if (canSlide && e.key === "ArrowRight") nextMedia();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canSlide]);

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
    
    onSubmit({
      caption,
      files,
      selectedCourse: course,
      visibility,
      isPrivate: visibility === "private",
      backgroundMusic: null, // Default for now
      coverIndex // NEW: thumbnail source for feeds
    });
  };

  const handleSuccessComplete = () => {
    setShowSuccessOverlay(false);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      onClose();
    }, 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="ecm-root fixed inset-0 z-[1000]" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.18, 
            ease: "easeIn"
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: '100dvh',
            width: '100%',
            overflow: 'hidden',
            overscrollBehavior: 'none',
            WebkitOverflowScrolling: 'auto',
            touchAction: 'none'
          }}
        >
          {/* backdrop - Hub Glass effect */}
          <div 
            className="absolute inset-0 touch-none" 
            onClick={close}
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(120px)',
              WebkitBackdropFilter: 'blur(120px)',
              touchAction: 'none' 
            }}
          />

          {/* modal shell - full screen on mobile, centered on desktop */}
          <div className="absolute inset-0 flex items-center justify-center touch-none" onClick={close} style={{ touchAction: 'none' }}>
            <motion.div
              ref={wrapperRef}
              role="dialog"
              aria-modal="true"
              aria-label="Create a Moment"
              className="relative w-full max-w-md h-[100dvh] md:h-[90vh] md:rounded-3xl overflow-hidden"
              initial={prefersReducedMotion ? { opacity: 0 } : { y: 30, opacity: 0, scale: 0.95 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { y: 12, opacity: 0, scale: 0.98 }}
              transition={prefersReducedMotion ? 
                { duration: 0.18 } : 
                { 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25,
                  duration: 0.18
                }
              }
              onClick={(e) => e.stopPropagation()}
            >
              {/* Liquid glass background */}
              <LiquidGlassBackdrop isVisible={true} />
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
                      items={media.map((item, index) => ({
                        id: item.id,
                        type: item.type,
                        previewUrl: item.previewUrl,
                        url: item.url,
                        file: item.file,
                        alt: `Media item ${item.id}`
                      }))}
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
                    className="absolute left-4 z-20"
                    style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
                  >
                    <div className="rounded-full bg-white/55 backdrop-blur-[10px] border border-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-[rgba(25,25,28,0.85)] text-xs px-3 py-1.5 flex items-center gap-1">
                      <span className="font-medium">{activeIndex + 1}/{media.length}</span>
                    </div>
                  </div>
                )}


                {/* Close button - top right, 8px from top */}
                <button 
                  onClick={close}
                  className="absolute right-4 z-20 w-8 h-8 rounded-full bg-white/55 backdrop-blur-[10px] border border-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-[rgba(25,25,28,0.85)] hover:bg-white/65 transition-all flex items-center justify-center"
                  style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Video duration - bottom left, 8px from media bottom, frosted white */}
                {media[activeIndex]?.type === 'video' && (
                  <div className="absolute bottom-[8px] left-4 z-20">
                    <div className="rounded-full bg-white/55 backdrop-blur-[10px] border border-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-[rgba(25,25,28,0.85)] text-xs px-3 py-1.5 flex items-center gap-1.5">
                      <Play className="w-2.5 h-2.5" />
                      <span className="font-medium">00:09</span>
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
                  {/* Tab chips */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveCard('caption')}
                      className={`flex-1 px-3 py-2 rounded-xl text-base font-medium transition-all duration-200 ${
                        activeCard === 'caption'
                          ? 'bg-white border border-[rgba(255,156,64,0.35)] shadow-[0_1px_6px_rgba(0,0,0,0.06)] text-zinc-900'
                          : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:shadow-sm'
                      }`}
                    >
                      Caption
                    </button>
                    <button
                      onClick={() => setActiveCard('course')}
                      className={`flex-1 px-3 py-2 rounded-xl text-base font-medium transition-all duration-200 ${
                        activeCard === 'course'
                          ? 'bg-white border border-[rgba(255,156,64,0.35)] shadow-[0_1px_6px_rgba(0,0,0,0.06)] text-zinc-900'
                          : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:shadow-sm'
                      }`}
                    >
                      Tag a course
                    </button>
                    <button
                      onClick={openStudio}
                      disabled={media.length === 0}
                      className={`flex-1 px-3 py-2 rounded-xl text-base font-medium transition-all duration-200 ${
                        media.length === 0
                          ? 'border border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:shadow-sm'
                      }`}
                      title={media.length === 0 ? 'Add media to open Studio' : 'Open Studio to edit your media'}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>Studio</span>
                      </div>
                    </button>
                  </div>

                  {/* Sliding cards container */}
                  <div className="relative flex-1 overflow-hidden">
                    {/* CAPTION CARD */}
                    <motion.div
                      className="absolute inset-0 w-full flex flex-col"
                      initial={{ x: 0 }}
                      animate={{ 
                        x: activeCard === 'caption' ? 0 : '-100%',
                        opacity: activeCard === 'caption' ? 1 : 0
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 30
                      }}
                    >
                      <label className="block text-base font-semibold text-white mb-3">Add a caption</label>
                      
                      <textarea
                        className="caption-input flex-1 w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-[15px] leading-snug resize-none placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-[rgba(255,156,64,0.5)] focus:shadow-[0_0_0_1px_rgba(255,156,64,0.35)] transition-all duration-200"
                        placeholder="Write a caption…"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        style={{
                          overscrollBehavior: 'contain'
                        }}
                      />
                    </motion.div>

                    {/* COURSE CARD */}
                    <motion.div
                      className="absolute inset-0 w-full"
                      initial={{ x: '100%' }}
                      animate={{ 
                        x: activeCard === 'course' ? 0 : '100%',
                        opacity: activeCard === 'course' ? 1 : 0
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 30
                      }}
                    >
                      <CourseTagInput
                        onCourseSelect={onCourseSelect}
                        selectedCourse={course}
                      />
                    </motion.div>
                  </div>

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
            </motion.div>
          </div>

          {/* Success overlay */}
          <PostSuccessOverlay 
            isVisible={showSuccessOverlay} 
            onComplete={handleSuccessComplete}
          />
        </motion.div>
      )}

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
    </AnimatePresence>
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
