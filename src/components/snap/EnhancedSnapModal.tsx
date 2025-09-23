import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Camera, Images, X, Sparkles, Zap, Film, Flashlight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSnapModalUserMedia } from '@/hooks/useSnapModalUserMedia';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useModalContext } from '@/contexts/ModalContext';
import { openMediaPicker } from '@/utils/openMediaPicker';
import DynamicPreview from './DynamicPreview';

// Adapter for mapping hook data to expected Media type
type RawPhoto = { id?: string; media_url?: string; url?: string; type?: string; media_type?: string; poster_url?: string; thumbUrl?: string; };

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
  onVideoClick: () => void;
  openComposerWithFiles: (files: File[]) => void;
}

const EnhancedSnapModal = ({ 
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
  
  // Motion values for subtle parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [2, -2]);
  const rotateY = useTransform(mouseX, [-300, 300], [-2, 2]);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Media picker handler
  const handlePickMedia = () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS && !localStorage.getItem('clb_media_tip')) {
      localStorage.setItem('clb_media_tip', '1');
    }

    openMediaPicker((files) => {
      console.log('[snapmodal] picker returned:', files?.length);
      openComposerWithFiles(files);
    });
  };

  // Handle mouse movement for parallax
  const handleMouseMove = (event: React.MouseEvent) => {
    if (prefersReducedMotion) return;
    
    const { clientX, clientY } = event;
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = clientX - left - width / 2;
    const y = clientY - top - height / 2;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  // Update modal context
  useEffect(() => {
    setSnapModalOpen(isOpen);
  }, [isOpen, setSnapModalOpen]);

  // Golf course placeholders
  const placeholders = {
    photos: [
      "/lovable-uploads/57ecae87-4439-4ee7-a189-6922ecd457ec.png",
      "/lovable-uploads/83676b62-ac84-42e1-89ae-bf311dfb0af0.png",
      "/lovable-uploads/60940add-d75e-49e0-adf8-1d1db7f19682.png",
    ],
    videos: [
      "/lovable-uploads/bae3305c-a005-4871-8bf1-9b8e620050be.png",
      "/lovable-uploads/37c5b77e-4f6c-44a1-b834-007c27cd7e4b.png",
      "/lovable-uploads/627f9763-275f-4f08-b82e-bf2d39284f75.png",
    ],
  };

  // Adapt media for previews
  const photosAdapted = useMemo(() => adaptMedia(photos, "image"), [photos]);
  const videosAdapted = useMemo(() => adaptMedia(videos, "video"), [videos]);

  // Get images for previews - use user's media or fallback to placeholders
  const photoUrls = photosAdapted.length > 0 
    ? photosAdapted.slice(0, 3).map(p => p.url).filter(Boolean)
    : placeholders.photos;
  
  const videoUrls = videosAdapted.length > 0 
    ? videosAdapted.slice(0, 3).map(v => v.thumbUrl || v.url).filter(Boolean)
    : placeholders.videos;

  // Mixed media for story preview
  const storyUrls = [...photoUrls.slice(0, 2), ...videoUrls.slice(0, 2)];

  const actionOptions = [
    ...(isMobile ? [{
      key: "camera",
      label: "Camera",
      description: "Take photo or video",
      icon: Camera,
      onClick: onCameraClick,
      previewVariant: "camera" as const,
      previewImages: [],
      microInteraction: "shutter",
    }] : []),
    {
      key: "photos",
      label: "Photos & Videos", 
      description: "Pick from gallery",
      icon: Images,
      onClick: handlePickMedia,
      previewVariant: "photos" as const,
      previewImages: photoUrls,
      microInteraction: "fan",
    },
    {
      key: "story",
      label: "Tell Your Story",
      description: "Mix photos & videos",
      icon: Film,
      onClick: handlePickMedia,
      previewVariant: "story" as const,
      previewImages: storyUrls,
      microInteraction: "glow",
      isSpecial: true, // Orange accent styling
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
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Modal Panel with subtle parallax */}
          <div 
            className="absolute inset-0 flex items-center justify-center p-6" 
            onClick={onClose}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              if (!prefersReducedMotion) {
                mouseX.set(0);
                mouseY.set(0);
              }
            }}
          >
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
              style={{
                transform: isOpen ? 'translateZ(0)' : undefined,
                rotateX: prefersReducedMotion ? 0 : rotateX,
                rotateY: prefersReducedMotion ? 0 : rotateY,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Header with contextual helper */}
              <div className="px-6 pt-6 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Create a Moment</h2>
                  </div>
                  <button 
                    onClick={onClose} 
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
                  Share your golf moment with the community
                </div>
              </div>

              {/* Action Options */}
              <div className="px-6 pb-6">
                <div className="space-y-3">
                  {actionOptions.map(({ key, label, description, icon: Icon, onClick, previewVariant, previewImages, microInteraction, isSpecial }, index) => (
                    <motion.button
                      key={key}
                      onClick={onClick}
                      className={`w-full p-4 rounded-2xl backdrop-filter backdrop-blur-sm transition-all duration-200 text-left group min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange/50 ${
                        isSpecial 
                          ? 'bg-brand-orange/5 hover:bg-brand-orange/10 border border-brand-orange/20 hover:border-brand-orange/40 hover:shadow-[0_0_20px_rgba(247,147,30,0.2)]'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/30'
                      }`}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 30,
                        delay: index * 0.08
                      }}
                      whileHover={{ 
                        scale: prefersReducedMotion ? 1 : 1.02,
                        ...(isSpecial && !prefersReducedMotion && {
                          boxShadow: '0 0 24px rgba(247,147,30,0.3)'
                        })
                      }}
                      whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
                      aria-label={`${label}: ${description}`}
                    >
                       <div className="flex items-center gap-2 h-16">
                       {/* Conditional rendering based on card type */}
                          {key === "camera" ? (
                            // Camera card: text on left, centered camera icon, empty right
                            <>
                              <div className="flex items-center flex-1">
                                {/* Text content */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-base text-white">
                                    {label}
                                  </h3>
                                  <p className="text-sm text-white/70">{description}</p>
                                </div>
                              </div>
                              
                              {/* Camera icon centered between text and right edge */}
                              <div className="flex items-center justify-center w-40">
                                <motion.div 
                                  className="w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-200 bg-white/10 group-hover:bg-brand-orange/20 border border-white/20 group-hover:border-brand-orange/40"
                                  whileHover={!prefersReducedMotion ? {
                                    opacity: [1, 0.5, 1]
                                  } : {}}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Icon className="w-7 h-7 transition-colors duration-200 text-white group-hover:text-brand-orange" />
                                </motion.div>
                              </div>
                            </>
                          ) : key === "photos" ? (
                            // Photos card: text on left, small + large preview on right
                            <>
                              <div className="flex items-center flex-1">
                                {/* Text content */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-base text-white">
                                    {label}
                                  </h3>
                                  <p className="text-sm text-white/70">{description}</p>
                                </div>
                              </div>
                              
                              {/* Two-card preview on the right */}
                              {previewImages && previewImages.length > 0 && (
                                <div className="flex gap-2 shrink-0">
                                  {/* Smaller card on left - made wider */}
                                  <div className="w-16 h-16 rounded-lg overflow-hidden">
                                    <img 
                                      src={previewImages[0]} 
                                      alt="Preview" 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  {/* Larger card on right */}
                                  <div className="w-24 h-16 rounded-lg overflow-hidden">
                                    <DynamicPreview 
                                      variant={previewVariant}
                                      images={previewImages}
                                      className="w-full h-full"
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            // Story card: text on left, wider preview close to emoji on right
                            <>
                              <div className="flex items-center flex-1">
                                {/* Text content */}
                                <div className="flex-1 min-w-0">
                                  <h3 className={`font-semibold text-base ${
                                    isSpecial ? 'text-brand-orange' : 'text-white'
                                  }`}>
                                    {label}
                                    {isSpecial && <span className="ml-1 text-brand-orange/70">🎞</span>}
                                  </h3>
                                  <p className="text-sm text-white/70">{description}</p>
                                </div>
                              </div>
                              
                              {/* Single wider image preview on the right, closer to emoji */}
                              {previewImages && previewImages.length > 0 && (
                                <div className="w-42 h-16 rounded-lg overflow-hidden shrink-0">
                                  <img 
                                    src={previewImages[0]} 
                                    alt="Story preview" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                    </motion.button>
                  ))}
                </div>


                {/* Error state */}
                {error && (
                  <motion.div 
                    className="mt-4 px-4 py-3 rounded-2xl backdrop-filter backdrop-blur-sm bg-red-500/10 border border-red-500/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-sm text-red-200 mb-2">Couldn't load your media</div>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="text-xs text-red-300 hover:text-red-200 underline transition-colors duration-200"
                    >
                      Retry
                    </button>
                  </motion.div>
                )}

                {/* Empty state */}
                {!isLoading && !error && photos.length === 0 && videos.length === 0 && (
                  <motion.div 
                    className="mt-4 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-sm text-white/60">No posts yet - start creating!</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedSnapModal;