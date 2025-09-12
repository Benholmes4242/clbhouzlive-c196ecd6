import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, Video, X, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserMedia, type MediaThumb } from '@/hooks/useSnapModalUserMedia';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMediaHandlers } from '@/components/bottom-navigation/useMediaHandlers';
import { resolveThumbUrl } from '@/lib/resolveThumb';

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
  const { data: media = [], isLoading } = useUserMedia(user?.id, 0, user?.id);
  
  const { handleMixedMediaClick } = useMediaHandlers(onClose, () => {});

  // Split media into categories, memoized to prevent flicker
  const { recent, photos, videos } = useMemo(() => {
    const sorted = [...media].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return {
      recent: sorted.slice(0, 6),
      photos: sorted.filter(m => m.type?.startsWith("image")).slice(0, 6),
      videos: sorted.filter(m => m.type?.startsWith("video")).slice(0, 6),
    };
  }, [media]);

  // Golf course photo library - fallback placeholders
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

  // Loading skeleton component
  const SkeletonRow = () => (
    <div className="flex items-center gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 w-20 animate-pulse rounded-md bg-white/10" />
      ))}
    </div>
  );

  // Thumbnail grid component that handles video thumbnails properly
  function ThumbGrid({ items, fallbacks }: { items: MediaThumb[]; fallbacks: string[] }) {
    // Use real media if available, otherwise fallback to placeholders
    const displayItems = items.length > 0 ? items : fallbacks.map((url, i) => ({
      postId: `fallback-${i}`,
      url,
      thumbUrl: url,
      posterUrl: url,
      type: 'image',
      createdAt: new Date().toISOString(),
      streamId: null,
      width: null,
      height: null
    }));

    return (
      <div className="flex items-center gap-2 overflow-hidden w-44">
        {displayItems.slice(0, 3).map((m, index) => {
          const src = resolveThumbUrl(m);
          return (
            <div
              key={m.postId + src}
              className="relative h-12 w-20 overflow-hidden rounded-md bg-white/10 ring-1 ring-white/10 flex-shrink-0"
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  // Use the appropriate fallback based on index
                  img.src = fallbacks[index] || fallbacks[0];
                }}
              />
              {m.type?.startsWith("video") && (
                <span className="pointer-events-none absolute bottom-1 right-1 rounded px-1 text-[10px] bg-black/60 text-white">
                  ▶
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Card options with real data
  const cardOptions = [
    {
      key: 'capture',
      label: 'Capture',
      description: '',
      icon: Camera,
      onClick: onCameraClick,
      component: isLoading ? <SkeletonRow /> : <ThumbGrid items={recent} fallbacks={placeholders.capture} />
    },
    {
      key: 'photos',
      label: 'Photos',
      description: '',
      icon: Image,
      onClick: onImageClick,
      component: isLoading ? <SkeletonRow /> : <ThumbGrid items={photos} fallbacks={placeholders.photos} />
    },
    {
      key: 'videos',
      label: 'Videos',
      description: '',
      icon: Video,
      onClick: onVideoClick,
      component: isLoading ? <SkeletonRow /> : <ThumbGrid items={videos} fallbacks={placeholders.videos} />
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9998] flex items-end justify-center"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.4 
            }}
            className="relative w-full max-w-lg mx-4 mb-4 bg-neutral-900/90 backdrop-blur-md rounded-t-3xl border-t border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Create a Moment</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 pb-5 space-y-3">
              {/* Media Options */}
              {cardOptions.map(({ key, label, icon: Icon, onClick, component }) => (
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
                      {!isLoading && media.length === 0 && key === 'photos' && (
                        <div className="text-xs text-white/50">No posts yet - start creating!</div>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Component */}
                  {component}
                </motion.button>
              ))}

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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SnapModal;