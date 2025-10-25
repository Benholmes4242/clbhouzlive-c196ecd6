import * as React from 'react';
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
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const fillRef = React.useRef<HTMLDivElement | null>(null);
  const previewVideoRef = React.useRef<HTMLVideoElement | null>(null);
  
  const [playerEl, setPlayerEl] = React.useState<HTMLVideoElement | null>(null);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [previewTime, setPreviewTime] = React.useState(0);
  const [previewPosPx, setPreviewPosPx] = React.useState(0);
  const [scrubRatio, setScrubRatio] = React.useState(0);

  // Initialize sync hook with the real video element
  const { setProgressFillRef, pauseSync, resumeSync } = useVideoProgressSync(playerEl);

  // AUDIT: Update playerEl when videoRef.current becomes available
  React.useEffect(() => {
    console.log('[HUD Audit] videoRef check:', {
      videoRefCurrent: videoRef.current,
      currentPlayerEl: playerEl,
      areSame: videoRef.current === playerEl
    });
    
    if (videoRef.current && videoRef.current !== playerEl) {
      console.log('[HUD Audit] Setting new playerEl:', videoRef.current);
      setPlayerEl(videoRef.current);
    }
  }, [videoRef.current, playerEl]);

  // AUDIT: Wire up fillRef to sync hook with vertical orientation once both are ready
  React.useEffect(() => {
    console.log('[HUD Audit] fillRef registration check:', {
      fillRefCurrent: fillRef.current,
      playerEl: playerEl,
      transformOrigin: fillRef.current?.style.transformOrigin
    });
    
    if (fillRef.current && playerEl) {
      console.log('[HUD Audit] Registering fillRef with sync hook');
      setProgressFillRef(fillRef.current);
      fillRef.current.style.transformOrigin = 'bottom';
      fillRef.current.style.transform = 'scaleY(0)';
    }
  }, [setProgressFillRef, playerEl]);

  // Helper: clamp [0..1]
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

  const handleScrubStart = React.useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Pause the sync loop so manual scrubbing takes priority
    pauseSync?.();
    setIsScrubbing(true);

    // Immediately update preview to press point
    const clientY = 'touches' in e && e.touches.length > 0
      ? e.touches[0].clientY
      : 'clientY' in e
      ? e.clientY
      : 0;
    handleScrubMoveInternal(clientY);
  }, [pauseSync]);

  const handleScrubMoveInternal = React.useCallback((clientY: number) => {
    if (!trackRef.current || !playerEl) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    // Clamp relative position first for stability
    const relativeY = Math.min(Math.max(0, clientY - rect.top), rect.height);
    const ratio = clamp01(1 - (relativeY / rect.height));
    
    const newTime = (playerEl.duration || 0) * ratio;
    setPreviewTime(newTime);
    setPreviewPosPx(relativeY);
    setScrubRatio(ratio);
    
    // Drive fill immediately for visual feedback
    if (fillRef.current) {
      fillRef.current.style.transform = `scaleY(${ratio})`;
    }
    
    // Update preview video frame and force it to pause on that frame
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = newTime;
      
      // Force the preview to show the frame by pausing after seeking
      const pv = previewVideoRef.current;
      if (pv.readyState >= 2) { // HAVE_CURRENT_DATA
        pv.pause();
      } else {
        const onSeeked = () => {
          pv.pause();
          pv.removeEventListener('seeked', onSeeked);
        };
        pv.addEventListener('seeked', onSeeked);
      }
    }
  }, [playerEl, clamp01]);

  const handleScrubEnd = React.useCallback(() => {
    if (playerEl) {
      playerEl.currentTime = previewTime;
    }
    setIsScrubbing(false);
    
    // Resume the sync loop
    resumeSync?.();
    
    // Haptic feedback on capable devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [previewTime, playerEl, resumeSync]);

  // Touch event handlers
  React.useEffect(() => {
    if (!isScrubbing) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleScrubMoveInternal(e.touches[0].clientY);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleScrubMoveInternal(e.clientY);
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
  }, [isScrubbing, handleScrubMoveInternal, handleScrubEnd]);

  // Format time display
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if there's no active video
  if (!playerEl) {
    return null;
  }

  const duration = playerEl.duration || 0;

  const progressBar = (
    <div className="relative flex flex-col items-center h-full pointer-events-auto">
      {/* Bar sized to match engagement rail height */}
      {/* Track */}
      <div
        ref={trackRef}
        className="
          relative
          h-full
          rounded-full
          bg-white/10
          border border-white/20
          backdrop-blur-sm
          overflow-hidden
        "
        style={{
          pointerEvents: 'auto',
          touchAction: 'none',
          width: isScrubbing ? '8px' : '6px',
          transition: 'width 120ms ease, opacity 120ms ease',
          opacity: isScrubbing ? 1 : 0.8,
        }}
        onMouseDown={handleScrubStart}
        onTouchStart={handleScrubStart}
      >
        {/* Fill */}
        <div
          ref={fillRef}
          className="
            absolute
            bottom-0
            left-0
            w-full
            h-full
            will-change-transform
          "
          style={{
            transformOrigin: 'bottom',
            transform: 'scaleY(0)',
            background: accent ?? 'linear-gradient(to top, #6E9277 0%, rgba(255,255,255,0.6) 60%)',
            boxShadow: '0 0 8px rgba(110,146,119,0.6), 0 0 24px rgba(110,146,119,0.2)',
          }}
        />
      </div>

      {/* Thumbnail Preview */}
      {isScrubbing && (
        <div
          className="absolute right-full mr-2 w-[80px] h-[140px] rounded-xl bg-black/80 border border-white/15 shadow-xl overflow-hidden flex items-center justify-center"
          style={{
            top: `calc(${previewPosPx}px - 70px)`,
          }}
        >
          {/* Frame preview */}
          <video
            ref={previewVideoRef}
            src={playerEl.currentSrc}
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            style={{ backgroundColor: "#000" }}
          />
          
          {/* Time overlay */}
          <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white/80 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatTime(previewTime)} / {formatTime(duration)}
          </div>
        </div>
      )}
    </div>
  );

  // Render directly inline (no portal - parent wrapper handles positioning)
  return progressBar;
}
