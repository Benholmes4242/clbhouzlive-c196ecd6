import * as React from 'react';
import { createPortal } from 'react-dom';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import Hls from 'hls.js';
import './vhud.css';
import { ScrubThumbnail } from './ScrubThumbnail';
import { formatTime } from './time';

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
  const knobRef = React.useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const offscreenVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const offscreenHlsRef = React.useRef<Hls | null>(null);
  
  // rAF-based smooth scrubbing refs
  const scrubTargetRatioRef = React.useRef<number | null>(null);
  const scrubShownRatioRef = React.useRef(0);
  const scrubLoopRef = React.useRef<number | null>(null);
  const isScrubLoopOnRef = React.useRef(false);
  const barRectRef = React.useRef<DOMRect | null>(null);
  
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
  
  // Build offscreen preview video when active video changes
  React.useEffect(() => {
    const main = attachedVideoRef.current;
    if (!main) return;

    // Duration for chip
    const onMeta = () => setDuration(main.duration || 0);
    main.addEventListener('loadedmetadata', onMeta);
    setDuration(main.duration || 0);

    // Create offscreen video (hidden, no layout thrash)
    const off = document.createElement('video');
    off.muted = true;
    off.playsInline = true;
    off.preload = 'auto';
    // IMPORTANT: set crossOrigin before setting src so canvas isn't tainted
    off.crossOrigin = (main as HTMLVideoElement).crossOrigin || 'anonymous';
    const src = (main as HTMLVideoElement).currentSrc || (main as HTMLVideoElement).src;
    if (src) off.src = src;
    off.load();
    // Attach offscreen video to DOM for Safari/iOS decode
    try {
      off.style.position = 'fixed';
      off.style.left = '-9999px';
      off.style.top = '0';
      off.style.width = '1px';
      off.style.height = '1px';
      off.style.opacity = '0';
      off.style.pointerEvents = 'none';
      document.body.appendChild(off);
    } catch {}
    offscreenVideoRef.current = off;

    // Set up a canvas we will draw into
    const canvas = document.createElement('canvas');
    // Match a sensible source resolution; keep tiny to avoid jank
    canvas.width = 320;
    canvas.height = 180;
    previewCanvasRef.current = canvas;

    // Poster fallback: draw poster immediately so thumbnail isn't black
    const poster = (main as HTMLVideoElement).poster;
    if (poster) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = poster;
    }

    return () => {
      main.removeEventListener('loadedmetadata', onMeta);
      off.pause();
      off.removeAttribute('src');
      // @ts-ignore
      off.load();
      try { off.remove(); } catch {}
      offscreenVideoRef.current = null;
      previewCanvasRef.current = null;
    };
  }, [attachedVideoRef.current]);
  

  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [previewTime, setPreviewTime] = React.useState(0);
  const previewTimeRef = React.useRef(0);
  const [previewPosPx, setPreviewPosPx] = React.useState(0);
  const [scrubRatio, setScrubRatio] = React.useState(0);
  const [isBarActive, setIsBarActive] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const activeTimeoutRef = React.useRef<number | null>(null);
  const bufferRef = React.useRef<HTMLDivElement | null>(null);
  const thumbRef = React.useRef<HTMLDivElement | null>(null);
  
  // Thumbnail UI state
  const [thumbVisible, setThumbVisible] = React.useState(false);
  const [thumbTop, setThumbTop] = React.useState(0);
  const [thumbLeft, setThumbLeft] = React.useState(0);
  const [thumbAlignLeft, setThumbAlignLeft] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const drawingRef = React.useRef(false);
  const announceRef = React.useRef<HTMLSpanElement | null>(null);
  
  // Long-press + velocity tracking refs
  const holdTimerRef = React.useRef<number | null>(null);
  const pressStartRef = React.useRef<{x: number; y: number; t: number} | null>(null);
  const lastMoveRef = React.useRef<{y: number; t: number} | null>(null);
  const hasExceededToleranceRef = React.useRef(false);
  const isEligibleToScrubRef = React.useRef(false);
  const barWrapperRef = React.useRef<HTMLDivElement | null>(null);
  
  // Ref to track scrubbing state for document listeners
  const isScrubbingRef = React.useRef(false);

  // Keep isScrubbingRef in sync with state
  React.useEffect(() => {
    isScrubbingRef.current = isScrubbing;
  }, [isScrubbing]);
  
  // Expose fillRef to sync hook with vertical orientation
  React.useEffect(() => {
    if (fillRef.current) {
      setProgressFillRef(fillRef.current);
      fillRef.current.style.transformOrigin = 'bottom';
    }
  }, [setProgressFillRef]);
  
  // Temporary diagnostic logging for playback progress
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && fillRef.current) {
      console.debug('[vhud:playback]', { 
        progress, 
        transform: fillRef.current.style.transform,
        isPlaying,
        isBarActive 
      });
    }
  }, [progress, isPlaying, isBarActive]);

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
  
  // Cache bar rect to prevent layout thrashing during scrub
  React.useLayoutEffect(() => {
    const cacheRect = () => {
      if (trackRef.current) {
        barRectRef.current = trackRef.current.getBoundingClientRect();
      }
    };
    cacheRect();
    window.addEventListener('resize', cacheRect);
    const ro = new ResizeObserver(cacheRect);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => {
      window.removeEventListener('resize', cacheRect);
      ro.disconnect();
    };
  }, []);
  // Smooth scrubbing rAF loop
  const startScrubLoop = React.useCallback(() => {
    if (isScrubLoopOnRef.current) return;
    isScrubLoopOnRef.current = true;
    
    const durationRef = { current: attachedVideoRef.current?.duration || 0 };
    
    const step = () => {
      const t = scrubTargetRatioRef.current;
      let s = scrubShownRatioRef.current;
      
      if (t != null) {
        // Smooth interpolation
        s = s + (t - s) * 0.25;
        scrubShownRatioRef.current = s;
        
        // Update fill
        if (fillRef.current) {
          fillRef.current.style.transform = `scaleY(${s})`;
        }
        
        // Update knob position (0 = bottom, 1 = top)
        if (knobRef.current) {
          knobRef.current.style.transform = `translateY(${(1 - s) * 100}%)`;
        }
        
        // Update preview time for thumbnail
        const newTime = s * durationRef.current;
        setPreviewTime(newTime);
        previewTimeRef.current = newTime;
        setScrubRatio(s);
      }
      
      scrubLoopRef.current = requestAnimationFrame(step);
    };
    scrubLoopRef.current = requestAnimationFrame(step);
  }, []);
  
  const stopScrubLoop = React.useCallback(() => {
    isScrubLoopOnRef.current = false;
    if (scrubLoopRef.current) cancelAnimationFrame(scrubLoopRef.current);
    scrubLoopRef.current = null;
  }, []);
  
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
    
    // Show thumbnail when press starts
    setThumbVisible(true);
    
    // Set initial target for smooth loop
    const rect = barRectRef.current;
    if (rect) {
      const rel = (clientY - rect.top) / rect.height;
      const ratio = Math.max(0, Math.min(1, 1 - rel));
      scrubTargetRatioRef.current = ratio;
    }
    
    // Do NOT preventDefault here - allow detection phase without blocking scroll
  }, [clearHold]);

  const handleScrubMoveInternal = React.useCallback((clientY: number) => {
    const rect = barRectRef.current;
    if (!rect) return;
    
    const currentVideo = attachedVideoRef.current;
    if (!currentVideo) return;
    
    // Compute target ratio (cheap)
    const rel = (clientY - rect.top) / rect.height;
    const ratio = Math.max(0, Math.min(1, 1 - rel));
    scrubTargetRatioRef.current = ratio;
    
    // Update thumbnail position
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const estWidth = 176;
    const estHeight = 112;
    
    let barX: number;
    if (railBox) {
      barX = window.innerWidth - railBox.right;
    } else {
      const safeRight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
      const fallbackRight = 64 + safeRight;
      barX = window.innerWidth - fallbackRight;
    }
    
    let top = clientY;
    let left = barX - 12;
    
    const alignLeft = left + estWidth + 8 > viewportW;
    setThumbAlignLeft(alignLeft);
    
    if (top + estHeight / 2 + 8 > viewportH) top = viewportH - estHeight / 2 - 8;
    if (top - estHeight / 2 - 8 < 0) top = estHeight / 2 + 8;
    
    setThumbTop(top);
    setThumbLeft(left);
    
    // Draw canvas frame
    const newTime = ratio * (currentVideo.duration || 0);
    const off = offscreenVideoRef.current;
    const canvas = previewCanvasRef.current;
    if (off && canvas && !drawingRef.current) {
      drawingRef.current = true;
      
      const draw = () => {
        const ctx = canvas.getContext('2d');
        if (ctx && off.videoWidth && off.videoHeight) {
          const cw = canvas.width;
          const ch = canvas.height;
          const vw = off.videoWidth;
          const vh = off.videoHeight;
          const scale = Math.min(cw / vw, ch / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          const dx = (cw - dw) / 2;
          const dy = (ch - dh) / 2;
          ctx.clearRect(0, 0, cw, ch);
          ctx.drawImage(off, dx, dy, dw, dh);
        }
        drawingRef.current = false;
      };
      
      const onSeeked = () => {
        off.removeEventListener('seeked', onSeeked);
        // @ts-ignore
        if (typeof off.requestVideoFrameCallback === 'function') {
          // @ts-ignore
          off.requestVideoFrameCallback(() => requestAnimationFrame(draw));
        } else {
          setTimeout(() => requestAnimationFrame(draw), 16);
        }
      };
      
      if (off.readyState < 2) {
        const onLoaded = () => {
          off.removeEventListener('loadeddata', onLoaded);
          off.addEventListener('seeked', onSeeked, { once: true });
          off.currentTime = newTime;
        };
        off.addEventListener('loadeddata', onLoaded, { once: true });
      } else {
        off.addEventListener('seeked', onSeeked, { once: true });
        off.currentTime = newTime;
      }
    }
    
    setThumbVisible(true);
  }, [railBox]);

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
      startScrubLoop();
      
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
  }, [isScrubbing, handleScrubMoveInternal, pauseSync, clearHold, startScrubLoop]);

  const handleScrubEnd = React.useCallback(() => {
    clearHold();
    pressStartRef.current = null;
    
    if (isScrubbing) {
      stopScrubLoop();
      
      // Commit seek with final ratio
      const ratio = scrubTargetRatioRef.current ?? scrubShownRatioRef.current;
      const currentVideo = attachedVideoRef.current;
      if (currentVideo && Number.isFinite(currentVideo.duration)) {
        currentVideo.currentTime = ratio * currentVideo.duration;
      }
      
      // Haptic feedback on scrub complete
      if (window.navigator.vibrate) {
        try { window.navigator.vibrate(30); } catch {}
      }
      
      setThumbVisible(false);
      setIsScrubbing(false);
      scrubTargetRatioRef.current = null;
      
      // Announce for screen readers
      if (announceRef.current) {
        announceRef.current.textContent = `Seeking to ${formatTime(previewTimeRef.current || 0)}`;
      }
      
      resumeSync?.();
      
      // Clear canvas
      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      // Cleanup offscreen resources
      if (offscreenHlsRef.current) {
        try { offscreenHlsRef.current.destroy(); } catch {}
        offscreenHlsRef.current = null;
      }
      
      // Restore scroll behavior on next frame (after listeners are cleaned up)
      requestAnimationFrame(() => {
        if (barWrapperRef.current?.style) {
          barWrapperRef.current.style.touchAction = 'pan-y';
        }
        
        // Defensive: ensure feed can scroll
        const feed = document.querySelector('.clubhouse-vertical-feed') as HTMLElement | null;
        if (feed && getComputedStyle(feed).touchAction !== 'pan-y') {
          feed.style.touchAction = 'pan-y';
        }
      });
      
      // Keep bar active for 1.5s after scrubbing ends
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
      }
      activeTimeoutRef.current = window.setTimeout(() => {
        setIsBarActive(false);
        activeTimeoutRef.current = null;
      }, 1500);
    } else {
      setThumbVisible(false);
    }
  }, [isScrubbing, resumeSync, clearHold, stopScrubLoop]);

  // Detection phase: passive document listeners for long-press detection (no scroll blocking)
  React.useEffect(() => {
    const pressStart = pressStartRef.current;
    if (!pressStart || isScrubbing) return; // Only during detection phase
    
    const onDetectionMove = (e: TouchEvent | MouseEvent) => {
      const clientY = 'touches' in e && e.touches.length > 0
        ? e.touches[0].clientY
        : 'clientY' in e
        ? e.clientY
        : 0;
      
      handleGlobalMove(clientY);
      // NO preventDefault here - allow normal scrolling during detection
    };
    
    const onDetectionEnd = () => {
      clearHold();
      pressStartRef.current = null;
      setThumbVisible(false);
    };
    
    // Passive listeners during detection phase
    document.addEventListener('touchmove', onDetectionMove, { passive: true });
    document.addEventListener('mousemove', onDetectionMove, { passive: true });
    document.addEventListener('touchend', onDetectionEnd);
    document.addEventListener('touchcancel', onDetectionEnd);
    document.addEventListener('mouseup', onDetectionEnd);
    
    return () => {
      document.removeEventListener('touchmove', onDetectionMove as any);
      document.removeEventListener('mousemove', onDetectionMove as any);
      document.removeEventListener('touchend', onDetectionEnd);
      document.removeEventListener('touchcancel', onDetectionEnd);
      document.removeEventListener('mouseup', onDetectionEnd);
    };
  }, [pressStartRef.current !== null, isScrubbing, handleGlobalMove, clearHold]);
  
  // Document listeners — only active while scrubbing
  React.useEffect(() => {
    if (!isScrubbing) return;
    
    // Stable handlers that check ref before preventing defaults
    const onDocTouchMove = (e: TouchEvent) => {
      // Only block scroll while actually scrubbing
      if (!isScrubbingRef.current) return;
      e.preventDefault(); // This blocks feed scroll — ONLY when scrubbing
      if (e.touches.length > 0) {
        handleGlobalMove(e.touches[0].clientY);
      }
    };
    
    const onDocMouseMove = (e: MouseEvent) => {
      if (!isScrubbingRef.current) return;
      handleGlobalMove(e.clientY);
    };
    
    const onDocEnd = () => {
      if (!isScrubbingRef.current) return;
      handleScrubEnd();
    };
    
    // Non-passive so we can preventDefault() while scrubbing
    document.addEventListener('touchmove', onDocTouchMove, { passive: false });
    document.addEventListener('mousemove', onDocMouseMove);
    document.addEventListener('touchend', onDocEnd);
    document.addEventListener('touchcancel', onDocEnd);
    document.addEventListener('mouseup', onDocEnd);
    
    return () => {
      document.removeEventListener('touchmove', onDocTouchMove as any);
      document.removeEventListener('mousemove', onDocMouseMove as any);
      document.removeEventListener('touchend', onDocEnd as any);
      document.removeEventListener('touchcancel', onDocEnd as any);
      document.removeEventListener('mouseup', onDocEnd as any);
    };
  }, [isScrubbing, handleGlobalMove, handleScrubEnd]);

  // Format time display - moved to external module for reuse
  // (No longer needed here as it's imported from './time')

  // Update thumb position during scrubbing
  React.useEffect(() => {
    if (!isScrubbing || !thumbRef.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const thumbPos = rect.height * (1 - scrubRatio);
    thumbRef.current.style.top = `${thumbPos - 6}px`; // Center the 12px thumb
  }, [isScrubbing, scrubRatio]);

  const progressBar = (!attachedVideo) ? null : (
    <div
      className={`vhud-wrap clubhouse-progress ${isScrubbing || isBarActive || isPlaying ? 'vhud-active' : 'vhud-idle'} ${isScrubbing ? 'vhud-scrubbing' : ''}`}
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
        {/* Visual track with frosted white design */}
        <div ref={trackRef} className="vhud-track">
          {/* Buffer hidden - not currently used */}
          
          {/* Fill - synced with video progress */}
          <div
            ref={fillRef}
            className="vhud-fill"
            style={{
              transform: isScrubbing ? undefined : `scaleY(${progress / 100})`,
              transition: isScrubbing ? 'none' : 'transform 60ms linear',
            }}
          />
          
          {/* Knob - visible during scrubbing */}
          <div ref={knobRef} className="vhud-knob" />
        </div>
      </div>

      {/* ARIA live region for screen readers */}
      <span
        ref={announceRef}
        aria-live="polite"
        style={{ position: 'fixed', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}
      />

      {/* Moving thumbnail (non-interactive) */}
      <ScrubThumbnail
        time={previewTime}
        visible={thumbVisible}
        top={thumbTop}
        left={thumbLeft}
        alignLeft={thumbAlignLeft}
        canvas={previewCanvasRef.current}
        duration={duration}
      />
    </div>
  );

  // Render into provided container, or portal to document.body
  if (typeof window === 'undefined') return null;
  if (container) return progressBar;
  return createPortal(progressBar, document.body);
}
