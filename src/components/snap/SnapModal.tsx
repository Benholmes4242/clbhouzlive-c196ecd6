import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Images, X, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserMedia, useSnapModalUserMedia } from '@/hooks/useSnapModalUserMedia';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMediaHandlers } from '@/components/bottom-navigation/useMediaHandlers';
import { useModalContext } from '@/contexts/ModalContext';
import { useSnapModal } from '@/hooks/useSnapModal';
import { composeThumbRowGlobal, Thumb } from '@/utils/mediaThumbs';

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
  const { openComposerWithFiles } = useSnapModal();
  
  const { handleCameraClick, handleMixedMediaClick } = useMediaHandlers(onClose, () => {});
  
  // Enhanced multi-select media picker for iOS compatibility
  const openMediaPicker = async () => {
    const ACCEPT = "image/*,video/*";
    const MAX_FILES = 10;
    
    // Check if iOS and show hint on first use
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isiOS && !localStorage.getItem('multiSelectHintShown')) {
      // Optional: show toast here if you have one available
      localStorage.setItem('multiSelectHintShown', '1');
    }

    // Use File Input fallback for best iOS support
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT;
    input.multiple = true; // Critical for iOS multi-select
    input.capture = undefined as any; // Ensure NOT set to avoid forcing camera

    input.onchange = () => {
      const files = Array.from(input.files ?? []).slice(0, MAX_FILES);
      if (files.length > 0) {
        if (files.length > MAX_FILES) {
          // Optional: show toast "Max 10 items"
        }
        openComposerWithFiles(files);
      }
      input.remove();
    };

    onClose(); // Close modal first
    setTimeout(() => input.click(), 100); // Small delay for smooth UX
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

  /**
   * Keeps all rows the same total width using flex weights.
   * videos: [1,1,1]   (3 equal rects)
   * photos: [1,2]     (square + 2x wide rect)
   * capture:[2,1]     (long + square)
   */
  function ThumbStrip({
    variant,
    thumbs = [],
  }: {
    variant: "videos" | "photos" | "capture";
    thumbs?: Thumb[];
  }) {
    return (
      <div className="flex items-stretch gap-2 h-16 w-56">
        {variant === "videos" && (
          <>
            {thumbs.slice(0, 3).map((t, i) => (
              <div key={t.id ?? `ph-${i}`} className="flex-[1_0_0] aspect-square overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
                <img
                  src={t.displaySrc}
                  alt=""
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholders.videos[0]; }}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </>
        )}

        {variant === "photos" && (
          <>
            {thumbs.slice(0, 2).map((t, i) => (
              <div 
                key={t.id ?? `ph-${i}`} 
                className={`${i === 0 ? 'flex-[1_0_0] aspect-square' : 'flex-[2_0_0] aspect-[8/3]'} overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10`}
              >
                <img
                  src={t.displaySrc}
                  alt=""
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholders.photos[0]; }}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </>
        )}

        {variant === "capture" && (
          <>
            {thumbs.slice(0, 2).map((t, i) => (
              <div 
                key={t.id ?? `ph-${i}`} 
                className={`${i === 0 ? 'flex-[2_0_0] aspect-[8/3]' : 'flex-[1_0_0] aspect-square'} overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10`}
              >
                <img
                  src={t.displaySrc}
                  alt=""
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholders.capture[0]; }}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  const cardOptions = [
    ...(isMobile ? [{
      key: "capture",
      label: "Camera",
      description: "Take photo or video",
      icon: Camera,
      onClick: () => handleCameraClick(user),
      variant: "capture" as const,
      thumbs: captureThumbs,
    }] : []),
    {
      key: "media",
      label: "Media",
      description: "Pick photos & videos",
      icon: Images,
      onClick: openMediaPicker,
      variant: "photos" as const, // Reuse photos layout for thumbnails
      thumbs: photoThumbs,
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
                {cardOptions.map(({ key, label, description, icon: Icon, onClick, variant, thumbs }) => (
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
                        {!isLoading && !error && photos.length === 0 && videos.length === 0 && key === 'media' && (
                          <div className="text-xs text-white/50">No posts yet - start creating!</div>
                        )}
                      </div>
                    </div>

                    {/* ThumbStrip Component */}
                    <ThumbStrip variant={variant} thumbs={thumbs} />
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