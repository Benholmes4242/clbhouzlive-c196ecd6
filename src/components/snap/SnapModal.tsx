import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, Video, X, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { loadRecentMedia } from '@/lib/recentMediaCache';
import { useMediaHandlers } from '@/components/bottom-navigation/useMediaHandlers';

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
  const [captureeThumbs, setCaptureeThumbs] = useState<string[]>([]);
  const [photoThumbs, setPhotoThumbs] = useState<string[]>([]);
  const [videoThumbs, setVideoThumbs] = useState<string[]>([]);
  
  const { handleMixedMediaClick } = useMediaHandlers(onClose, () => {});

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

  // Load thumbnails from cache or use golf course placeholders
  useEffect(() => {
    (async () => {
      const cached = await loadRecentMedia();
      // Only use user's own media if they exist, otherwise always show golf course photos
      setCaptureeThumbs(cached.photos.length ? cached.photos.slice(0, 2) : placeholders.capture);
      setPhotoThumbs(cached.photos.length ? cached.photos.slice(0, 3) : placeholders.photos);
      setVideoThumbs(cached.videos.length ? cached.videos.slice(0, 3) : placeholders.videos);
    })();
  }, []);

  // Reusable thumbnail components
  type StripVariant = "videos" | "photos" | "capture";

  function Thumb({ src, className = "", style }: { src?: string; className?: string; style?: React.CSSProperties }) {
    return (
      <div
        className={`overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 ${className}`}
        style={style}
      >
        {src && (
          <img 
            src={src} 
            alt="" 
            className="h-full w-full object-cover"
            onError={(e) => {
              // Fallback to golf course photo if thumbnail fails to load
              const target = e.target as HTMLImageElement;
              const isVideoThumb = videoThumbs.includes(src || '');
              const fallbackImages = isVideoThumb ? placeholders.videos : placeholders.photos;
              target.src = fallbackImages[0]; // Use first golf course image as fallback
            }}
          />
        )}
      </div>
    );
  }

  /**
   * Keeps all rows the same total width using flex weights.
   * videos: [1,1,1]   (3 equal rects)
   * photos: [1,2]     (square + 2x wide rect)
   * capture:[1.5,1.5] (two equal rects, same total width as 3)
   */
  function ThumbStrip({
    variant,
    thumbs = [],
  }: {
    variant: StripVariant;
    thumbs?: string[];
  }) {
    return (
      <div className="flex items-stretch gap-2 h-12 w-44">{/* Longer fixed width for all strips */}
        {variant === "videos" && (
          <>
            <Thumb className="flex-[1_0_0] aspect-square" src={thumbs[0]} />
            <Thumb className="flex-[1_0_0] aspect-square" src={thumbs[1]} />
            <Thumb className="flex-[1_0_0] aspect-square" src={thumbs[2]} />
          </>
        )}

        {variant === "photos" && (
          <>
            {/* square counts as 1 unit */}
            <Thumb className="flex-[1_0_0] aspect-square" src={thumbs[0]} />
            {/* extra long rectangle counts as 2 units */}
            <Thumb className="flex-[2_0_0] aspect-[8/3]" src={thumbs[1]} />
          </>
        )}

        {variant === "capture" && (
          <>
            {/* two equal rectangles, each 1.5 units so total = 3 */}
            <Thumb className="aspect-[4/3]" style={{ flex: "1.5 0 0" }} src={thumbs[0]} />
            <Thumb className="aspect-[4/3]" style={{ flex: "1.5 0 0" }} src={thumbs[1]} />
          </>
        )}
      </div>
    );
  }

  const cardOptions = [
    ...(isMobile ? [{
      key: "capture",
      label: "Capture",
      description: "Take photo or video",
      icon: Camera,
      onClick: onCameraClick,
      variant: "capture" as StripVariant,
      thumbs: captureeThumbs, // Use dedicated capture thumbs
    }] : []),
    {
      key: "photos",
      label: "Photos",
      description: "Select from gallery",
      icon: Image,
      onClick: onImageClick,
      variant: "photos" as StripVariant,
      thumbs: photoThumbs.slice(0, 2), // Only need 2 for square + wide layout
    },
    {
      key: "videos",
      label: "Videos", 
      description: "Select from gallery",
      icon: Video,
      onClick: onVideoClick,
      variant: "videos" as StripVariant,
      thumbs: videoThumbs.slice(0, 3), // Need 3 for equal rectangles
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
                      </div>
                    </div>

                    {/* New ThumbStrip Component */}
                    <ThumbStrip variant={variant} thumbs={thumbs} />
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SnapModal;