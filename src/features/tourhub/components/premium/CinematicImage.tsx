import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CinematicImageProps {
  src: string;
  alt: string;
  className?: string;
  kenBurns?: boolean;
  overlay?: 'hero' | 'card' | 'none';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Cinematic image with Ken Burns animation and gradient overlays
 */
export const CinematicImage: React.FC<CinematicImageProps> = ({
  src,
  alt,
  className,
  kenBurns = false,
  overlay = 'hero',
  priority = false,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Image with optional Ken Burns */}
      <motion.div
        className="absolute inset-0"
        animate={
          kenBurns && isLoaded
            ? {
                scale: [1, 1.08],
                x: [0, -20],
              }
            : undefined
        }
        transition={
          kenBurns
            ? {
                duration: 30,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'linear',
              }
            : undefined
        }
      >
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover',
            !isLoaded && 'opacity-0',
            isLoaded && 'opacity-100 transition-opacity duration-500'
          )}
        />
      </motion.div>

      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900 animate-pulse" />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center">
          <span className="text-white/40 text-sm">Image unavailable</span>
        </div>
      )}

      {/* Gradient overlays */}
      {overlay === 'hero' && (
        <>
          <div className="th-gradient-hero absolute inset-0 pointer-events-none" />
          <div className="th-gradient-hero-horizontal absolute inset-0 pointer-events-none" />
        </>
      )}

      {overlay === 'card' && (
        <div className="th-gradient-card absolute inset-0 pointer-events-none" />
      )}
    </div>
  );
};
