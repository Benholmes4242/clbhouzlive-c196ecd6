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
  const previewVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const previewHlsRef = React.useRef<Hls | null>(null);
  const previewReadyRef = React.useRef(false);
  

  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [previewTime, setPreviewTime] = React.useState(0);
  const [previewPosPx, setPreviewPosPx] = React.useState(0);
  const [scrubRatio, setScrubRatio] = React.useState(0);

  // Expose fillRef to sync hook with vertical orientation
  React.useEffect(() => {
    if (fillRef.current) {
      setProgressFillRef(fillRef.current);
      fillRef.current.style.transformOrigin = 'bottom';
    }
  }, [setProgressFillRef]);

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
    
    // Update preview video frame with support for HLS
    const pv = previewVideoRef.current;
    const srcEl = videoRef.current;
    if (!pv || !srcEl) return;

    const src = srcEl.currentSrc || srcEl.src || '';
    pv.muted = true;
    pv.setAttribute('playsinline', '');

    const isM3U8 = src.includes('.m3u8');

    if (isM3U8) {
      const canNativeHls = pv.canPlayType('application/vnd.apple.mpegurl') !== '';
      if (canNativeHls) {
        if (pv.src !== src) {
          pv.src = src;
          pv.load();
          previewReadyRef.current = false;
          const onLM = () => {
            previewReadyRef.current = true;
            pv.currentTime = newTime;
            pv.pause();
            pv.removeEventListener('loadedmetadata', onLM);
          };
          pv.addEventListener('loadedmetadata', onLM);
        } else if (pv.readyState >= 1) { // HAVE_METADATA
          pv.currentTime = newTime;
          pv.pause();
        }
      } else if (Hls.isSupported()) {
        if (!previewHlsRef.current) {
          const hls = new Hls({
            autoStartLoad: true,
            enableWorker: true,
            lowLatencyMode: true,
          });
          previewHlsRef.current = hls;
          hls.attachMedia(pv);
          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls.loadSource(src);
          });
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            previewReadyRef.current = true;
            pv.currentTime = newTime;
            pv.pause();
          });
          // Optional: ignore errors for preview
          hls.on(Hls.Events.ERROR, () => {});
        } else {
          if (previewReadyRef.current || pv.readyState >= 1) {
            pv.currentTime = newTime;
            pv.pause();
          }
        }
      } else {
        // No HLS support available; keep poster/black fallback
      }
    } else {
      // MP4 or other natively supported
      if (pv.src !== src) {
        pv.src = src;
        pv.load();
        const onLM = () => {
          pv.currentTime = newTime;
          pv.pause();
          pv.removeEventListener('loadedmetadata', onLM);
        };
        pv.addEventListener('loadedmetadata', onLM);
      } else if (pv.readyState >= 1) {
        pv.currentTime = newTime;
        pv.pause();
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

    // Cleanup preview resources
    if (previewHlsRef.current) {
      try { previewHlsRef.current.destroy(); } catch {}
      previewHlsRef.current = null;
    }
    previewReadyRef.current = false;
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
      className="pointer-events-none fixed z-[1100] flex items-stretch justify-end"
      style={{
        right: 'calc(env(safe-area-inset-right, 0px) + 8px)',
        top: '25%',
        bottom: '25%',
      }}
    >
      {/* Track */}
      <div
        ref={trackRef}
        className={`
          relative
          rounded-full
          bg-white/10
          backdrop-blur-sm
          border border-white/20
          overflow-hidden
          ${isScrubbing ? 'opacity-100' : 'opacity-80'}
        `}
        style={{
          pointerEvents: 'auto',
          touchAction: 'none',
          width: isScrubbing ? '8px' : '6px',
          transition: 'width 120ms ease, opacity 120ms ease',
        }}
        onMouseDown={handleScrubStart}
        onTouchStart={handleScrubStart}
      >
        {/* Fill */}
        <div
          ref={fillRef}
          className="absolute bottom-0 left-0 w-full origin-bottom will-change-transform"
          style={{
            height: '100%',
            background: accent ?? 'linear-gradient(to top, rgba(110,146,119,1) 0%, rgba(255,255,255,0.6) 60%)',
            boxShadow: '0 0 8px rgba(110,146,119,0.6), 0 0 24px rgba(110,146,119,0.2)',
            // Use scrubRatio when scrubbing for immediate visual feedback, otherwise use synced progress
            transform: `scaleY(${isScrubbing ? scrubRatio : progress / 100})`,
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
            muted
            playsInline
            preload="metadata"
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

  // Render via Portal to escape any transformed ancestors
  return typeof window !== 'undefined' ? createPortal(progressBar, document.body) : null;
}
