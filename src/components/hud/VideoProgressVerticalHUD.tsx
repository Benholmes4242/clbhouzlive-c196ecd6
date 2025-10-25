import * as React from 'react';
import { createPortal } from 'react-dom';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';

/**
 * VideoProgressVerticalHUD - Vertical Pulse Line progress indicator with scrubbing
 * 
 * Props:
 *  - videoRef: HTMLVideoElement ref of the currently focused/playing clip
 *  - accent?: optional CSS color for fill gradient
 */
export function VideoProgressVerticalHUD({
  videoRef,
  accent,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  accent?: string;
}) {
  const { setProgressFillRef, progress } = useVideoProgressSync(videoRef.current);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const previewVideoRef = React.useRef<HTMLVideoElement | null>(null);
  
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [previewTime, setPreviewTime] = React.useState(0);
  const [previewPosition, setPreviewPosition] = React.useState(0);

  // Scrubbing handler
  const handleScrubStart = React.useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsScrubbing(true);
  }, []);

  const handleScrubMove = React.useCallback((clientY: number) => {
    if (!trackRef.current || !videoRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, 1 - (relativeY / rect.height)));
    
    const newTime = videoRef.current.duration * ratio;
    setPreviewTime(newTime);
    setPreviewPosition(relativeY);
    
    // Update preview video frame if available
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = newTime;
    }
  }, [videoRef]);

  const handleScrubEnd = React.useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = previewTime;
    setIsScrubbing(false);
    
    // Haptic feedback on iOS
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [videoRef, previewTime]);

  // Touch event handlers
  React.useEffect(() => {
    if (!isScrubbing) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleScrubMove(e.touches[0].clientY);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleScrubMove(e.clientY);
    };

    const handleEnd = () => {
      handleScrubEnd();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('mouseup', handleEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, [isScrubbing, handleScrubMove, handleScrubEnd]);

  // Format time display
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if there's no active video
  if (!videoRef.current) {
    return null;
  }

  const duration = videoRef.current.duration || 0;

  const progressBar = (
    <div
      ref={trackRef}
      aria-label="Video progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className="absolute right-[calc(env(safe-area-inset-right,0px)+16px)] top-1/4 bottom-1/4 w-[3px] z-[1100] select-none"
      style={{
        touchAction: 'none',
      }}
      onTouchStart={handleScrubStart}
      onMouseDown={handleScrubStart}
    >
      {/* Track (frosted glass) */}
      <div className="h-full w-full bg-white/10 backdrop-blur-sm rounded-full overflow-hidden relative">
        {/* Fill (gradient pulse - bottom origin for scaleY) */}
        <div
          ref={setProgressFillRef}
          className="w-full origin-bottom will-change-transform transition-transform duration-75"
          style={{
            position: 'absolute',
            bottom: 0,
            height: '100%',
            background: accent ?? 'linear-gradient(to top, #6E9277, rgba(255,255,255,0.6))',
            transform: 'scaleY(0)', // Will be updated by sync hook
          }}
        />
      </div>

      {/* Thumbnail Preview - appears during scrubbing */}
      {isScrubbing && (
        <div
          className="absolute right-full mr-3 rounded-lg overflow-hidden shadow-lg bg-black/80 border border-white/10 w-[80px] h-[140px] flex items-center justify-center animate-fade-in"
          style={{
            top: `${previewPosition}px`,
            transform: 'translateY(-50%)',
          }}
        >
          {/* Preview video frame */}
          <video
            ref={previewVideoRef}
            src={videoRef.current.src}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          
          {/* Time display */}
          <div className="absolute bottom-1 left-1 right-1 text-center">
            <span className="text-[10px] text-white/90 font-medium drop-shadow-lg">
              {formatTime(previewTime)}
            </span>
            <span className="text-[9px] text-white/60"> / {formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );

  // Render via Portal to escape any transformed ancestors
  return typeof window !== 'undefined' ? createPortal(progressBar, document.body) : null;
}
