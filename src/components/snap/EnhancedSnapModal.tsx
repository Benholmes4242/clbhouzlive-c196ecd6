import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Camera, Images, X, Sparkles, Zap, Film, Flashlight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSnapModalUserMedia } from '@/hooks/useSnapModalUserMedia';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useModalContext } from '@/contexts/ModalContext';
import { useImmersiveHeader } from '@/hooks/useImmersiveHeader';
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

  // Global header hiding for reliable cross-environment support
  useImmersiveHeader(Boolean(isOpen));
  
  console.log('🔍 EnhancedSnapModal state:', { isOpen, hasDataImmersive: document.documentElement.hasAttribute('data-immersive') });

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

  // Combine all user media and get latest 3 items for static previews
  const allUserMedia = useMemo(() => {
    const combined = [
      ...photosAdapted.map(p => ({ ...p, displayUrl: p.url })),
      ...videosAdapted.map(v => ({ ...v, displayUrl: v.thumbUrl || v.url }))
    ].filter(item => item.displayUrl);
    
    return combined.slice(0, 3); // Get latest 3 items
  }, [photosAdapted, videosAdapted]);

  // Static image URLs for cards
  const hasUserMedia = allUserMedia.length > 0;
  const photosCardImages = hasUserMedia 
    ? [
        allUserMedia[0]?.displayUrl || placeholders.photos[0],
        allUserMedia[1]?.displayUrl || placeholders.photos[1]
      ]
    : [placeholders.photos[0], placeholders.photos[1]];
    
  const storyCardImage = hasUserMedia 
    ? allUserMedia[0]?.displayUrl || placeholders.photos[0]
    : placeholders.photos[0];
  // Force rebuild to clear cache

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
      description: "Choose from gallery",
      icon: Images,
      onClick: handlePickMedia,
      previewVariant: "photos" as const,
      previewImages: photosCardImages,
      microInteraction: "fan",
    },
    {
      key: "story",
      label: "Tell Your Story",
      description: "Turn Moments Into Movies",
      icon: Film,
      onClick: handlePickMedia,
      previewVariant: "story" as const,
      previewImages: [storyCardImage],
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
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Backdrop with noise texture */}
          <div 
            className="absolute inset-0 bg-black/35 backdrop-blur-[8px]"
            onClick={onClose}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Modal Container */}
          <div 
            className="absolute inset-0 flex items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]" 
            onClick={onClose}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Create a Moment"
              className="relative w-full max-w-[560px] md:max-w-[640px] max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 320, 
                damping: 28,
                duration: 0.22
              }}
            >
              {/* Glass surface with gradient ring */}
              <div 
                className="relative bg-white/55 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.25)] p-5 md:p-7"
                style={{
                  boxShadow: `
                    0 24px 60px rgba(0,0,0,0.25),
                    inset 0 0 0 1px rgba(110,146,119,0.1),
                    inset 0 1px 0 0 rgba(255,255,255,0.4)
                  `
                }}
              >
                {/* Header */}
                <div className="mb-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black/90">
                        Create a Moment
                      </h2>
                      <p className="text-sm text-black/60 mt-1">
                        Share your golf moment with the community.
                      </p>
                    </div>
                    <button 
                      onClick={onClose} 
                      aria-label="Close" 
                      className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/70 text-white active:scale-95 transition-all duration-120 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-300/60 focus:outline-none"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Option Cards */}
                <div className="space-y-4">
                  {actionOptions.map(({ key, label, description, icon: Icon, onClick, previewImages, isSpecial }, index) => (
                    <motion.button
                      key={key}
                      onClick={onClick}
                      role="button"
                      aria-describedby={`${key}-description`}
                      className={`
                        w-full h-[88px] rounded-2xl border border-black/10 bg-white/70 backdrop-blur-md
                        transition-all duration-120
                        hover:scale-[0.995] hover:ring-1 hover:ring-emerald-200/40
                        active:scale-[0.99]
                        focus-visible:ring-2 focus-visible:ring-emerald-300/60 focus:outline-none
                        ${key === "camera" ? "shadow-[0_8px_32px_rgba(110,146,119,0.18)]" : ""}
                      `}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 380, 
                        damping: 26,
                        delay: index * 0.06
                      }}
                      whileTap={{ scale: prefersReducedMotion ? 1 : 0.99 }}
                    >
                      <div className="flex items-center h-full px-4 gap-3">
                        {/* Icon plate */}
                        <div 
                          className="w-14 h-14 rounded-xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] border border-black/10 flex items-center justify-center shrink-0"
                        >
                          <Icon className="w-6 h-6 text-black/70" strokeWidth={1.5} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="text-base font-semibold text-black flex items-center gap-2">
                            {label}
                            {isSpecial && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#6E9277]/10 text-[#6E9277] border border-[#6E9277]/20">
                                BETA
                              </span>
                            )}
                          </h3>
                          <p id={`${key}-description`} className="text-sm text-black/55">
                            {description}
                          </p>
                        </div>

                        {/* Preview */}
                        {key === "photos" && previewImages && previewImages.length >= 2 && (
                          <div className="flex gap-2 shrink-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden">
                              <img 
                                src={previewImages[0]} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="w-20 h-14 rounded-xl overflow-hidden">
                              <img 
                                src={previewImages[1]} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {key === "story" && previewImages && previewImages.length > 0 && (
                          <div className="flex gap-1 shrink-0">
                            {/* Mini storyboard strip - 3 frames */}
                            {[0, 0, 0].map((_, i) => (
                              <div key={i} className="w-12 h-14 rounded-lg overflow-hidden">
                                <img 
                                  src={previewImages[0]} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                  style={{
                                    filter: i === 1 ? 'brightness(0.9)' : i === 2 ? 'brightness(0.8)' : 'none'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Error state */}
                {error && (
                  <motion.div 
                    className="mt-4 px-4 py-3 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-sm text-red-700 mb-2">Couldn't load your media</div>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="text-xs text-red-600 hover:text-red-700 underline transition-colors duration-200"
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
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm text-black/45">No recent media yet</p>
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