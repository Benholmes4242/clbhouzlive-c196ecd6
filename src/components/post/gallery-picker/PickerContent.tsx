import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image, Video, Sparkles } from 'lucide-react';
import { PickerContentProps } from './types';

const PickerContent: React.FC<PickerContentProps> = ({
  isMultiSelectMode,
  isMobile,
  onCameraClick,
  onPhotoClick,
  onVideoClick,
  multiSelectPreview
}) => {
  const [photoThumbs, setPhotoThumbs] = useState<string[]>([]);
  const [videoThumbs, setVideoThumbs] = useState<string[]>([]);

  // Mock thumbnails for demonstration - replace with real gallery access
  useEffect(() => {
    setPhotoThumbs(['/placeholder.svg', '/placeholder.svg']);
    setVideoThumbs(['/placeholder.svg', '/placeholder.svg', '/placeholder.svg']);
  }, []);

  const Thumbnail = ({ src }: { src?: string }) => (
    <div className="h-12 w-16 overflow-hidden rounded-lg bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm">
      {src && <img src={src} alt="" className="h-full w-full object-cover opacity-60" />}
    </div>
  );

  if (isMultiSelectMode) {
    return <>{multiSelectPreview}</>;
  }

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
      onClick: onPhotoClick,
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
    <div className="space-y-3">
      {/* Media Options */}
      {cardOptions.map(({ key, label, description, icon: Icon, onClick, thumbs }) => (
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

      <p className="text-center text-xs text-white/50 mt-1 px-2 leading-relaxed">
        Select multiple files to create a carousel post with swipeable media.
      </p>
    </div>
  );
};

export default PickerContent;