import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AuthHeroProps {
  children?: React.ReactNode;
  videoSrc?: string;
  posterSrc?: string;
  fallbackImageSrc?: string;
}

/**
 * Full-bleed background with video/image and gradient overlay
 * for immersive auth experience
 */
const AuthHero: React.FC<AuthHeroProps> = ({ 
  children,
  videoSrc = '/lovable-uploads/auth-hero-video.mp4',
  posterSrc = '/lovable-uploads/auth-hero-poster.jpg',
  fallbackImageSrc = '/lovable-uploads/auth-hero-fallback.jpg'
}) => {
  const [videoError, setVideoError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Background Media */}
      {!videoError ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={posterSrc}
          onError={() => setVideoError(true)}
          onLoadedData={() => setIsLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <img
          src={fallbackImageSrc}
          alt="Golf course background"
          onLoad={() => setIsLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Gradient Overlay - dark mode first */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Content Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 h-full flex flex-col"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default AuthHero;
