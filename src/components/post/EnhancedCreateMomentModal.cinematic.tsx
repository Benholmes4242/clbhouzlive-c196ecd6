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
  const [activeCard, setActiveCard] = useState<'caption' | 'course' | 'music'>('caption');
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
          <div className="absolute inset-0 flex items-center justify-center py-8 px-6" onClick={close}>
            <motion.div
              ref={wrapperRef}
              role="dialog"
              aria-modal="true"
              aria-label="Create a Moment"
              className="w-full max-w-md h-[calc(100vh-4rem)] liquid-glass rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] text-white overflow-visible"
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
              <div className="flex h-full flex-col overflow-visible">
                {/* MEDIA SECTION - takes up ~75% of modal height with bubble protrusion */}
                <section id="media" className="relative flex-1 -mx-2 -mt-6 rounded-t-3xl overflow-hidden">{/* Minimal protrusion for subtle bubble effect */}
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
                  </motion.div>

                  {/* Close button overlay */}
                  <button 
                    onClick={close} 
                    aria-label="Close" 
                    className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full backdrop-filter backdrop-blur-sm bg-black/30 hover:bg-black/50 border border-white/20 active:scale-95 transition-all duration-200 flex items-center justify-center focus:ring-2 focus:ring-brand-orange/50 focus:outline-none"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>

                  {/* Video duration pill - top left */}
                  {media[activeIndex]?.type === 'video' && (
                    <div className="absolute top-6 left-6">
                      <div className="rounded-full bg-black/50 text-white text-xs px-2 py-0.5 flex items-center gap-1 backdrop-blur-sm">
                        <span>00:09</span>
                      </div>
                    </div>
                  )}

                  {/* Media counter - top right, aligned with cover badge */}
                  <div className="absolute top-6 right-16">
                    <div className="rounded-full bg-black/50 text-white text-xs px-2 py-0.5 flex items-center gap-1 backdrop-blur-sm">
                      <span>{activeIndex + 1}/{media.length}</span>
                    </div>
                  </div>

                </section>

                {/* CONTROLS SECTION - compact bottom area */}
                <section className="flex-shrink-0 px-6 pb-6 pt-4 space-y-3">
                  {/* SLIDING CARDS CONTAINER - more compact */}
                  <div className="relative h-[120px] overflow-hidden">
                    {/* CAPTION CARD */}
                    <motion.div
                      ref={captionRef}
                      className="absolute inset-0 w-full p-3 pt-2 rounded-2xl backdrop-filter backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/30 transition-all duration-200 text-left group min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
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
                      <div className="flex items-center justify-between mb-2">
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
                              <span className="font-medium">Inspire Me</span>
                            </div>
                          )}
                        </button>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <textarea
                          className="w-full bg-transparent outline-none resize-none placeholder-white/50 text-white min-h-[2.5rem] max-h-[4rem] overflow-y-auto border border-white/20 rounded-lg px-3 py-2 focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 transition-all duration-200"
                          placeholder="Write a caption…"
                          value={caption}
                          onChange={(e) => {
                            setCaption(e.target.value);
                          }}
                        />
                      </div>
                    </motion.div>

                    {/* COURSE CARD */}
                    <motion.div
                      className="absolute inset-0 w-full p-4 rounded-2xl backdrop-filter backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/30 transition-all duration-200 text-left group min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
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
                      className="absolute inset-0 w-full p-4 rounded-2xl backdrop-filter backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/30 transition-all duration-200 text-left group min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
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
                          // Handle music selection
                          console.log('Selected music:', music);
                        }}
                        hasVideo={media.some(item => item.type === 'video')}
                      />
                    </motion.div>
                  </div>

                  {/* PILL BUTTONS */}
                  <div className="flex justify-between w-full">
                    <button
                      onClick={() => setActiveCard('caption')}
                      className={`flex-1 mr-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        activeCard === 'caption'
                          ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/40'
                          : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      Caption
                    </button>
                    <button
                      onClick={() => setActiveCard('course')}
                      className={`flex-1 mx-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        activeCard === 'course'
                          ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/40'
                          : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      Tag a course
                    </button>
                    <button
                      onClick={() => setActiveCard('music')}
                      className={`flex-1 ml-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        activeCard === 'music'
                          ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/40'
                          : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      Add music
                    </button>
                  </div>

                  {/* POST BUTTON */}
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
                          {isSubmitting ? "Sharing..." : "Share"}
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
