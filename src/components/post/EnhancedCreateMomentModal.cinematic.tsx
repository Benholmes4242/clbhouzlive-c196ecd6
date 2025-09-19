import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect, useRef, useLayoutEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useSnapModal, ComposerMediaItem } from "@/hooks/useSnapModal";
import { useOptimisticPostSubmission } from "@/hooks/useOptimisticPostSubmission";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useModalContext } from '@/contexts/ModalContext';
import CourseTagInput from "@/components/posts/CourseTagInput";
import BackgroundMusicSelector from "@/components/posts/BackgroundMusicSelector";
import MediaCarousel from "@/components/posts/MediaCarousel";
import CarouselDots from "@/components/posts/CarouselDots";

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

  const panel = isDark ? "bg-black/60" : "bg-white/70";
  const card = isDark ? "bg-neutral-900/70 text-white" : "bg-white/85 text-neutral-900";
  const subtl = isDark ? "text-white/70" : "text-neutral-600";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* backdrop with click-to-close */}
          <div 
            className={`absolute inset-0 ${panel} backdrop-blur-xl`} 
            onClick={close}
            role="dialog"
            aria-modal="true"
          />

          {/* shell */}
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={close}>
            <motion.div
              ref={wrapperRef}
              className="w-full max-w-[520px] h-[min(92vh,900px)] rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full flex-col">
                {/* MEDIA SECTION */}
                <section id="media" className="relative flex-1 overflow-hidden">
                  {/* Close button - top right */}
                  <button
                    onClick={close}
                    className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>

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
                    className="h-full w-full"
                  />

                  {/* White indicator dots overlay */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <CarouselDots count={media.length} activeIndex={activeIndex} />
                  </div>
                </section>

                {/* CONTROLS SECTION */}
                <section 
                  id="controls" 
                  className="relative shrink-0 overflow-y-auto overscroll-contain [--footer-safe:env(safe-area-inset-bottom)]"
                >
                  {/* CAPTION CARD */}
                  <div
                    ref={captionRef}
                    className="relative z-10 mx-4 mt-4"
                  >
                    <div
                      className="
                        rounded-2xl
                        bg-black/55 backdrop-blur
                        shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                        ring-1 ring-white/10
                        px-4 py-3
                      "
                    >
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[15px] text-white">Add a caption</label>
                        <button
                          onClick={handleAICaption}
                          disabled={aiLoading || media.length === 0}
                          className="hover:bg-white/10 px-2 py-1 rounded-lg shrink-0 transition-colors text-sm disabled:opacity-50 text-white"
                          aria-label="Write a caption for me"
                        >
                          {aiLoading ? <StarsLoading /> : <><span className="text-lg">✨</span> Write a caption for me</>}
                        </button>
                      </div>
                      <div className="flex items-start gap-2">
                        <textarea
                          className="w-full bg-transparent outline-none resize-none placeholder-white/50 text-white"
                          rows={2}
                          placeholder="Write a caption…"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Floating cards below with 12px rhythm */}
                  <div className="space-y-3 px-4 pt-3">
                    {/* Course with High Z-Index */}
                    <div className={`rounded-2xl px-4 py-3 ${card} backdrop-blur-md ring-1 ring-white/10 relative z-[9999]`}>
                      <div className="text-[15px] mb-1">Tag a golf course</div>
                      <CourseTagInput
                        selectedCourse={course}
                        onCourseSelect={onCourseSelect || setSelectedCourse}
                        placeholder="Start typing to find a course..."
                      />
                    </div>

                    {/* Music */}
                    <div className={`rounded-2xl px-4 py-3 ${card} backdrop-blur-md ring-1 ring-white/10`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-[15px] mb-1">Background music</div>
                          <div className={`${subtl} text-sm`}>
                            Popular golf tracks today
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // TODO: Background music selector
                            console.log("Music selector clicked");
                          }}
                          className={`${isDark ? "hover:bg-white/10" : "hover:bg-black/5"} px-3 py-2 rounded-lg transition-colors`}
                          aria-label="Select music"
                        >
                          <span className="text-orange-500 text-xl">🎵</span>
                        </button>
                      </div>
                    </div>

                    {/* Visibility segmented - Wired to state */}
                    <div className={`rounded-2xl px-2 py-2 ${card} backdrop-blur-md ring-1 ring-white/10`}>
                      <Segmented
                        value={visibility}
                        onChange={(value) => setVisibility(value as "public" | "private")}
                        options={[
                          { value: "public", label: "Public" },
                          { value: "private", label: "Private Archive" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* FOOTER - Pinned to bottom */}
                  <div className="sticky bottom-0 left-0 right-0 z-10 pt-3 pb-[calc(var(--footer-safe)+12px)] px-4 bg-gradient-to-t from-black/30 to-transparent backdrop-blur-[2px]">
                    <button
                      onClick={handlePost}
                      disabled={!canPost}
                      className="relative w-full h-12 rounded-2xl text-white overflow-hidden disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                      style={{ 
                        background: 'linear-gradient(135deg, var(--echo-from), var(--echo-to))'
                      }}
                    >
                      {/* Shimmer animation while submitting */}
                      {isSubmitting && (
                        <motion.div
                          className="absolute inset-0"
                          initial={{ backgroundPositionX: "0%" }}
                          animate={{ backgroundPositionX: "200%" }}
                          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                          style={{ 
                            backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.18) 50%, transparent 100%)",
                            backgroundSize: "50% 100%"
                          }}
                        />
                      )}
                      <span className="relative z-10 font-medium">
                        {isSubmitting ? "Posting…" : "Post"}
                      </span>
                    </button>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
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
  options: { value: string; label: string }[] 
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl p-1 bg-white/10">
      {options.map(option => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`h-10 rounded-lg transition-all duration-200 font-medium
              ${active 
                ? "bg-white/90 text-neutral-900 shadow-sm" 
                : "text-white/80 hover:bg-white/10"
              }`}
          >
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