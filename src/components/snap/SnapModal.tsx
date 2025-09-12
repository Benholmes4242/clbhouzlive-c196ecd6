
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, Video, X, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [photoThumbs, setPhotoThumbs] = useState<string[]>([]);
  const [videoThumbs, setVideoThumbs] = useState<string[]>([]);

  // Mock thumbnails for demonstration - replace with real gallery access
  useEffect(() => {
    setPhotoThumbs(['/placeholder.svg', '/placeholder.svg']);
    setVideoThumbs(['/placeholder.svg', '/placeholder.svg', '/placeholder.svg']);
  }, []);

  const Thumbnail = ({ src }: { src?: string }) => (
    <div className="h-12 w-16 overflow-hidden rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm">
      {src && <img src={src} alt="" className="h-full w-full object-cover opacity-80" />}
    </div>
  );

  const cardOptions = [
    ...(isMobile ? [{
      key: "capture",
      label: "Capture",
      description: "Take photo or video",
      icon: Camera,
      onClick: onCameraClick,
      thumbs: photoThumbs.slice(0, 2),
    }] : []),
    {
      key: "photos",
      label: "Photos",
      description: "Select from gallery",
      icon: Image,
      onClick: onImageClick,
      thumbs: photoThumbs,
    },
    {
      key: "videos",
      label: "Videos", 
      description: "Select from gallery",
      icon: Video,
      onClick: onVideoClick,
      thumbs: videoThumbs,
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
            className="absolute inset-0 bg-dark/30 backdrop-blur-xl"
            onClick={onClose}
          />
          
          {/* Panel */}
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Create a Moment"
              className="w-full max-w-[480px] bg-dark/20 backdrop-blur-2xl border border-white/30 text-white rounded-3xl shadow-[0_20px_80px_rgba(255,255,255,0.1)]"
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
                {cardOptions.map(({ key, label, description, icon: Icon, onClick, thumbs }) => (
                  <motion.button
                    key={key}
                    onClick={onClick}
                    className="w-full flex items-center justify-between gap-4 px-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/15 transition-colors"
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-[17px] font-medium text-white">{label}</div>
                        <div className="text-sm text-white/70">{description}</div>
                      </div>
                    </div>

                    {/* Thumbnails */}
                    <div className="flex gap-2">
                      {thumbs.slice(0, 3).map((src, i) => (
                        <Thumbnail key={i} src={src} />
                      ))}
                    </div>
                  </motion.button>
                ))}

                {/* Tell Your Story Card */}
                <motion.button
                  onClick={() => {
                    // TODO: Hook up to multi-select flow
                    console.log('Tell Your Story clicked - implement multi-select flow');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/15 transition-colors"
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
