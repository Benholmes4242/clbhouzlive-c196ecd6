/**
 * VideoProgressBar - Thin progress bar at bottom of video area
 * Shows video playback progress with scrubbing support
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VideoProgressBarProps {
  progress: number; // 0-100
  isVisible?: boolean;
  onSeek?: (percent: number) => void;
  className?: string;
}

export const VideoProgressBar: React.FC<VideoProgressBarProps> = ({
  progress,
  isVisible = true,
  onSeek,
  className,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubProgress, setScrubProgress] = useState(progress);

  // Update scrub progress when not scrubbing
  useEffect(() => {
    if (!isScrubbing) {
      setScrubProgress(progress);
    }
  }, [progress, isScrubbing]);

  const calculateProgress = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.min(100, Math.max(0, (x / rect.width) * 100));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || !onSeek) return;
    trackRef.current.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    const newProgress = calculateProgress(e.clientX);
    setScrubProgress(newProgress);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing || !trackRef.current) return;
    const newProgress = calculateProgress(e.clientX);
    setScrubProgress(newProgress);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || !isScrubbing) return;
    trackRef.current.releasePointerCapture(e.pointerId);
    setIsScrubbing(false);
    onSeek?.(scrubProgress);
  };

  const displayProgress = isScrubbing ? scrubProgress : progress;

  return (
    <div
      ref={trackRef}
      className={cn(
        'absolute left-0 right-0 z-30',
        'cursor-pointer',
        'transition-all duration-200',
        isScrubbing ? 'h-[5px]' : 'h-[3px]',
        !isVisible && 'opacity-0 pointer-events-none',
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)', // Above tab bar
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Track background */}
      <div className="absolute inset-0 bg-white/20 rounded-full" />
      
      {/* Progress fill */}
      <div
        className={cn(
          'absolute top-0 bottom-0 left-0 rounded-full bg-white',
          'transition-[width] duration-75 ease-linear'
        )}
        style={{ 
          width: `${displayProgress}%`,
          boxShadow: isScrubbing ? '0 0 10px rgba(255, 255, 255, 0.5)' : '0 0 6px rgba(255, 255, 255, 0.3)',
        }}
      />
      
      {/* Scrub thumb - only visible when scrubbing */}
      {isScrubbing && (
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
          style={{ left: `${displayProgress}%` }}
        />
      )}
    </div>
  );
};

export default VideoProgressBar;
