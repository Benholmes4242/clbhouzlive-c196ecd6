import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect, useRef, useLayoutEffect } from "react";
import { X, ChevronLeft, ChevronRight, Globe, Lock, Sparkles, BarChart3, Play } from "lucide-react";
import { useSnapModal, ComposerMediaItem } from "@/hooks/useSnapModal";
import { useOptimisticPostSubmission } from "@/hooks/useOptimisticPostSubmission";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useModalContext } from '@/contexts/ModalContext';
import CourseTagInput from "@/components/posts/CourseTagInput";
import BackgroundMusicSelector from "@/components/posts/BackgroundMusicSelector";
import MediaCarousel from "@/components/posts/MediaCarousel";
import CarouselDots from "@/components/posts/CarouselDots";
import { SuccessOverlay } from "@/components/ui/SuccessOverlay";

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
  onCourseSelect
}: Props) {
  const isDark = theme === "dark";
  const { toast } = useToast();
  const { setCreateMomentModalOpen } = useModalContext();
  const [aiLoading, setAiLoading] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Update modal context when create moment modal opens/closes
  useEffect(() => {
    setCreateMomentModalOpen(isOpen);
  }, [isOpen, setCreateMomentModalOpen]);

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
    setSelectedCourse
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
      toast({
        title: "Caption Generation Failed",
        description: "Please try writing a caption manually.",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handlePost = async () => {
    if (!canPost) return;
    
    try {
      await onSubmit({
        caption,
        files,
        selectedCourse: course,
        visibility,
        isPrivate: visibility === "private",
        backgroundMusic: null, // Default for now
        coverIndex // NEW: thumbnail source for feeds
      });
      
      // Show success overlay first
      setShowSuccessOverlay(true);
      
      // Wait for success overlay animation, then begin transition
      setTimeout(() => {
        // Close the modal with cinematic exit animation
        close();
      }, 900); // Show success for ~900ms, then transition
      
    } catch (error) {
      console.error('Post submission failed:', error);
    }
  };

  const panel = isDark ? "bg-black/60" : "bg-white/70";
  const card = isDark ? "bg-neutral-900/70 text-white" : "bg-white/85 text-neutral-900";
  const subtl = isDark ? "text-white/70" : "text-neutral-600";

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* backdrop with gradient and click-to-close - Consistent with Clubhouse/Discover */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
            onClick={close}
            role="dialog"
            aria-modal="true"
          />

          {/* shell */}
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={close}>
          <motion.div
            ref={wrapperRef}
            className="w-full max-w-[520px] h-[min(92vh,900px)] liquid-glass rounded-3xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
            initial={prefersReducedMotion ? { opacity: 0 } : { y: window.innerHeight, opacity: 0, scale: 0.9 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: 20, opacity: 0, scale: 0.95 }}
            transition={prefersReducedMotion ? 
              { duration: 0.1 } : 
              { type: "spring", stiffness: 300, damping: 28, duration: 0.2 }
            }
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full flex-col">
                {/* MEDIA SECTION */}
                <section id="media" className="relative flex-1 overflow-hidden">

                  <MediaCarousel
                    items={media.map(item => ({
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
                    className="h-full w-full rounded-b-xl"
                  />

                  {/* Media metadata pills - bottom left */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="rounded-full bg-black/50 text-white text-xs px-2 py-0.5 flex items-center gap-1 backdrop-blur-sm">
                      <span>{activeIndex + 1}/{media.length}</span>
                    </div>
                    {media[activeIndex]?.type === 'video' && (
                      <div className="rounded-full bg-black/50 text-white text-xs px-2 py-0.5 flex items-center gap-1 backdrop-blur-sm">
                        <span>00:09</span>
                      </div>
                    )}
                  </div>

                  {/* Navigation arrows */}
                  {canSlide && (
                    <>
                      <button
                        onClick={prevMedia}
                        disabled={activeIndex === 0}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 
                                 h-12 w-12 rounded-full liquid-glass-button
                                 flex items-center justify-center hover:scale-110 hover:ring-brand-orange/30 hover:ring-2
                                 active:scale-95 transition-all duration-300
                                 ${activeIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label="Previous media"
                      >
                        <ChevronLeft className="h-5 w-5 text-white" />
                      </button>

                      <button
                        onClick={nextMedia}
                        disabled={activeIndex === media.length - 1}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 
                                 h-12 w-12 rounded-full liquid-glass-button
                                 flex items-center justify-center hover:scale-110 hover:ring-brand-orange/30 hover:ring-2
                                 active:scale-95 transition-all duration-300
                                 ${activeIndex === media.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label="Next media"
                      >
                        <ChevronRight className="h-5 w-5 text-white" />
                      </button>
                    </>
                  )}
                </section>

                {/* CONTROLS SECTION */}
                <section 
                  id="controls" 
                  className="relative shrink-0 overflow-y-auto overscroll-contain [--footer-safe:env(safe-area-inset-bottom)]"
                >
                  {/* CAPTION CARD */}
                  <motion.div
                    ref={captionRef}
                    className="relative z-10 mx-4 mt-4"
                    initial={prefersReducedMotion ? { opacity: 0 } : { y: 30, opacity: 0 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                    transition={prefersReducedMotion ? { delay: 0 } : { delay: 0.06, type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white text-lg font-medium">Add a caption</h3>
                        <button
                          onClick={handleAICaption}
                          disabled={aiLoading || media.length === 0}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none border border-white/20"
                          aria-label="Write a caption for me"
                        >
                          {aiLoading ? <StarsLoading /> : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              <span>AI Caption</span>
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:border-orange-400/50 min-h-[80px]"
                        placeholder="Write a caption..."
                        value={caption}
                        onChange={(e) => {
                          setCaption(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.max(80, e.target.scrollHeight) + 'px';
                        }}
                        rows={3}
                      />
                    </div>
                  </motion.div>

                  {/* TAG GOLF COURSE CARD */}
                  <motion.div
                    className="relative z-10 mx-4 mt-4"
                    initial={prefersReducedMotion ? { opacity: 0 } : { y: 30, opacity: 0 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                    transition={prefersReducedMotion ? { delay: 0 } : { delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                      <h3 className="text-white text-lg font-medium mb-3">Tag a golf course</h3>
                      <div className="relative">
                        <CourseTagInput
                          selectedCourse={course}
                          onCourseSelect={onCourseSelect || setSelectedCourse}
                          placeholder="Start typing to find a course..."
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* BACKGROUND MUSIC CARD */}
                  <motion.div
                    className="relative z-10 mx-4 mt-4"
                    initial={prefersReducedMotion ? { opacity: 0 } : { y: 30, opacity: 0 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                    transition={prefersReducedMotion ? { delay: 0 } : { delay: 0.14, type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                      <h3 className="text-white text-lg font-medium mb-3">Background music</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Popular golf tracks today</span>
                        <div className="flex items-center gap-3">
                          <button className="text-orange-400 hover:text-orange-300 transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                          <button className="text-orange-400 hover:text-orange-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* PRIVACY TOGGLE CARD */}
                  <motion.div
                    className="relative z-10 mx-4 mt-4"
                    initial={prefersReducedMotion ? { opacity: 0 } : { y: 30, opacity: 0 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                    transition={prefersReducedMotion ? { delay: 0 } : { delay: 0.18, type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="flex bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setVisibility("public")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none flex items-center justify-center gap-2 ${
                          visibility === "public"
                            ? "bg-white/20 text-white"
                            : "text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        Public
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibility("private")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none flex items-center justify-center gap-2 ${
                          visibility === "private"
                            ? "bg-white/20 text-white"
                            : "text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Lock className="w-4 h-4" />
                        Private Archive
                      </button>
                    </div>
                  </motion.div>

                  {/* POST BUTTON */}
                  <div className="sticky bottom-0 left-0 right-0 z-10 pt-6 pb-[calc(env(safe-area-inset-bottom)+20px)] px-4">
                    <motion.button
                      onClick={handlePost}
                      disabled={!canPost}
                      aria-pressed={isSubmitting}
                      aria-busy={isSubmitting}
                      className={`w-full px-6 py-4 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 hover:from-blue-600 hover:via-teal-600 hover:to-green-600 disabled:from-gray-500 disabled:via-gray-600 disabled:to-gray-700 disabled:text-gray-300 text-white rounded-xl font-semibold text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-transparent ${
                        isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                      initial={prefersReducedMotion ? { opacity: 0 } : { y: 40, opacity: 0 }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                      transition={prefersReducedMotion ? { delay: 0 } : { delay: 0.22, type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={!prefersReducedMotion && canPost ? { scale: 1.02 } : {}}
                      whileTap={!prefersReducedMotion && canPost ? { scale: 0.98 } : {}}
                    >
                      {/* Shimmer animation while submitting */}
                      {isSubmitting && (
                        <motion.div
                          className="absolute inset-0 rounded-xl"
                          initial={{ backgroundPositionX: "0%" }}
                          animate={{ backgroundPositionX: "200%" }}
                          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                          style={{ 
                            backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.3) 50%, transparent 100%)",
                            backgroundSize: "50% 100%"
                          }}
                        />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isSubmitting ? "Posting…" : "Post"}
                      </span>
                    </motion.button>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>

          {/* Success Overlay */}
          <SuccessOverlay 
            isVisible={showSuccessOverlay} 
            onClose={() => {
              setShowSuccessOverlay(false);
              close();
            }}
            message="Moment posted successfully!"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}


function Segmented({
  value, 
  onChange, 
  options,
}: { 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string; icon: any }[] 
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl p-2 liquid-glass">
      {options.map(option => {
        const active = value === option.value;
        const IconComponent = option.icon;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`h-12 rounded-xl transition-all duration-300 font-medium flex items-center justify-center gap-2
              ${active 
                ? "bg-brand-orange text-white shadow-lg font-bold hover:bg-brand-orange-hover" 
                : "text-white/80 hover:bg-white/10 hover:scale-105"
              }`}
            aria-pressed={active}
          >
            <IconComponent className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* Enhanced Media Carousel Component */
function EnhancedMediaCarousel({ 
  media, 
  activeIndex, 
  onIndexChange,
  onClose,
  onTouchStart,
  onTouchEnd,
  theme,
  className 
}: { 
  media: ComposerMediaItem[] | any[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  theme?: "dark" | "light";
  className?: string;
}) {
  const fallback = theme === "dark" ? "bg-black/40" : "bg-black/10";
  const canSlide = media.length > 1;
  
  if (!media?.length) {
    return <div className={`${className || 'h-[46vh] md:h-[48vh]'} ${fallback} flex items-center justify-center rounded-2xl`}>
      <span className="text-white/50 text-sm">No media selected</span>
    </div>;
  }

  const currentMedia = media[activeIndex];
  const previewUrl = 'previewUrl' in currentMedia ? currentMedia.previewUrl : URL.createObjectURL(currentMedia);
  const isVideo = 'type' in currentMedia ? currentMedia.type === 'video' : currentMedia.type.startsWith('video/');

  const handlePrevious = () => {
    onIndexChange(activeIndex > 0 ? activeIndex - 1 : media.length - 1);
  };

  const handleNext = () => {
    onIndexChange(activeIndex < media.length - 1 ? activeIndex + 1 : 0);
  };

  return (
    <div 
      className={`relative w-full overflow-hidden rounded-2xl bg-black ${className || 'h-[46vh] md:h-[48vh]'}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Current Media */}
      {isVideo ? (
        <video 
          key={`v-${activeIndex}`}
          src={previewUrl} 
          className="h-full w-full object-cover" 
          muted 
          playsInline
          controls
        />
      ) : (
        <img 
          key={`i-${activeIndex}`}
          src={previewUrl} 
          alt="" 
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}

      {/* Navigation Arrows (only if >1 media) */}
      {canSlide && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={handlePrevious}
            className="
              absolute left-3 top-1/2 -translate-y-1/2
              h-10 w-10 rounded-full
              bg-white/12 backdrop-blur-md border border-white/15
              shadow-[0_8px_24px_rgba(0,0,0,0.35)]
              flex items-center justify-center hover:bg-white/18 active:scale-[0.98] transition
            "
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <button
            type="button"
            aria-label="Next"
            onClick={handleNext}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              h-10 w-10 rounded-full
              bg-white/12 backdrop-blur-md border border-white/15
              shadow-[0_8px_24px_rgba(0,0,0,0.35)]
              flex items-center justify-center hover:bg-white/18 active:scale-[0.98] transition
            "
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </>
      )}

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="
          absolute top-3 right-3
          h-6 w-6 rounded-full
          bg-white/12 backdrop-blur-md
          border border-white/15
          shadow-[0_8px_24px_rgba(0,0,0,0.35)]
          flex items-center justify-center
          hover:bg-white/18 active:scale-[0.98] transition
        "
      >
        <X className="h-3 w-3 text-white" />
      </button>
      
      {/* Gradients for overlay effect */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </div>
  );
}