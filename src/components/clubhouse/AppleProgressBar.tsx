/**
 * @deprecated Use VideoScrubber.tsx instead — this component is no longer used.
 * Kept for reference only. VideoScrubber provides GPU-accelerated scaleX animation,
 * buffered indicator, shimmer states, expanded touch targets, and MediaRuntime integration.
 */

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface AppleProgressBarProps {
  progress: number; // 0-100
  onScrubStart?: () => void;
  onScrubMove?: (percent: number) => void;
  onScrubEnd?: () => void;
  isActive?: boolean;
  className?: string;
}

export const AppleProgressBar = ({
  progress,
  onScrubStart,
  onScrubMove,
  onScrubEnd,
  isActive = false,
  className
}: AppleProgressBarProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    trackRef.current.setPointerCapture(e.pointerId);
    onScrubStart?.();
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
    onScrubMove?.(percent);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    trackRef.current.releasePointerCapture(e.pointerId);
    onScrubEnd?.();
  };

  return (
    <div
      ref={trackRef}
      className={cn(
        "h-[3px] w-full cursor-pointer overflow-hidden rounded-full bg-white/15",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={(e) => {
        if (e.buttons === 1) handlePointerMove(e);
      }}
      onPointerUp={handlePointerUp}
    >
      <div
        className="h-full rounded-full bg-white transition-[width] duration-[120ms] ease-linear"
        style={{ 
          width: `${progress}%`,
          boxShadow: '0 0 8px rgba(255, 255, 255, 0.45)'
        }}
      />
    </div>
  );
};
