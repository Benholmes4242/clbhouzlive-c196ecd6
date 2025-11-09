/**
 * AppleProgressBar - Horizontal gradient progress bar
 * Part of the Apple-style Clubhouse redesign
 */

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AppleProgressBarProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  accent?: string;
  isActive?: boolean;
  className?: string;
}

export const AppleProgressBar = ({
  videoRef,
  accent = '#6e9277',
  isActive = false,
  className
}: AppleProgressBarProps) => {
  const [progress, setProgress] = useState(0);
  const [isNewClip, setIsNewClip] = useState(false);
  const requestRef = useRef<number>();

  // Sync progress with video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration && isFinite(video.duration)) {
        const percent = (video.currentTime / video.duration) * 100;
        setProgress(percent);
      }
      requestRef.current = requestAnimationFrame(updateProgress);
    };

    requestRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [videoRef]);

  // Pulse animation when new clip loads
  useEffect(() => {
    if (isActive) {
      setIsNewClip(true);
      const timer = setTimeout(() => setIsNewClip(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <div 
      className={cn(
        "fixed left-0 right-0 z-[45] h-0.5 overflow-hidden",
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + clamp(72px, var(--bottom-nav-height, 72px) + 6px, calc(var(--bottom-nav-height, 72px) + 6px)))',
      }}
    >
      {/* Track - frosted white subtle */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
        }}
      />
      
      {/* Fill - frosted white with soft glow */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 rounded-full transition-all",
          isNewClip ? "animate-pulse duration-200" : "duration-75 ease-linear"
        )}
        style={{
          width: `${progress}%`,
          background: 'rgba(255, 255, 255, 0.8)',
          boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)',
        }}
      />
    </div>
  );
};
