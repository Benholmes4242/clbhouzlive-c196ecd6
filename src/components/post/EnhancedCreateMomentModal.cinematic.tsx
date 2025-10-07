import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, useEffect, useRef, useLayoutEffect } from "react";
import { X, ChevronLeft, ChevronRight, Globe, Lock, Sparkles, BarChart3, Play, Camera, Image as ImageIcon } from "lucide-react";
import type { ComposerMediaItem } from "@/hooks/useSnapModal";
import { useOptimisticPostSubmission } from "@/hooks/useOptimisticPostSubmission";
import { supabase } from "@/integrations/supabase/client";
import PostSuccessOverlay from './PostSuccessOverlay';
import { useModalContext } from '@/contexts/ModalContext';
import { useImmersiveHeader } from '@/hooks/useImmersiveHeader';
import CourseTagInput from "@/components/posts/CourseTagInput";
import BackgroundMusicSelector from "@/components/posts/BackgroundMusicSelector";
import MediaCarousel from "@/components/posts/MediaCarousel";
import { MediaNavigationDots } from "@/components/posts/user-post/overlays/MediaNavigationDots";

const CAPTION_OVERLAP_PX = 16; // small, neat overlap

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
  onAddFiles?: (files: File[]) => void;
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
  onAddFiles
}: Props) {
  const { setCreateMomentModalOpen } = useModalContext();
  const [aiLoading, setAiLoading] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [activeCard, setActiveCard] = useState<'caption' | 'course' | 'music'>('caption');
  const prefersReducedMotion = useReducedMotion();

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

  // Local caption state
  const [caption, setCaption] = useState<string>('');


  // Use the media items or files and course from props
  const files = mediaItems?.length > 0 ? mediaItems.map(item => item.file) : initialFiles;
  const course = selectedCourse;

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

  // Media picker handlers
  const handleCameraClick = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.capture = 'environment';
      input.multiple = true;
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        if (files.length > 0) {
          await onAddFiles?.(files);
        }
      };
      input.click();
    } catch (error) {
      console.error('Camera capture error:', error);
    }
  };

  const handlePhotosVideosClick = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.multiple = true;
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        if (files.length > 0) {
          await onAddFiles?.(files);
        }
      };
      input.click();
    } catch (error) {
      console.error('File picker error:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.18, 
            ease: "easeIn"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* backdrop - subtle dark */}
          <div 
            className="absolute inset-0 bg-black/35 backdrop-blur-[8px]" 
            onClick={close}
          />

          {/* modal shell - full screen on mobile, centered on desktop */}
          <div className="absolute inset-0 flex items-center justify-center" onClick={close}>
            <motion.div
              ref={wrapperRef}
              role="dialog"
              aria-modal="true"
              aria-label="Create a Moment"
              className="relative w-full max-w-md h-[100svh] md:h-[90vh] md:rounded-3xl overflow-hidden bg-black"
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
              {/* MEDIA STAGE - full-bleed, top-anchored */}
              <section 
                id="media" 
                className="absolute inset-x-0 top-0 overflow-hidden"
                style={{ height: 'calc(100svh - var(--composer-height))' }}
              >
                {/* Top scrim for badge readability */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/28 to-transparent z-10" 
                  style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
                />

                {/* Bottom scrim for controls */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/18 to-transparent z-10" />

                {media.length > 0 ? (
                  // MEDIA VIEWER STATE
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
                    
                    {/* Clubhouse-style carousel dots */}
                    {media.length > 1 && (
                      <div className="absolute left-1/2 -translate-x-1/2 z-30" style={{ bottom: '12px' }}>
                        <MediaNavigationDots
                          mediaCount={media.length}
                          currentIndex={activeIndex}
                          onJump={setActiveIndex}
                        />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  // EMPTY STATE
                  <div className="h-full w-full flex items-center justify-center bg-zinc-900">
                    <div className="text-center px-6">
                      <Camera className="w-16 h-16 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60 text-sm">Add photos or capture a moment</p>
                    </div>
                  </div>
                )}

                {/* Close button - top right */}
                <button 
                  onClick={close}
                  className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 text-black backdrop-blur-sm hover:bg-white transition-all flex items-center justify-center"
                  style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Media counter - top left (only when media exists) */}
                {media.length > 0 && (
                  <>
                    <div 
                      className="absolute top-4 left-4 z-20"
                      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
                    >
                      <div className="rounded-full bg-white/90 text-black text-xs px-3 py-1.5 flex items-center gap-1 backdrop-blur-sm">
                        <span className="font-medium">{activeIndex + 1}/{media.length}</span>
                      </div>
                    </div>

                    {/* Cover badge - near counter */}
                    {coverIndex === activeIndex && (
                      <div 
                        className="absolute top-4 left-20 z-20"
                        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
                      >
                        <div className="rounded-full bg-white/90 text-black text-xs px-3 py-1.5 backdrop-blur-sm font-medium">
                          Cover
                        </div>
                      </div>
                    )}

                    {/* Video duration - bottom left if video */}
                    {media[activeIndex]?.type === 'video' && (
                      <div className="absolute bottom-6 left-4 z-20">
                        <div className="rounded-full bg-white/90 text-black text-xs px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-sm">
                          <Play className="w-3 h-3" />
                          <span className="font-medium">00:09</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </section>

              {/* COMPOSER PANEL - fixed height, bottom-anchored */}
              <section 
                className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-white/75 supports-[backdrop-filter]:bg-white/60 border-t border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-t-none"
                style={{ height: 'var(--composer-height)' }}
              >
                <div 
                  className="flex h-full flex-col px-4 pt-4 gap-4"
                  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
                >
                  {/* Media CTAs row (in editor header) - shown when empty OR when media exists */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCameraClick}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:shadow-sm"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Camera</span>
                    </button>
                    <button
                      onClick={handlePhotosVideosClick}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:shadow-sm"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span>Photos & Videos</span>
                    </button>
                  </div>

                  {/* Tab chips - only show when media exists */}
                  {media.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveCard('caption')}
                        className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          activeCard === 'caption'
                            ? 'bg-white border border-[rgba(255,156,64,0.35)] shadow-[0_1px_6px_rgba(0,0,0,0.06)] text-zinc-900'
                            : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:shadow-sm'
                        }`}
                      >
                        Caption
                      </button>
                      <button
                        onClick={() => setActiveCard('course')}
                        className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          activeCard === 'course'
                            ? 'bg-white border border-[rgba(255,156,64,0.35)] shadow-[0_1px_6px_rgba(0,0,0,0.06)] text-zinc-900'
                            : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:shadow-sm'
                        }`}
                      >
                        Tag a course
                      </button>
                      <button
                        onClick={() => setActiveCard('music')}
                        className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          activeCard === 'music'
                            ? 'bg-white border border-[rgba(255,156,64,0.35)] shadow-[0_1px_6px_rgba(0,0,0,0.06)] text-zinc-900'
                            : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:shadow-sm'
                        }`}
                      >
                        Add music
                      </button>
                    </div>
                  )}

                  {/* Sliding cards container - only show when media exists */}
                  {media.length > 0 && (
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
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-base font-semibold text-zinc-900">Add a caption</label>
                          <button
                            onClick={handleAICaption}
                            disabled={aiLoading || media.length === 0}
                            className="border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-xl shrink-0 transition-all duration-200 text-sm disabled:opacity-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6e9277]/30"
                            aria-label="Write a caption for me"
                          >
                            {aiLoading ? <StarsLoading /> : (
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span className="font-medium">Inspire Me</span>
                              </div>
                            )}
                          </button>
                        </div>
                        
                        <textarea
                          className="flex-1 w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-[15px] leading-snug resize-none placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-[rgba(255,156,64,0.5)] focus:shadow-[0_0_0_1px_rgba(255,156,64,0.35)] transition-all duration-200"
                          placeholder="Write a caption…"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
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

                      {/* MUSIC CARD */}
                      <motion.div
                        className="absolute inset-0 w-full"
                        initial={{ x: '100%' }}
                        animate={{ 
                          x: activeCard === 'music' ? 0 : '100%',
                          opacity: activeCard === 'music' ? 1 : 0
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 30
                        }}
                      >
                        <BackgroundMusicSelector 
                          onMusicSelect={(music) => {
                            console.log('Selected music:', music);
                          }}
                          hasVideo={media.some(item => item.type === 'video')}
                        />
                      </motion.div>
                    </div>
                  )}

                  {/* Primary Share button - only when media exists */}
                  {media.length > 0 && (
                    <button
                      disabled={!canPost}
                      onClick={handlePost}
                      className="w-full h-12 rounded-2xl bg-white border border-[rgba(255,156,64,0.35)] shadow-sm text-zinc-900 font-semibold transition-all duration-200 hover:bg-zinc-50 hover:border-[rgba(255,156,64,0.5)] active:scale-[.99] disabled:bg-zinc-200 disabled:text-zinc-500 disabled:border-zinc-300 focus:outline-none focus:border-[rgba(255,156,64,0.5)] focus:shadow-[0_0_0_1px_rgba(255,156,64,0.35)]"
                      aria-label="Post your moment"
                    >
                      {isSubmitting ? "Sharing..." : "Share"}
                    </button>
                  )}
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
    </AnimatePresence>
  );
}
