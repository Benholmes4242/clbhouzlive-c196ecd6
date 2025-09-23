import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DynamicPreviewProps {
  variant: 'camera' | 'photos' | 'story';
  images?: string[];
  className?: string;
}

const DynamicPreview: React.FC<DynamicPreviewProps> = ({ 
  variant, 
  images = [], 
  className = "" 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-cycle images for photos and story variants
  useEffect(() => {
    if ((variant === 'photos' || variant === 'story') && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 2000); // Change every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [variant, images.length]);

  if (variant === 'camera') {
    return (
      <div className={`h-8 w-full rounded-lg bg-white/5 overflow-hidden ${className}`}>
        {/* Animated shutter blink effect */}
        <motion.div 
          className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: [-40, 140] }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (variant === 'photos' && images.length > 0) {
    return (
      <div className={`h-8 w-full rounded-lg overflow-hidden flex items-center justify-end ${className}`}>
        <motion.div 
          className="h-6 w-10 rounded-md overflow-hidden"
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={images[currentIndex]}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </motion.div>
      </div>
    );
  }

  if (variant === 'story' && images.length >= 2) {
    return (
      <div className={`h-8 w-full rounded-lg overflow-hidden flex ${className}`}>
        {/* Split frame: photo on left, video on right */}
        <motion.div 
          className="flex-1 h-full"
          key={`left-${currentIndex}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <img
            src={images[currentIndex % images.length]}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </motion.div>
        <div className="w-[1px] bg-white/10" />
        <motion.div 
          className="flex-1 h-full relative"
          key={`right-${currentIndex}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <img
            src={images[(currentIndex + 1) % images.length]}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {/* Video play indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/60 border border-white/40" />
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallback: empty state with subtle background
  return (
    <div className={`h-8 w-full rounded-lg bg-white/5 ${className}`} />
  );
};

export default DynamicPreview;