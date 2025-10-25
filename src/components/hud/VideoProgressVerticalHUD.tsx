import * as React from 'react';
import { createPortal } from 'react-dom';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import Hls from 'hls.js';

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
  const { setProgressFillRef, progress, pauseSync, resumeSync } = useVideoProgressSync(videoRef.current);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const fillRef = React.useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const offscreenVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const offscreenHlsRef = React.useRef<Hls | null>(null);
  

  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [previewTime, setPreviewTime] = React.useState(0);
  const [previewPosPx, setPreviewPosPx] = React.useState(0);
  const [scrubRatio, setScrubRatio] = React.useState(0);
  const [isBarActive, setIsBarActive] = React.useState(false);
  const activeTimeoutRef = React.useRef<number | null>(null);

  // Expose fillRef to sync hook with vertical orientation
  React.useEffect(() => {
    if (fillRef.current) {
      setProgressFillRef(fillRef.current);
      fillRef.current.style.transformOrigin = 'bottom';
    }
  }, [setProgressFillRef]);

  // Helper: clamp [0..1]
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

  // Measure Engagement Rail and align HUD to it
  const [railBox, setRailBox] = React.useState<{ top: number; height: number; right: number } | null>(null);

  const recalcRailBox = React.useCallback(() => {
    const rail = document.querySelector('.engagement-rail.is-visible[data-control="action-rail"]') as HTMLElement | null;
    if (!rail) {
      setRailBox(null);
      return;
    }
    const buttons = Array.from(rail.querySelectorAll('button[data-action="engagement"]')) as HTMLElement[];
    if (buttons.length === 0) {
      setRailBox(null);
      return;
    }
    const topRect = buttons[0].getBoundingClientRect();
    const bottomRect = buttons[buttons.length - 1].getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const top = topRect.top;
    const bottom = bottomRect.bottom;
    const height = Math.max(0, bottom - top);
    const right = Math.max(8, window.innerWidth - railRect.left + 8); // 8px gap to the left of rail
    setRailBox({ top, height, right });
  }, []);

  React.useLayoutEffect(() => {
    recalcRailBox();
    const onResize = () => recalcRailBox();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    const rail = document.querySelector('.engagement-rail.is-visible[data-control="action-rail"]') as HTMLElement | null;
    const ro = new ResizeObserver(onResize);
    if (rail) ro.observe(rail);

    const mo = new MutationObserver(onResize);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      ro.disconnect();
      mo.disconnect();
    };
  }, [recalcRailBox]);
  const handleScrubStart = React.useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Check if initial touch is on an engagement rail button - if so, let it handle the event
    const target = e.target as HTMLElement;
    const isEngagementButton = target.closest('button[data-action="engagement"]') || 
                                target.closest('.engagement-rail');
    
    if (isEngagementButton) {
      // Don't prevent default or stop propagation - let the button handle it
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any pending fade timeout
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = null;
    }
    
    // Activate bar
    setIsBarActive(true);
    
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
    if (!trackRef.current || !videoRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const ratio = clamp01(1 - (relativeY / rect.height));
    
    const newTime = (videoRef.current.duration || 0) * ratio;
    setPreviewTime(newTime);
    setPreviewPosPx(relativeY);
    setScrubRatio(ratio);
    
    // Drive fill immediately for visual feedback
    if (fillRef.current) {
      fillRef.current.style.transform = `scaleY(${ratio})`;
    }
    
    // Approach 1: Try direct frame capture from main video (fastest, works if currentTime can be set)
    const mainVideo = videoRef.current;
    const canvas = previewCanvasRef.current;
    
    if (canvas && mainVideo) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas dimensions to match aspect ratio
        const aspectRatio = mainVideo.videoWidth / mainVideo.videoHeight;
        if (aspectRatio && isFinite(aspectRatio)) {
          canvas.width = 80;
          canvas.height = Math.round(80 / aspectRatio);
        } else {
          canvas.width = 80;
          canvas.height = 140;
        }
        
        // Temporarily seek main video to preview time, capture frame, then restore
        const originalTime = mainVideo.currentTime;
        const originalPaused = mainVideo.paused;
        
        mainVideo.currentTime = newTime;
        
        // Wait a brief moment for the frame to update, then draw
        requestAnimationFrame(() => {
          if (mainVideo.readyState >= 2) { // HAVE_CURRENT_DATA
            ctx.drawImage(mainVideo, 0, 0, canvas.width, canvas.height);
          }
          
          // Restore original playback state
          mainVideo.currentTime = originalTime;
          if (!originalPaused) {
            mainVideo.play().catch(() => {});
          }
        });
      }
    }
  }, [videoRef, clamp01]);

  const handleScrubEnd = React.useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = previewTime;
    }
    setIsScrubbing(false);
    
    // Resume the sync loop
    resumeSync?.();
    
    // Clear canvas
    const canvas = previewCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Cleanup offscreen resources if any
    if (offscreenHlsRef.current) {
      try { offscreenHlsRef.current.destroy(); } catch {}
      offscreenHlsRef.current = null;
    }
    
    // Keep bar active for 1.5s after scrubbing ends
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
    }
    activeTimeoutRef.current = window.setTimeout(() => {
      setIsBarActive(false);
      activeTimeoutRef.current = null;
    }, 1500);
  }, [previewTime, videoRef, resumeSync]);

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
  if (!videoRef.current) {
    return null;
  }

  const duration = videoRef.current.duration || 0;

  const progressBar = (
    <div
      className="pointer-events-none fixed z-[29] flex items-stretch justify-end"
      style={{
        right: railBox ? `${railBox.right}px` : 'calc(env(safe-area-inset-right, 0px) + 64px)',
        top: railBox ? `${railBox.top}px` : '25%',
        height: railBox ? `${railBox.height}px` : '168px',
      }}
    >
      {/* Invisible hit area for comfortable scrubbing - 44px wide */}
      <div
        className="relative"
        style={{
          pointerEvents: 'auto',
          touchAction: 'none',
          width: '44px',
          height: '100%',
        }}
        onMouseDown={handleScrubStart}
        onTouchStart={handleScrubStart}
      >
        {/* Visual track - slim and positioned to the right, expands when active */}
        <div
          ref={trackRef}
          className="absolute right-0 top-0 rounded-full bg-white/7 backdrop-blur-sm overflow-hidden"
          style={{
            width: isScrubbing ? '6px' : '3px',
            height: '100%',
            opacity: isScrubbing || isBarActive ? 1 : 0.4,
            transition: 'opacity 120ms ease, width 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Fill */}
          <div
            ref={fillRef}
            className="absolute bottom-0 left-0 w-full origin-bottom will-change-transform"
            style={{
              height: '100%',
              background: accent ?? 'linear-gradient(to top, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
              boxShadow: '0 0 6px rgba(255,255,255,0.4)',
              // During scrubbing, transform is set directly in handleScrubMoveInternal for smooth updates
              // Otherwise use synced progress from the hook
              transform: isScrubbing ? undefined : `scaleY(${progress / 100})`,
              transition: isScrubbing ? 'none' : 'transform 60ms linear',
            }}
          />
        </div>
      </div>

      {/* Thumbnail Preview */}
      {isScrubbing && (
        <div
          className="absolute right-full mr-2 w-[80px] h-[140px] rounded-xl bg-black/80 border border-white/15 shadow-xl overflow-hidden flex items-center justify-center"
          style={{
            top: `calc(${previewPosPx}px - 70px)`,
          }}
        >
          {/* Frame preview using canvas */}
          <canvas
            ref={previewCanvasRef}
            className="w-full h-full object-cover rounded-lg"
            style={{ backgroundColor: "#000" }}
          />
          
          {/* Time overlay */}
          <div className="absolute bottom-1 left-1 right-1 text-center text-[10px] text-white/90 font-medium bg-black/60 rounded px-1 py-0.5">
            {formatTime(previewTime)} / {formatTime(duration)}
          </div>
        </div>
      )}
    </div>
  );

  // Render via Portal to escape any transformed ancestors
  return typeof window !== 'undefined' ? createPortal(progressBar, document.body) : null;
}
