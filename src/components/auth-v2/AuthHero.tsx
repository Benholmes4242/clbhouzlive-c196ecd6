import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AuthHeroProps {
  children?: React.ReactNode;
  videoSrc?: string;
}

/**
 * Full-bleed background with gradient + optional video overlay
 * Gradient always renders immediately - video is enhancement only
 */
const AuthHero: React.FC<AuthHeroProps> = ({ 
  children,
  videoSrc
}) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const showVideo = videoSrc && !videoError;

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Base gradient - ALWAYS visible immediately */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(152 45% 12%) 0%, hsl(160 35% 8%) 50%, hsl(170 25% 5%) 100%)',
        }}
      />

      {/* Optional video layer - only shows when loaded */}
      {showVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-60' : 'opacity-0'
          }`}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Dark overlay for text readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Subtle texture/noise overlay for depth */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 20%, hsl(152 40% 20% / 0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(160 30% 15% / 0.2) 0%, transparent 50%)',
        }}
      />

      {/* Content Container - always visible */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 h-full flex flex-col"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default AuthHero;
