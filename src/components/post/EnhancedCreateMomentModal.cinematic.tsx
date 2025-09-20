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
                    <div
                      className="
                        rounded-3xl
                        liquid-glass
                        shadow-[0_12px_32px_rgba(0,0,0,0.4)]
                        px-5 py-4
                      "
                    >
                      <div className="flex items-start justify-between mb-1">
                        <label className="block text-[15px] text-white">Add a caption</label>
                        <button
                          onClick={handleAICaption}
                          disabled={aiLoading || media.length === 0}
                          className="liquid-glass-button hover:scale-105 hover:ring-brand-orange/30 hover:ring-2 px-4 py-2 rounded-full shrink-0 transition-all duration-300 text-sm disabled:opacity-50 text-white active:scale-95"
                          aria-label="Write a caption for me"
                        >
                          {aiLoading ? <StarsLoading /> : (
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span className="font-medium">AI Caption</span>
                            </div>
                          )}
                        </button>
                      </div>
                      <div className="flex items-start gap-2">
                        <textarea
                          className="w-full bg-transparent outline-none resize-none placeholder-white/50 text-white min-h-[2.5rem]"
                          placeholder="Write a caption…"
                          value={caption}
                          onChange={(e) => {
                            setCaption(e.target.value);
                            // Auto-expand textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.max(40, e.target.scrollHeight) + 'px';
                          }}
                          style={{ height: 'auto' }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Content Pills Row */}
                  <div className="mx-5 pt-4">
                    <div className="flex flex-wrap gap-3">
                      {/* Golf Course Pill */}
                      <motion.div 
                        className={`pill-container ${course ? 'pill-active' : 'pill-inactive'} relative z-[9999]`}
                        initial={prefersReducedMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                        transition={prefersReducedMotion ? { delay: 0 } : { delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {course ? course.name : 'Add golf course'}
                          </span>
                        </div>
                        <div className="absolute inset-0 opacity-0">
                          <CourseTagInput
                            selectedCourse={course}
                            onCourseSelect={onCourseSelect || setSelectedCourse}
                            placeholder="Start typing to find a course..."
                          />
                        </div>
                      </motion.div>

                      {/* Music Pill */}
                      <motion.button
                        onClick={() => {
                          console.log("Music selector clicked");
                        }}
                        className="pill-container pill-inactive group"
                        initial={prefersReducedMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                        transition={prefersReducedMotion ? { delay: 0 } : { delay: 0.14, type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-brand-orange group-hover:text-white transition-colors" />
                          <span className="text-sm font-medium">Add music</span>
                        </div>
                      </motion.button>

                      {/* Visibility Pill */}
                      <motion.button
                        onClick={() => setVisibility(visibility === "public" ? "private" : "public")}
                        className={`pill-container ${visibility === "private" ? 'pill-active' : 'pill-inactive'}`}
                        initial={prefersReducedMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                        transition={prefersReducedMotion ? { delay: 0 } : { delay: 0.18, type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <div className="flex items-center gap-2">
                          {visibility === "public" ? (
                            <Globe className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">
                            {visibility === "public" ? "Public" : "Private"}
                          </span>
                        </div>
                      </motion.button>
                    </div>
                  </div>

                  {/* FOOTER - Accent Pill Post Button */}
                  <div className="sticky bottom-0 left-0 right-0 z-10 pt-6 pb-[calc(env(safe-area-inset-bottom)+20px)] px-5 bg-gradient-to-t from-black/60 via-black/40 to-transparent backdrop-blur-sm">
                    <motion.button
                      onClick={handlePost}
                      disabled={!canPost}
                      aria-pressed={isSubmitting}
                      aria-busy={isSubmitting}
                      className={`relative w-full h-14 rounded-full text-center overflow-hidden disabled:opacity-50 transition-all duration-300 shadow-lg font-bold text-lg border-2 ${
                        canPost 
                          ? 'liquid-glass border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white hover:scale-105 hover:shadow-[0_8px_32px_rgba(247,147,30,0.4)]' 
                          : 'liquid-glass border-white/20 text-white/50'
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
                          className="absolute inset-0 rounded-full"
                          initial={{ backgroundPositionX: "0%" }}
                          animate={{ backgroundPositionX: "200%" }}
                          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                          style={{ 
                            backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.3) 50%, transparent 100%)",
                            backgroundSize: "50% 100%"
                          }}
                        />
                      )}
                      <span className="relative z-10">
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