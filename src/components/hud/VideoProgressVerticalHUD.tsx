import * as React from 'react';
import { createPortal } from 'react-dom';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import Hls from 'hls.js';
import './vhud.css';

// Long-press + drag scrubbing configuration
const LONG_PRESS_MS = 350;              // delay before scrubbing can start
const MOVE_TOLERANCE_PX = 6;            // ignore tiny finger jitter pre-scrub
const CANCEL_TO_SCROLL_VELOCITY = 1.2;  // px/ms vertical speed ⇒ treat as scroll
const HIT_WIDTH_IDLE_PX = 28;           // shrink hit area while idle
const HIT_WIDTH_ACTIVE_PX = 44;         // slightly larger while scrubbing

/**
 * VideoProgressVerticalHUD - Vertical Pulse Line progress indicator with scrubbing
 * 
 * Now uses long-press + drag to scrub, preventing accidental scrubbing during feed scrolling.
 * 
 * Props:
 *  - videoRef: HTMLVideoElement ref of the currently focused/playing clip
 *  - accent?: optional CSS color for fill gradient
 *  - container?: optional container element to render into (default: portal to document.body)
 */
export function VideoProgressVerticalHUD({
  videoRef,
  accent,
  container,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  accent?: string;
  container?: HTMLElement | null;
}) {
  // Bind to the video element even if it appears after initial render
  const [attachedVideo, setAttachedVideo] = React.useState<HTMLVideoElement | null>(null);
  React.useEffect(() => {
    // Initial grab or late mount
    if (videoRef.current) {
      setAttachedVideo(videoRef.current);
    }
    // Light polling to detect when the feed switches to a new video element
    // (the ref object stays stable while .current changes)
    let last: HTMLVideoElement | null = null;
    const iv = window.setInterval(() => {
      const cur = videoRef.current;
      if (cur && cur !== last) {
        last = cur;
        setAttachedVideo(cur);
      }
    }, 120);

    return () => {
      window.clearInterval(iv);
    };
  }, [videoRef]);

  const { setProgressFillRef, progress, pauseSync, resumeSync } = useVideoProgressSync(attachedVideo);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const fillRef = React.useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const offscreenVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const offscreenHlsRef = React.useRef<Hls | null>(null);
  
  // Store the current attachedVideo in a ref to ensure callbacks always use the latest value
  const attachedVideoRef = React.useRef<HTMLVideoElement | null>(null);
  
  React.useEffect(() => {
    attachedVideoRef.current = attachedVideo;
    
    // Clear canvas when video changes to prevent showing stale thumbnails
    const canvas = previewCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [attachedVideo]);
  

  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [previewTime, setPreviewTime] = React.useState(0);
  const [previewPosPx, setPreviewPosPx] = React.useState(0);
  const [scrubRatio, setScrubRatio] = React.useState(0);
  const [isBarActive, setIsBarActive] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const activeTimeoutRef = React.useRef<number | null>(null);
  const bufferRef = React.useRef<HTMLDivElement | null>(null);
  const thumbRef = React.useRef<HTMLDivElement | null>(null);
  
  // Long-press + velocity tracking refs
  const holdTimerRef = React.useRef<number | null>(null);
  const pressStartRef = React.useRef<{x: number; y: number; t: number} | null>(null);
  const lastMoveRef = React.useRef<{y: number; t: number} | null>(null);
  const hasExceededToleranceRef = React.useRef(false);
  const isEligibleToScrubRef = React.useRef(false);
  const barWrapperRef = React.useRef<HTMLDivElement | null>(null);

  // Expose fillRef to sync hook with vertical orientation
  React.useEffect(() => {
    if (fillRef.current) {
      setProgressFillRef(fillRef.current);
      fillRef.current.style.transformOrigin = 'bottom';
    }
  }, [setProgressFillRef]);

  // Briefly activate bar on attach/play to ensure visibility on first video
  React.useEffect(() => {
    if (!attachedVideo) return;
    setIsBarActive(true);
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
    }
    activeTimeoutRef.current = window.setTimeout(() => {
      setIsBarActive(false);
      activeTimeoutRef.current = null;
    }, 1200);
    const onPlay = () => {
      setIsPlaying(true);
      setIsBarActive(true);
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = window.setTimeout(() => {
        setIsBarActive(false);
        activeTimeoutRef.current = null;
      }, 1200);
    };
    const onPause = () => setIsPlaying(false);
    attachedVideo.addEventListener('playing', onPlay);
    attachedVideo.addEventListener('pause', onPause);
    return () => {
      attachedVideo.removeEventListener('playing', onPlay);
      attachedVideo.removeEventListener('pause', onPause);
    };
  }, [attachedVideo]);

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
  // Helper: clear long-press timer
  const clearHold = React.useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const handleScrubStart = React.useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Check if initial touch is on an engagement rail button - if so, let it handle the event
    const target = e.target as HTMLElement;
    const isEngagementButton = target.closest('button[data-action="engagement"]') || 
                                target.closest('.engagement-rail');
    
    if (isEngagementButton) {
      return;
    }
    
    // Get touch/mouse coordinates
    const clientX = 'touches' in e && e.touches.length > 0
      ? e.touches[0].clientX
      : 'clientX' in e
      ? e.clientX
      : 0;
    const clientY = 'touches' in e && e.touches.length > 0
      ? e.touches[0].clientY
      : 'clientY' in e
      ? e.clientY
      : 0;
    
    const now = performance.now();
    pressStartRef.current = { x: clientX, y: clientY, t: now };
    lastMoveRef.current = { y: clientY, t: now };
    hasExceededToleranceRef.current = false;
    isEligibleToScrubRef.current = false;
    
    // ARM long-press timer - scrubbing only allowed after this fires
    clearHold();
    holdTimerRef.current = window.setTimeout(() => {
      isEligibleToScrubRef.current = true;
      // Optional: light haptic feedback
      if ('vibrate' in navigator) {
        try { navigator.vibrate(10); } catch {}
      }
    }, LONG_PRESS_MS);
    
    // Do NOT preventDefault here - allow feed to scroll if user just swipes
  }, [clearHold]);

  const handleScrubMoveInternal = React.useCallback((clientY: number) => {
    if (!trackRef.current) return;
    
    // Use the ref to ensure we always have the latest video element
    const currentVideo = attachedVideoRef.current;
    if (!currentVideo) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const ratio = clamp01(1 - (relativeY / rect.height));
    
    const newTime = (currentVideo?.duration || 0) * ratio;
    setPreviewTime(newTime);
    setPreviewPosPx(relativeY);
    setScrubRatio(ratio);
    
    // Drive fill immediately for visual feedback
    if (fillRef.current) {
      fillRef.current.style.transform = `scaleY(${ratio})`;
    }
    
    // Capture frame from the current active video
    const mainVideo = currentVideo;
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
        
        // Wait for a rendered frame before drawing to canvas
        const draw = () => {
          if (mainVideo.readyState >= 2) {
            ctx.drawImage(mainVideo, 0, 0, canvas.width, canvas.height);
          }
          // Restore original playback state
          mainVideo.currentTime = originalTime;
          if (!originalPaused) {
            mainVideo.play().catch(() => {});
          }
        };

        const rvfc = (mainVideo as any).requestVideoFrameCallback;
        if (typeof rvfc === 'function') {
          try {
            rvfc(() => draw());
          } catch {
            requestAnimationFrame(draw);
          }
        } else {
          requestAnimationFrame(draw);
        }
      }
    }
  }, [clamp01]);

  // Global move handler with velocity detection and scrub activation
  const handleGlobalMove = React.useCallback((clientY: number) => {
    const now = performance.now();
    const start = pressStartRef.current;
    if (!start) return;
    
    // Velocity check: fast vertical swipe = scroll intent, cancel scrub
    if (lastMoveRef.current) {
      const dy = Math.abs(clientY - lastMoveRef.current.y);
      const dt = Math.max(1, now - lastMoveRef.current.t);
      const v = dy / dt;
      if (!isScrubbing && v > CANCEL_TO_SCROLL_VELOCITY) {
        // This is a fast scroll gesture - cancel scrub arming
        clearHold();
        isEligibleToScrubRef.current = false;
        return;
      }
    }
    lastMoveRef.current = { y: clientY, t: now };
    
    const totalDy = Math.abs(clientY - start.y);
    if (!hasExceededToleranceRef.current && totalDy > MOVE_TOLERANCE_PX) {
      hasExceededToleranceRef.current = true;
    }
    
    // Start scrubbing only after long-press has fired AND user has moved past tolerance
    if (!isScrubbing && isEligibleToScrubRef.current && hasExceededToleranceRef.current) {
      // Now we commit to scrubbing: block native scroll while active
      setIsScrubbing(true);
      pauseSync?.();
      setIsBarActive(true);
      
      // Clear any pending fade timeout
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
        activeTimeoutRef.current = null;
      }
      
      // Block scroll on the bar wrapper
      if (barWrapperRef.current?.style) {
        barWrapperRef.current.style.touchAction = 'none';
      }
    }
    
    if (isScrubbing) {
      handleScrubMoveInternal(clientY);
    }
  }, [isScrubbing, handleScrubMoveInternal, pauseSync, clearHold]);

  const handleScrubEnd = React.useCallback(() => {
    clearHold();
    pressStartRef.current = null;
    
    if (isScrubbing) {
      // Commit seek only if we were actually scrubbing
      const currentVideo = attachedVideoRef.current;
      if (currentVideo) {
        currentVideo.currentTime = previewTime;
      }
      
      // Haptic feedback on scrub complete
      if (window.navigator.vibrate) {
        try { window.navigator.vibrate(30); } catch {}
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
      
      // Restore scroll behavior on bar wrapper
      if (barWrapperRef.current?.style) {
        barWrapperRef.current.style.touchAction = 'pan-y';
      }
      
      // Keep bar active for 1.5s after scrubbing ends
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
      }
      activeTimeoutRef.current = window.setTimeout(() => {
        setIsBarActive(false);
        activeTimeoutRef.current = null;
      }, 1500);
    } else {
      // Not scrubbing - this was just a tap/scroll, nothing to commit
    }
  }, [isScrubbing, previewTime, resumeSync, clearHold]);

  // Global move/end listeners - always active once press starts
  React.useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleGlobalMove(e.touches[0].clientY);
        // Only prevent default if we're scrubbing or eligible to scrub
        if (isScrubbing || isEligibleToScrubRef.current) {
          e.preventDefault();
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleGlobalMove(e.clientY);
    };

    const handleEnd = () => {
      handleScrubEnd();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleEnd);
    document.addEventListener('mouseup', handleEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, [handleGlobalMove, handleScrubEnd, isScrubbing]);

  // Format time display
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = attachedVideo?.duration || 0;

  // Update thumb position during scrubbing
  React.useEffect(() => {
    if (!isScrubbing || !thumbRef.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const thumbPos = rect.height * (1 - scrubRatio);
    thumbRef.current.style.top = `${thumbPos - 6}px`; // Center the 12px thumb
  }, [isScrubbing, scrubRatio]);

  const progressBar = (!attachedVideo) ? null : (
    <div
      className={`vhud-wrap ${isScrubbing || isBarActive ? 'vhud-active' : 'vhud-idle'}`}
      style={{
        right: railBox ? `${railBox.right}px` : 'calc(env(safe-area-inset-right, 0px) + 64px)',
        top: railBox ? `${railBox.top}px` : '25%',
        height: railBox ? `${railBox.height}px` : '168px',
      }}
    >
      {/* Hit area for long-press + drag scrubbing */}
      <div
        ref={barWrapperRef}
        className="vhud-hit"
        style={{
          width: isScrubbing ? `${HIT_WIDTH_ACTIVE_PX}px` : `${HIT_WIDTH_IDLE_PX}px`,
        }}
        onMouseDown={handleScrubStart}
        onTouchStart={handleScrubStart}
      >
        {/* Visual track with frosted aqua design */}
        <div ref={trackRef} className="vhud-track">
          {/* Buffer (optional - can show loaded portion) */}
          <div ref={bufferRef} className="vhud-buffer" style={{ height: '0%' }} />
          
          {/* Fill - synced with video progress */}
          <div
            ref={fillRef}
            className="vhud-fill"
            style={{
              transform: isScrubbing ? undefined : `scaleY(${progress / 100})`,
              transition: isScrubbing ? 'none' : 'transform 60ms linear',
            }}
          />
          
          {/* Thumb - appears during scrubbing */}
          <div ref={thumbRef} className="vhud-thumb" />
          
          {/* Subtle glow when playing */}
          {isPlaying && <div className="vhud-glow" />}
        </div>
      </div>

      {/* Thumbnail Preview */}
      {isScrubbing && (
        <div
          className="vhud-chip"
          style={{
            top: `${previewPosPx}px`,
            transform: 'translateY(-50%)',
            width: '80px',
            height: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '8px',
          }}
        >
          {/* Frame preview using canvas */}
          <canvas
            ref={previewCanvasRef}
            className="w-full rounded-lg"
            style={{ 
              backgroundColor: "#000",
              aspectRatio: '9/16',
              maxHeight: '120px',
            }}
          />
          
          {/* Time overlay */}
          <div className="text-center text-[10px] text-white/90 font-medium">
            {formatTime(previewTime)} / {formatTime(duration)}
          </div>
        </div>
      )}
    </div>
  );

  // Render into provided container, or portal to document.body
  if (typeof window === 'undefined') return null;
  if (container) return progressBar;
  return createPortal(progressBar, document.body);
}
