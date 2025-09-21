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

          {/* shell */}
          <div className="absolute inset-0 flex items-center justify-center p-6" onClick={close}>
            <motion.div
              ref={wrapperRef}
              role="dialog"
              aria-modal="true"
              aria-label="Create a Moment"
              className="w-full max-w-md liquid-glass rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] text-white overflow-hidden"
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
              <div className="flex h-full flex-col">
                {/* Header with close button */}
                <div className="px-6 pt-6 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Create a Moment</h2>
                    </div>
                    <button 
                      onClick={close} 
                      aria-label="Close" 
                      className="w-8 h-8 rounded-full backdrop-filter backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 transition-all duration-200 flex items-center justify-center focus:ring-2 focus:ring-brand-orange/50 focus:outline-none"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  {/* Contextual helper line */}
                  <div 
                    className="text-sm text-white/70"
                    role="status"
                    aria-live="polite"
                  >
                    Share your golf moment with the community ⛳️
                  </div>
                </div>

                {/* MEDIA SECTION */}
                <section id="media" className="relative flex-1 overflow-hidden px-6">
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
                      className="h-full w-full rounded-b-xl"
                    />
                  </motion.div>

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
                        className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 
                                 h-10 w-10 rounded-full bg-white/12 backdrop-blur-md 
                                 border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.35)]
                                 flex items-center justify-center hover:bg-white/18 
                                 active:scale-[0.98] transition-all duration-200
                                 ${activeIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label="Previous media"
                      >
                        <ChevronLeft className="h-5 w-5 text-white" />
                      </button>

                      <button
                        onClick={nextMedia}
                        disabled={activeIndex === media.length - 1}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 
                                 h-10 w-10 rounded-full bg-white/12 backdrop-blur-md 
                                 border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.35)]
                                 flex items-center justify-center hover:bg-white/18 
                                 active:scale-[0.98] transition-all duration-200
                                 ${activeIndex === media.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label="Next media"
                      >
                        <ChevronRight className="h-5 w-5 text-white" />
                      </button>
                    </>
                  )}
                </section>

                {/* CONTROLS SECTION */}
                <section className="px-6 pb-6 space-y-3">
                  {/* CAPTION CARD */}
                  <motion.div
                    ref={captionRef}
                    className="w-full p-4 rounded-2xl backdrop-filter backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/30 transition-all duration-200 text-left group min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 30,
                      delay: 0
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <label className="block text-base font-semibold text-white">Add a caption</label>
                      <button
                        onClick={handleAICaption}
                        disabled={aiLoading || media.length === 0}
                        className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full shrink-0 transition-all duration-200 text-sm disabled:opacity-50 text-white border border-white/20 hover:border-white/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
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
                    <p className="text-sm text-white/70 mb-3">Share your golf moment with the community</p>
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
                  </motion.div>

                  {/* Course Tag Card */}
                  <motion.div
                    className="w-full p-4 rounded-2xl backdrop-filter backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/30 transition-all duration-200 text-left group min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange/50 relative z-[9999]"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 30,
                      delay: 0.08
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-brand-orange/20 border border-white/20 group-hover:border-brand-orange/40 flex items-center justify-center transition-all duration-200 shrink-0">
                        <BarChart3 className="w-5 h-5 text-white group-hover:text-brand-orange transition-colors duration-200" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-base text-white">Tag a golf course</h3>
                        </div>
                        <p className="text-sm text-white/70 mb-3">Let others know where you played</p>
                        <CourseTagInput
                          selectedCourse={course}
                          onCourseSelect={onCourseSelect || setSelectedCourse}
                          placeholder="Start typing to find a course..."
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Music Card */}
                  <motion.div
                    className="w-full p-4 rounded-2xl backdrop-filter backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/30 transition-all duration-200 text-left group min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 30,
                      delay: 0.16
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-brand-orange/20 border border-white/20 group-hover:border-brand-orange/40 flex items-center justify-center transition-all duration-200 shrink-0">
                        <Play className="w-5 h-5 text-white group-hover:text-brand-orange transition-colors duration-200" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-base text-white">Background music</h3>
                        </div>
                        <p className="text-sm text-white/70 mb-3">Popular golf tracks today</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              // TODO: Preview music
                              console.log("Music preview clicked");
                            }}
                            className="text-sm text-brand-orange hover:text-brand-orange-light transition-colors duration-200"
                            aria-label="Preview music"
                          >
                            Preview
                          </button>
                          <span className="text-white/30">•</span>
                          <button
                            onClick={() => {
                              // TODO: Background music selector
                              console.log("Music selector clicked");
                            }}
                            className="text-sm text-brand-orange hover:text-brand-orange-light transition-colors duration-200"
                            aria-label="Browse music library"
                          >
                            Browse
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Visibility Card */}
                  <motion.div
                    className="w-full p-4 rounded-2xl backdrop-filter backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/30 transition-all duration-200 text-left group min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 30,
                      delay: 0.24
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-brand-orange/20 border border-white/20 group-hover:border-brand-orange/40 flex items-center justify-center transition-all duration-200 shrink-0">
                        {visibility === "public" ? (
                          <Globe className="w-5 h-5 text-white group-hover:text-brand-orange transition-colors duration-200" />
                        ) : (
                          <Lock className="w-5 h-5 text-white group-hover:text-brand-orange transition-colors duration-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-base text-white">Visibility</h3>
                        </div>
                        <p className="text-sm text-white/70 mb-3">Choose who can see your moment</p>
                        <Segmented
                          options={[
                            {
                              value: "public",
                              label: "Public",
                              icon: Globe,
                            },
                            {
                              value: "private",
                              label: "Private Archive",
                              icon: Lock,
                            },
                          ]}
                          value={visibility}
                          onChange={(value) => setVisibility(value as "public" | "private")}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Post button - Quick Post style from Snap Modal */}
                  <motion.div
                    className="mt-4 pt-4 border-t border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.button
                      disabled={!canPost}
                      onClick={handlePost}
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-brand-orange/10 to-brand-orange/5 hover:from-brand-orange/20 hover:to-brand-orange/10 border border-brand-orange/20 hover:border-brand-orange/40 transition-all duration-200 group min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                      aria-label="Post your moment"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-medium text-brand-orange">
                          {isSubmitting ? "Posting..." : "Post"}
                        </span>
                      </div>
                    </motion.button>
                  </motion.div>
                </section>
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
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 flex items-center justify-center transition-all duration-200"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}

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
