import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useSnapModal } from "@/hooks/useSnapModal";
import { useOptimisticPostSubmission } from "@/hooks/useOptimisticPostSubmission";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CourseTagInput from "@/components/posts/CourseTagInput";
import BackgroundMusicSelector from "@/components/posts/BackgroundMusicSelector";

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
  selectedCourse,
  onCourseSelect
}: Props) {
  const isDark = theme === "dark";
  const { toast } = useToast();
  const [aiLoading, setAiLoading] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  // Media carousel state
  const media = useMemo(() => (initialFiles || []).slice(0, 5), [initialFiles]);
  const [mediaIndex, setMediaIndex] = useState(0);
  const canSlide = media.length > 1;
  
  // Touch handlers for swipe
  const startX = useRef<number | null>(null);

  const {
    caption,
    setCaption,
    selectedCourse: snapCourse,
    setSelectedCourse
  } = useSnapModal();

  // Use the files and course from props
  const files = initialFiles;
  const course = selectedCourse || snapCourse;

  const canPost = useMemo(() => files?.length > 0 && !isSubmitting, [files, isSubmitting]);

  // Close handler
  const close = () => onClose?.();

  // Carousel navigation
  const prevMedia = () => setMediaIndex((i) => (i - 1 + media.length) % media.length);
  const nextMedia = () => setMediaIndex((i) => (i + 1) % media.length);

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
      const first = files?.[0];
      if (!first) return;

      const body = {
        type: first.type.startsWith('video') ? "video" : "image",
        previewUrl: URL.createObjectURL(first),
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
      backgroundMusic: null // Default for now
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
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              className="w-full max-w-[520px] rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media + Overlapping Caption */}
              <div className="relative">
                <MediaCarousel 
                  media={media} 
                  currentIndex={mediaIndex}
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                  onPrevious={prevMedia}
                  onNext={nextMedia}
                  onClose={close}
                  canSlide={canSlide}
                  theme={theme} 
                />
                
                {/* Caption card overlaps image bottom */}
                <div
                  className="
                    absolute left-4 right-4 -bottom-4
                    z-20
                    rounded-2xl
                    bg-black/55 backdrop-blur
                    shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                    border border-white/10
                    px-4 py-3
                  "
                >
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[15px] text-white/70">Add a caption</label>
                    <button
                      onClick={handleAICaption}
                      disabled={aiLoading || files.length === 0}
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

              {/* Spacer to prevent collision with overlapped caption */}
              <div className="h-7" />

              {/* Floating cards below with 12px rhythm */}
              <div className="space-y-3 px-4 pb-3">

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
                      🎵
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

                {/* CTA with Echo Gradient */}
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
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Media Carousel Component */
function MediaCarousel({ 
  media, 
  currentIndex, 
  onTouchStart, 
  onTouchEnd, 
  onPrevious, 
  onNext, 
  onClose,
  canSlide,
  theme 
}: { 
  media: File[]; 
  currentIndex: number;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  canSlide: boolean;
  theme?: "dark" | "light";
}) {
  const fallback = theme === "dark" ? "bg-black/40" : "bg-black/10";
  
  if (!media?.length) {
    return <div className={`h-[36vh] md:h-[38vh] ${fallback} flex items-center justify-center rounded-2xl`}>
      <span className="text-white/50 text-sm">No media selected</span>
    </div>;
  }

  const currentFile = media[currentIndex];
  const previewUrl = URL.createObjectURL(currentFile);
  const isVideo = currentFile.type.startsWith('video/');

  return (
    <div 
      className="relative w-full h-[36vh] md:h-[38vh] overflow-hidden rounded-2xl bg-black"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Current Media */}
      {isVideo ? (
        <video 
          key={`v-${currentIndex}`}
          src={previewUrl} 
          className="h-full w-full object-cover" 
          muted 
          playsInline
        />
      ) : (
        <img 
          key={`i-${currentIndex}`}
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
            onClick={onPrevious}
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
            onClick={onNext}
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

      {/* Media Dots Indicator (only if >1 media) */}
      {canSlide && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {media.map((_, i) => (
            <span
              key={i}
              className={`
                h-2.5 w-2.5 rounded-full transition-colors
                ${i === currentIndex ? "bg-white" : "bg-white/40"}
                ring-1 ring-white/30
              `}
            />
          ))}
        </div>
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