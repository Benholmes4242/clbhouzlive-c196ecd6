import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, Video, X, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserMedia, useSnapModalUserMedia } from '@/hooks/useSnapModalUserMedia';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMediaHandlers } from '@/components/bottom-navigation/useMediaHandlers';
import { useModalContext } from '@/contexts/ModalContext';
import { composeThumbRowGlobal, Thumb, Media } from '@/utils/mediaThumbs';

interface SnapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraClick: () => void;
  onImageClick: () => void;
  onVideoClick: () => void;
}

const SnapModal = ({ 
  isOpen, 
  onClose, 
  onCameraClick, 
  onImageClick, 
  onVideoClick 
}: SnapModalProps) => {
  const isMobile = useIsMobile();
  const { user } = useSupabaseSession();
  const { setSnapModalOpen } = useModalContext();
  const { photos, videos, isLoading, error } = useSnapModalUserMedia(user?.id);
  
  const { handleMixedMediaClick } = useMediaHandlers(onClose, () => {});

  // Update modal context when snap modal opens/closes
  useEffect(() => {
    setSnapModalOpen(isOpen);
  }, [isOpen, setSnapModalOpen]);

  const TILES_PER_ROW = { capture: 2, photos: 2, videos: 3 };

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

  // One shared set per modal open = no duplicates anywhere in the modal.
  const seen = useMemo(() => new Set<string>(), [isOpen]);

  const captureThumbs: Thumb[] = useMemo(
    () => composeThumbRowGlobal(
      photos.map(p => ({ id: p.id || p.url, type: "image" as const, url: p.url, thumbUrl: p.thumbUrl })),
      placeholders.capture, 
      TILES_PER_ROW.capture, 
      seen
    ),
    [photos, placeholders.capture, seen]
  );

  const photoThumbs: Thumb[] = useMemo(
    () => composeThumbRowGlobal(
      photos.map(p => ({ id: p.id || p.url, type: "image" as const, url: p.url, thumbUrl: p.thumbUrl })),
      placeholders.photos, 
      TILES_PER_ROW.photos, 
      seen
    ),
    [photos, placeholders.photos, seen]
  );

  const videoThumbs: Thumb[] = useMemo(
    () => composeThumbRowGlobal(
      videos.map(v => ({ id: v.id || v.url, type: "video" as const, url: v.url, thumbUrl: v.thumbUrl })),
      placeholders.videos, 
      TILES_PER_ROW.videos, 
      seen
    ),
    [videos, placeholders.videos, seen]
  );

  // Reusable thumbnail components
  type StripVariant = "videos" | "photos" | "capture";

  function Thumb({ thumb, className = "", style, phFallback }: { 
    thumb: Thumb; 
    className?: string; 
    style?: React.CSSProperties;
    phFallback: string;
  }) {
    return (
      <div
        className={`overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 ${className}`}
        style={style}
      >
        <img 
          src={thumb.displaySrc} 
          alt="" 
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            // Fallback to golf course photo if thumbnail fails to load
            const target = e.target as HTMLImageElement;
            target.src = phFallback;
          }}
        />
      </div>
    );
  }

  /**
   * Keeps all rows the same total width using flex weights.
   * videos: [1,1,1]   (3 equal rects)
   * photos: [2,1]     (wide rect + square)
   * capture:[2,1]     (wide rect + square, switched from photos)
   */
  function ThumbStrip({
    variant,
    thumbs = [],
    placeholderFallback,
  }: {
    variant: StripVariant;
    thumbs?: Thumb[];
    placeholderFallback: string;
  }) {
    return (
      <div className="flex items-stretch gap-2 h-16 w-56">{/* Longer fixed width for all strips */}
        {variant === "videos" && (
          <>
            <Thumb className="flex-[1_0_0] aspect-square" thumb={thumbs[0]} phFallback={placeholderFallback} />
            <Thumb className="flex-[1_0_0] aspect-square" thumb={thumbs[1]} phFallback={placeholderFallback} />
            <Thumb className="flex-[1_0_0] aspect-square" thumb={thumbs[2]} phFallback={placeholderFallback} />
          </>
        )}

        {variant === "photos" && (
          <>
            {/* square counts as 1 unit */}
            <Thumb className="flex-[1_0_0] aspect-square" thumb={thumbs[0]} phFallback={placeholderFallback} />
            {/* extra long rectangle counts as 2 units */}
            <Thumb className="flex-[2_0_0] aspect-[8/3]" thumb={thumbs[1]} phFallback={placeholderFallback} />
          </>
        )}

        {variant === "capture" && (
          <>
            {/* extra long rectangle counts as 2 units */}
            <Thumb className="flex-[2_0_0] aspect-[8/3]" thumb={thumbs[0]} phFallback={placeholderFallback} />
            {/* square counts as 1 unit */}
            <Thumb className="flex-[1_0_0] aspect-square" thumb={thumbs[1]} phFallback={placeholderFallback} />
          </>
        )}
      </div>
    );
  }

  const cardOptions = [
    ...(isMobile ? [{
      key: "capture",
      label: "Cam",
      description: "Take photo or video",
      icon: Camera,
      onClick: onCameraClick,
      variant: "capture" as StripVariant,
      thumbs: captureThumbs,
      placeholderFallback: placeholders.capture[0],
    }] : []),
    {
      key: "photos",
      label: "Photos",
      description: "Select from gallery",
      icon: Image,
      onClick: onImageClick,
      variant: "photos" as StripVariant,
      thumbs: photoThumbs,
      placeholderFallback: placeholders.photos[0],
    },
    {
      key: "videos",
      label: "Videos", 
      description: "Select from gallery",
      icon: Video,
      onClick: onVideoClick,
      variant: "videos" as StripVariant,
      thumbs: videoThumbs,
      placeholderFallback: placeholders.videos[0],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Panel */}
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Create a Moment"
              className="w-full max-w-[480px] bg-black/55 backdrop-blur-xl ring-1 ring-white/10 text-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-xl font-semibold">Create a Moment</h2>
                <button 
                  onClick={onClose} 
                  aria-label="Close" 
                  className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 pb-5 space-y-3">
                {/* Media Options */}
                {cardOptions.map(({ key, label, description, icon: Icon, onClick, variant, thumbs, placeholderFallback }) => (
                  <motion.button
                    key={key}
                    onClick={onClick}
                    className="w-full flex items-center justify-between gap-4 px-4 py-4 bg-neutral-900/70 backdrop-blur-md ring-1 ring-white/10 rounded-2xl hover:bg-white/5 transition-colors"
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-[17px] font-medium text-white">{label}</div>
                        {/* Show empty state message if no user media and not loading */}
                        {!isLoading && !error && photos.length === 0 && videos.length === 0 && key === 'photos' && (
                          <div className="text-xs text-white/50">No posts yet - start creating!</div>
                        )}
                      </div>
                    </div>

                    {/* New ThumbStrip Component */}
                    <ThumbStrip variant={variant} thumbs={thumbs} placeholderFallback={placeholderFallback} />
                  </motion.button>
                ))}

                {/* Error state with retry */}
                {error && (
                  <div className="px-4 py-3 bg-red-900/20 backdrop-blur-md ring-1 ring-red-500/20 rounded-2xl">
                    <div className="text-sm text-red-300 mb-2">Couldn't load your media</div>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Tell Your Story Card - AT BOTTOM */}
                <motion.button
                  onClick={() => {
                    onClose(); // Close modal first
                    setTimeout(() => handleMixedMediaClick(), 100); // Then open picker
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-neutral-900/70 backdrop-blur-md ring-1 ring-white/10 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors"
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[17px] font-medium text-white">Tell Your Story</span>
                    <span className="text-sm text-white/70">Mix photos & videos in one go</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SnapModal;