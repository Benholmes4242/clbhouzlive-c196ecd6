import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, useEffect, useRef, useLayoutEffect } from "react";
import { X, ChevronLeft, ChevronRight, Globe, Lock, Sparkles, BarChart3, Play } from "lucide-react";
import { useSnapModal, ComposerMediaItem } from "@/hooks/useSnapModal";
import { useOptimisticPostSubmission } from "@/hooks/useOptimisticPostSubmission";
import { supabase } from "@/integrations/supabase/client";
import PostSuccessOverlay from './PostSuccessOverlay';
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
  const { setCreateMomentModalOpen } = useModalContext();
  const [aiLoading, setAiLoading] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Check for reduced motion preference
  const prefersReducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
          {/* backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md" 
            onClick={close}
          />

          {/* Modal Container */}
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={close}>
            <motion.div
              ref={wrapperRef}
              role="dialog"
              aria-modal="true"
              aria-label="Create a Moment"
              className="mx-auto w-full max-w-[680px] bg-[var(--cm-surface)] rounded-xl shadow-sm overflow-hidden"
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
              style={{
                '--cm-surface': 'hsl(var(--surface-light))',
                '--cm-card': 'hsl(var(--card-light))',
                '--cm-border': 'hsl(var(--border-soft-light))',
                '--cm-text': 'hsl(var(--text-primary))',
                '--cm-muted': 'hsl(var(--text-secondary))',
                '--cm-accent': 'hsl(var(--accent-orange))',
                '--cm-accent-contrast': 'hsl(var(--on-accent))'
              } as React.CSSProperties}
            >
              <div className="space-y-6 px-4 pb-6">
                {/* Close button - positioned absolute top-right */}
                <button 
                  onClick={close} 
                  aria-label="Close" 
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[var(--cm-card)] border border-[var(--cm-border)] hover:bg-[var(--cm-border)] active:scale-95 transition-all duration-200 flex items-center justify-center focus:ring-2 focus:ring-[var(--cm-accent)] focus:outline-none"
                >
                  <X className="w-4 h-4 text-[var(--cm-text)]" />
                </button>

                {/* Media Strip */}
                <section className="rounded-xl bg-[var(--cm-card)] border border-[var(--cm-border)] p-4 shadow-sm">
                  <div className="relative">
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
                      className="h-80 w-full rounded-xl"
                    />
                    
                    {/* Media metadata pills */}
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <div className="rounded-full bg-black/50 text-white text-xs px-2 py-0.5 flex items-center gap-1 backdrop-blur-sm">
                        <span>{activeIndex + 1}/{media.length}</span>
                      </div>
                    </div>

                    {/* Navigation arrows */}
                    {canSlide && (
                      <>
                        <button
                          onClick={prevMedia}
                          disabled={activeIndex === 0}
                          className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 
                                     h-10 w-10 rounded-full bg-white/80 backdrop-blur-md 
                                     border border-[var(--cm-border)] shadow-sm
                                     flex items-center justify-center hover:bg-white
                                     active:scale-[0.98] transition-all duration-200
                                     ${activeIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          aria-label="Previous media"
                        >
                          <ChevronLeft className="h-5 w-5 text-[var(--cm-text)]" />
                        </button>

                        <button
                          onClick={nextMedia}
                          disabled={activeIndex === media.length - 1}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 
                                     h-10 w-10 rounded-full bg-white/80 backdrop-blur-md 
                                     border border-[var(--cm-border)] shadow-sm
                                     flex items-center justify-center hover:bg-white
                                     active:scale-[0.98] transition-all duration-200
                                     ${activeIndex === media.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          aria-label="Next media"
                        >
                          <ChevronRight className="h-5 w-5 text-[var(--cm-text)]" />
                        </button>
                      </>
                    )}
                  </div>
                </section>

                {/* Add a caption card */}
                <section className="rounded-xl bg-[var(--cm-card)] border border-[var(--cm-border)] p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[var(--cm-text)] font-medium">Add a caption</h3>
                    <button
                      onClick={handleAICaption}
                      disabled={aiLoading || media.length === 0}
                      className="h-8 px-3 rounded-full border border-[var(--cm-border)] text-[var(--cm-text)]/80 hover:text-[var(--cm-text)] hover:border-[var(--cm-accent)] transition-all duration-200 text-sm disabled:opacity-50"
                      aria-label="Generate AI caption"
                    >
                      {aiLoading ? <StarsLoading /> : (
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>AI Caption</span>
                        </div>
                      )}
                    </button>
                  </div>
                  <textarea
                    className="w-full h-12 bg-transparent border-none outline-none resize-none placeholder-[var(--cm-muted)] text-[var(--cm-text)] text-sm leading-relaxed"
                    placeholder="What's happening in your golf moment?"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </section>

                {/* Tag a golf course card */}
                <section className="rounded-xl bg-[var(--cm-card)] border border-[var(--cm-border)] p-4 shadow-sm relative z-[9999]">
                  <h3 className="text-[var(--cm-text)] font-medium mb-3">Tag a golf course</h3>
                  <div className="relative">
                    <CourseTagInput
                      selectedCourse={course}
                      onCourseSelect={onCourseSelect || setSelectedCourse}
                      placeholder="Start typing to find a course..."
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cm-muted)]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                </section>

                {/* Background music card */}
                <section className="rounded-xl bg-[var(--cm-card)] border border-[var(--cm-border)] p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--cm-border)] border border-[var(--cm-border)] flex items-center justify-center">
                      <Play className="w-5 h-5 text-[var(--cm-text)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[var(--cm-text)] font-medium mb-1">Background music</h3>
                      <p className="text-sm text-[var(--cm-muted)] mb-3">Popular golf tracks today</p>
                      <div className="flex items-center gap-2 text-sm">
                        <button className="text-[var(--cm-accent)] hover:underline">Preview</button>
                        <span className="text-[var(--cm-muted)]">·</span>
                        <button className="text-[var(--cm-accent)] hover:underline">Browse</button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Visibility segment control */}
                <section className="rounded-xl bg-[var(--cm-card)] border border-[var(--cm-border)] p-4 shadow-sm">
                  <div className="rounded-full border border-[var(--cm-border)] p-1 flex">
                    <button
                      onClick={() => setVisibility("public")}
                      className={`flex-1 h-10 rounded-full px-4 text-sm font-medium transition-all duration-200 ${
                        visibility === "public"
                          ? "bg-[var(--cm-accent)] text-[var(--cm-accent-contrast)]"
                          : "bg-transparent text-[var(--cm-text)] opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span>Public</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setVisibility("private")}
                      className={`flex-1 h-10 rounded-full px-4 text-sm font-medium transition-all duration-200 ${
                        visibility === "private"
                          ? "bg-[var(--cm-accent)] text-[var(--cm-accent-contrast)]"
                          : "bg-transparent text-[var(--cm-text)] opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span>Private Archive</span>
                      </div>
                    </button>
                  </div>
                </section>

                {/* Post button */}
                <button
                  onClick={handlePost}
                  disabled={!canPost}
                  className="w-full h-14 rounded-xl bg-[var(--cm-accent)] text-[var(--cm-accent-contrast)] font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
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
