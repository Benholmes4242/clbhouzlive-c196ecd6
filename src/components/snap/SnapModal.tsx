import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Images, X, Sparkles } from 'lucide-react';
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
}

const SnapModal = ({ 
  isOpen, 
  onClose, 
  onCameraClick, 
  onImageClick, 
  onVideoClick, 
  openComposerWithFiles,
}: SnapModalProps) => {
  const isMobile = useIsMobile();
  const { user } = useSupabaseSession();
  const { setSnapModalOpen } = useModalContext();
  const { photos, videos, isLoading, error } = useSnapModalUserMedia(user?.id);
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
              <div key={t.id ?? `ph-${i}`} className="flex-[1_0_0] aspect-square overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 shadow-md hover:opacity-80 transition-opacity">
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
                className={`${i === 0 ? 'flex-[1_0_0] aspect-square' : 'flex-[2_0_0] aspect-[8/3]'} overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 shadow-md hover:opacity-80 transition-opacity`}
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
                className={`${i === 0 ? 'flex-[2_0_0] aspect-[8/3]' : 'flex-[1_0_0] aspect-square'} overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 shadow-md hover:opacity-80 transition-opacity`}
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
      onClick: onCameraClick,
      variant: "capture" as const,
      thumbs: captureThumbs,
    }] : []),
    {
      key: "media",
      label: "Media",
      description: "Pick photos & videos",
      icon: Images,
      onClick: handlePickMedia,
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
          transition={{ duration: 0.18, ease: "easeIn" }}
        >
          {/* Liquid Glass Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Liquid Glass Panel */}
          <div className="absolute inset-0 flex items-center justify-center p-6" onClick={onClose}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Create a Moment"
              className="w-full max-w-md liquid-glass rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] text-white overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                duration: 0.18
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Create a Moment</h2>
                  <p className="text-sm text-white/70 mt-1">Choose how you'd like to share</p>
                </div>
                <button 
                  onClick={onClose} 
                  aria-label="Close" 
                  className="w-8 h-8 rounded-full backdrop-filter backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 transition-all duration-200 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

                {/* Circular Glass Action Buttons */}
              <div className="px-6 pb-8">
                <div className="flex justify-center items-center gap-8 mb-6">
                  {cardOptions.map(({ key, label, icon: Icon, onClick }, index) => (
                    <motion.button
                      key={key}
                      onClick={onClick}
                      className="flex flex-col items-center gap-3 min-w-[44px]"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 30,
                        delay: index * 0.04
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Circular Glass Button */}
                      <div className="w-16 h-16 rounded-full backdrop-filter backdrop-blur-sm bg-white/10 hover:bg-brand-orange/30 border border-white/20 hover:border-brand-orange/40 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(247,147,30,0.3)]">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {/* Label */}
                      <span className="text-sm font-medium text-white/90">{label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Enhanced Story Button */}
                <motion.button
                  onClick={handlePickMedia}
                  className="w-full rounded-2xl backdrop-filter backdrop-blur-sm bg-gradient-to-r from-brand-orange/20 to-brand-orange/10 hover:from-brand-orange/30 hover:to-brand-orange/15 border border-brand-orange/30 hover:border-brand-orange/50 p-4 transition-all duration-200 shadow-lg hover:shadow-[0_0_24px_rgba(247,147,30,0.2)]"
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-orange/30 to-brand-orange/20 border border-brand-orange/40 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-brand-orange" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-semibold text-white text-base">Tell Your Story</span>
                      <span className="text-sm text-white/70">Mix photos & videos in one go</span>
                    </div>
                  </div>
                </motion.button>

                {/* Error state with retry */}
                {error && (
                  <div className="mt-4 px-4 py-3 rounded-2xl backdrop-filter backdrop-blur-sm bg-red-500/10 border border-red-500/20">
                    <div className="text-sm text-red-200 mb-2">Couldn't load your media</div>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="text-xs text-red-300 hover:text-red-200 underline transition-colors duration-200"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Empty state message */}
                {!isLoading && !error && photos.length === 0 && videos.length === 0 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-white/60">No posts yet - start creating!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SnapModal;