import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Images, X, Sparkles, Zap, Film } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserMedia, useSnapModalUserMedia } from '@/hooks/useSnapModalUserMedia';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

import { useModalContext } from '@/contexts/ModalContext';

import { composeThumbRowGlobal, Thumb } from '@/utils/mediaThumbs';
import { openMediaPicker } from '@/utils/openMediaPicker';

// Adapter for mapping hook data to expected Media type
type RawPhoto = { id?: string; media_url?: string; url?: string; type?: string; media_type?: string; poster_url?: string; thumbUrl?: string; };
type RawVideo = RawPhoto;

function adaptMedia<T extends RawPhoto>(items: T[], forceType?: "image" | "video") {
  return (items ?? []).map((r) => {
    const t = forceType ?? ((r.type as any) || (r.media_type as any));
    return {
      id: r.id ?? "",
      type: (t === "video" ? "video" : "image") as "image" | "video",
      url: (r.url ?? r.media_url) || "",
      thumbUrl: r.thumbUrl ?? r.poster_url ?? undefined,
    };
  });
}

interface SnapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraClick: () => void;
  onImageClick: () => void;
  onVideoClick: () => void; // Keep for backward compatibility
  openComposerWithFiles: (files: File[]) => void;
  onMixedMediaClick?: () => void; // NEW: Tell Your Story option
}

const SnapModal = ({ 
  isOpen, 
  onClose, 
  onCameraClick, 
  onImageClick, 
  onVideoClick, 
  openComposerWithFiles,
  onMixedMediaClick,
}: SnapModalProps) => {
  const isMobile = useIsMobile();
  const { user } = useSupabaseSession();
  const { setSnapModalOpen } = useModalContext();
  const { photos, videos, isLoading, error } = useSnapModalUserMedia(user?.id);
  const [isModalFocused, setIsModalFocused] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string>('');
  // using openComposerWithFiles from props
  
  
  
  // Media picker handler - safe for iOS, no camera triggers
  const handlePickMedia = () => {
    // Check if iOS and show hint on first use
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS && !localStorage.getItem('clb_media_tip')) {
      // Optional: show toast here if you have one available
      localStorage.setItem('clb_media_tip', '1');
    }

    openMediaPicker((files) => {
      console.log('[snapmodal] picker returned:', files?.length);
      openComposerWithFiles(files);
      // Let openComposerWithFiles handle closing the SnapModal
    });
  };

  // Update modal context when snap modal opens/closes
  useEffect(() => {
    setSnapModalOpen(isOpen);
  }, [isOpen, setSnapModalOpen]);

  // Golf course photo library - using curated golf images
  const placeholders = {
    capture: [
      "/lovable-uploads/ca1d3591-53f0-454e-bd54-e6fe955f0b7d.png", // Ryder Cup golfer in red
      "/lovable-uploads/49cccb8e-2ee7-4d91-8d5e-04104eea1899.png", // Golfer swinging with city skyline
    ],
    photos: [
      "/lovable-uploads/57ecae87-4439-4ee7-a189-6922ecd457ec.png", // Golfer on elevated tee with scenic valley view
      "/lovable-uploads/83676b62-ac84-42e1-89ae-bf311dfb0af0.png", // Tournament golf scene with crowd
      "/lovable-uploads/60940add-d75e-49e0-adf8-1d1db7f19682.png", // Golf clubs and equipment
    ],
    videos: [
      "/lovable-uploads/bae3305c-a005-4871-8bf1-9b8e620050be.png", // Golfer swinging with city skyline
      "/lovable-uploads/37c5b77e-4f6c-44a1-b834-007c27cd7e4b.png", // Golfer mid-swing on course
      "/lovable-uploads/627f9763-275f-4f08-b82e-bf2d39284f75.png", // Golfer mid-swing action shot
    ],
  };

  const TILES_PER_ROW = { capture: 2, photos: 2, videos: 3 };

  // One shared set per modal open => no duplicates anywhere in the modal.
  const seen = useMemo(() => new Set<string>(), []);

  // Reset dedupe when modal opens
  useEffect(() => {
    if (isOpen) seen.clear();
  }, [isOpen, seen]);

  // Adapt raw data to expected Media shape
  const photosA = useMemo(() => adaptMedia(photos, "image"), [photos]);
  const videosA = useMemo(() => adaptMedia(videos, "video"), [videos]);

  // Sanity check logs
  console.group("[SnapModal] adapter check");
  console.log("photosA", photosA.map(m => ({id:m.id, type:m.type, url:!!m.url})));
  console.log("videosA", videosA.map(m => ({id:m.id, type:m.type, url:!!m.url, thumb:!!m.thumbUrl})));
  console.groupEnd();

  const captureThumbs: Thumb[] = useMemo(
    () => composeThumbRowGlobal(photosA, placeholders.capture, TILES_PER_ROW.capture, seen),
    [photosA, placeholders.capture, seen]
  );

  const photoThumbs: Thumb[] = useMemo(
    () => composeThumbRowGlobal(photosA, placeholders.photos, TILES_PER_ROW.photos, seen),
    [photosA, placeholders.photos, seen]
  );

  const videoThumbs: Thumb[] = useMemo(
    () => composeThumbRowGlobal(videosA, placeholders.videos, TILES_PER_ROW.videos, seen),
    [videosA, placeholders.videos, seen]
  );

  // Dynamic Preview Components
  const CameraPreview = () => {
    return (
      <div className="relative h-12 w-full rounded-lg overflow-hidden bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm">
        {/* Lens ripple animation */}
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-white/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-lg border border-white/10"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
        {/* Center lens */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20" />
        </div>
      </div>
    );
  };

  const PhotosPreview = ({ images }: { images: Thumb[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const displayImages = images.length > 0 ? images.slice(0, 3) : 
      placeholders.photos.slice(0, 3).map((url, i) => ({ id: `placeholder-${i}`, displaySrc: url }));

    useEffect(() => {
      if (displayImages.length <= 1 || !isModalFocused) return;
      
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % displayImages.length);
      }, 1800);

      return () => clearInterval(interval);
    }, [displayImages.length, isModalFocused]);

    return (
      <div className="relative h-12 w-full rounded-lg overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={displayImages[currentIndex]?.displaySrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = placeholders.photos[0];
            }}
          />
        </AnimatePresence>
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
      </div>
    );
  };

  const StoryPreview = ({ photos, videos }: { photos: Thumb[]; videos: Thumb[] }) => {
    const [showVideo, setShowVideo] = useState(false);
    const displayPhoto = photos.length > 0 ? photos[0] : 
      { id: 'placeholder-photo', displaySrc: placeholders.photos[0] };
    const displayVideo = videos.length > 0 ? videos[0] : 
      { id: 'placeholder-video', displaySrc: placeholders.videos[0] };

    useEffect(() => {
      if (!isModalFocused) return;
      
      const interval = setInterval(() => {
        setShowVideo(prev => !prev);
      }, 2000);

      return () => clearInterval(interval);
    }, [isModalFocused]);

    return (
      <div className="relative h-12 w-full rounded-lg overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
        <div className="flex h-full">
          {/* Left side - Photo */}
          <div className="flex-1 relative overflow-hidden">
            <img
              src={displayPhoto.displaySrc}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = placeholders.photos[0];
              }}
            />
            <motion.div 
              className="absolute inset-0 bg-brand-orange/20"
              animate={{ opacity: showVideo ? 0 : 0.3 }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          {/* Divider */}
          <div className="w-px bg-white/20" />
          
          {/* Right side - Video */}
          <div className="flex-1 relative overflow-hidden">
            <img
              src={displayVideo.displaySrc}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = placeholders.videos[0];
              }}
            />
            <motion.div 
              className="absolute inset-0 bg-brand-orange/20"
              animate={{ opacity: showVideo ? 0.3 : 0 }}
              transition={{ duration: 0.5 }}
            />
            {/* Play indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                className="w-3 h-3 border-l-2 border-white/60"
                style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
                animate={{ opacity: showVideo ? 1 : 0.4 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle mixed media (Tell Your Story) option
  const handleTellYourStory = () => {
    setSelectedOption('Tell Your Story');
    if (onMixedMediaClick) {
      onMixedMediaClick();
    } else {
      handlePickMedia();
    }
  };

  const handleOptionClick = (key: string, action: () => void) => {
    setSelectedOption(key === "capture" ? "Camera" : key === "media" ? "Photos" : "Tell Your Story");
    action();
  };

  const cardOptions = [
    ...(isMobile ? [{
      key: "capture",
      label: "Camera",
      icon: Camera,
      onClick: () => handleOptionClick("capture", onCameraClick),
      preview: captureThumbs,
      description: "Take a photo or video right now"
    }] : []),
    {
      key: "media",
      label: "Photos",
      icon: Images,
      onClick: () => handleOptionClick("media", handlePickMedia),
      preview: photoThumbs,
      description: "Choose from your gallery"
    },
    {
      key: "story",
      label: "Tell Your Story",
      icon: Film,
      onClick: () => handleOptionClick("story", handleTellYourStory),
      preview: videoThumbs,
      description: "Mix photos & videos in one go",
      isSpecial: true // Flag for special styling
    },
  ];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.18 }}
        >
          {/* Backdrop - Consistent with Discover overlay scrim */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* ARIA live region for announcements */}
          <div 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            className="sr-only"
          >
            {selectedOption && `Selected ${selectedOption}`}
          </div>
          
          {/* Panel - Light floating sheet */}
          <div className="absolute inset-0 flex items-center justify-center p-6" onClick={onClose}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Create a Moment"
              className="w-full max-w-[480px] liquid-glass rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-white overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onFocus={() => setIsModalFocused(true)}
              onBlur={(e) => {
                // Only set unfocused if focus is leaving the modal entirely
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsModalFocused(false);
                }
              }}
              initial={prefersReducedMotion ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.95 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { y: -12, opacity: 0, scale: 0.98 }}
              transition={prefersReducedMotion ? 
                { duration: 0.1 } : 
                { type: "spring", stiffness: 280, damping: 26, duration: 0.18 }
              }
              onMouseMove={!prefersReducedMotion ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const deltaX = (e.clientX - centerX) / rect.width;
                const deltaY = (e.clientY - centerY) / rect.height;
                // Subtle parallax - max 2px movement
                e.currentTarget.style.setProperty('--parallax-y', `${Math.max(-2, Math.min(2, deltaY * 2))}px`);
              } : undefined}
              onMouseLeave={!prefersReducedMotion ? (e) => {
                e.currentTarget.style.setProperty('--parallax-y', '0px');
              } : undefined}
            >
                {/* Header */}
                <motion.div 
                  className="px-8 pt-8 pb-6 text-center"
                  style={{
                    transform: !prefersReducedMotion ? 'translateY(var(--parallax-y, 0px))' : 'none'
                  }}
                >
                  <h2 className="text-2xl font-semibold mb-2">Create a Moment</h2>
                  <p className="text-sm text-white/70 mb-1">Capture and share your golf journey</p>
                  
                  {/* Helper line */}
                  <motion.p 
                    className="text-xs text-white/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    Share your golf moment ⛳️
                  </motion.p>
                  
                  {/* Quick Post shortcut */}
                  <motion.button
                    onClick={handlePickMedia}
                    className="mt-3 px-4 py-2 text-xs font-medium text-brand-orange/80 hover:text-brand-orange border border-brand-orange/30 hover:border-brand-orange/50 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
                    whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                  >
                    <Zap className="inline h-3 w-3 mr-1" />
                    Quick Post
                  </motion.button>
                </motion.div>

              {/* Action Options with Dynamic Previews */}
              <div className="px-6 pb-8">
                <div className="space-y-6">
                  {cardOptions.map(({ key, label, icon: Icon, onClick, preview, description, isSpecial }, index) => (
                    <motion.button
                      key={key}
                      onClick={onClick}
                      className="w-full group relative overflow-hidden min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange/60 focus:ring-offset-2 focus:ring-offset-black/20 rounded-2xl"
                      initial={prefersReducedMotion ? { opacity: 0 } : { y: 30, opacity: 0 }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                      transition={prefersReducedMotion ? 
                        { delay: 0 } : 
                        { delay: index * 0.1, type: "spring", stiffness: 280, damping: 25 }
                      }
                      whileHover={!prefersReducedMotion ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                      aria-label={`${label}: ${description}`}
                    >
                      {/* Option Card */}
                      <div className={`p-4 rounded-2xl liquid-glass-subtle border transition-all duration-300 ${
                        isSpecial 
                          ? 'border-brand-orange/30 group-hover:border-brand-orange/60 group-hover:shadow-lg group-hover:shadow-brand-orange/20 ring-1 ring-brand-orange/20 group-hover:ring-brand-orange/40' 
                          : 'border-white/10 group-hover:border-white/20 group-hover:shadow-lg group-hover:shadow-brand-orange/10'
                      }`}>
                        <div className="flex items-center gap-4 mb-3">
                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-xl liquid-glass-button flex items-center justify-center transition-all duration-300 ${
                            isSpecial 
                              ? 'group-hover:ring-2 group-hover:ring-brand-orange/50 group-hover:bg-brand-orange/10' 
                              : 'group-hover:ring-2 group-hover:ring-brand-orange/30'
                          }`}>
                            <motion.div
                              animate={!prefersReducedMotion && isSpecial ? {
                                filter: ["drop-shadow(0 0 0px rgba(251,146,60,0))", "drop-shadow(0 0 8px rgba(251,146,60,0.4))", "drop-shadow(0 0 0px rgba(251,146,60,0))"]
                              } : {}}
                              transition={!prefersReducedMotion && isSpecial ? { 
                                duration: 2, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                              } : {}}
                              whileHover={!prefersReducedMotion ? 
                                key === "capture" ? { 
                                  opacity: [1, 0.7, 1], 
                                  transition: { duration: 0.2, ease: "easeInOut" } 
                                } :
                                key === "media" ? { 
                                  x: [0, 1, -1, 0], 
                                  transition: { duration: 0.3, ease: "easeInOut" } 
                                } :
                                key === "story" ? { 
                                  scale: [1, 1.05, 1], 
                                  transition: { duration: 0.2, ease: "easeInOut" } 
                                } : {}
                                : {}
                              }
                              whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
                            >
                              <Icon className={`h-6 w-6 transition-colors duration-300 ${
                                isSpecial 
                                  ? 'text-brand-orange group-hover:text-brand-orange' 
                                  : 'text-white group-hover:text-brand-orange'
                              }`} />
                            </motion.div>
                          </div>
                          
                          {/* Text */}
                          <div className="text-left flex-1">
                            <h3 className={`text-base font-semibold transition-colors duration-300 ${
                              isSpecial 
                                ? 'text-brand-orange group-hover:text-brand-orange' 
                                : 'text-white group-hover:text-brand-orange'
                            }`}>
                              {label}
                            </h3>
                            <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors duration-300">
                              {description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Dynamic Preview */}
                        <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                          {key === "capture" && <CameraPreview />}
                          {key === "media" && <PhotosPreview images={preview} />}
                          {key === "story" && <StoryPreview photos={photoThumbs} videos={videoThumbs} />}
                        </div>
                      </div>
                      
                      {/* Hover gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out pointer-events-none" />
                    </motion.button>
                  ))}
                </div>

                {/* Error state with retry */}
                {error && (
                  <div className="mt-6 px-5 py-4 bg-red-500/10 backdrop-blur-md ring-1 ring-red-500/30 rounded-2xl">
                    <div className="text-sm text-red-200 mb-2 text-center">Couldn't load your media</div>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="text-xs text-red-300 hover:text-red-100 underline transition-colors duration-200 block mx-auto"
                    >
                      Retry
                    </button>
                  </div>
                )}

              </div>

              {/* Close button - positioned at top right */}
              <button 
                onClick={onClose} 
                aria-label="Close modal" 
                className="absolute top-4 right-4 h-10 w-10 rounded-full liquid-glass-button hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/20"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SnapModal;