import * as React from 'react';
import { createPortal } from 'react-dom';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';

/**
 * VideoProgressHUD - Fixed progress bar that anchors to bottom nav
 * 
 * Props:
 *  - videoRef: HTMLVideoElement ref of the currently focused/playing clip
 *  - accent?: optional CSS color for fill (defaults to white/60 on dark glass)
 */
export function VideoProgressHUD({
  videoRef,
  accent,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  accent?: string;
}) {
  // Reuse existing sync hook — NO changes to logic
  const { setProgressFillRef, progress } = useVideoProgressSync(videoRef.current);

  // Don't render if there's no active video
  if (!videoRef.current) {
    return null;
  }

  const progressBar = (
    <div
      aria-label="Video progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      // Fixed layer that anchors to nav top when visible, viewport bottom when hidden
      className="fixed left-0 right-0 h-[2px] z-[1100] pointer-events-none"
      style={{
        // Visible: bottom = chrome-h - shift = safe + h → sits on TOP edge of navbar
        // Hidden:  bottom = safe (fallback from max) → flush with viewport bottom
        bottom: `max(var(--safe-bottom), calc(var(--chrome-bottom-h) - var(--chrome-bottom-shift)))`,
      }}
    >
      {/* Track (dark glass) */}
      <div
        className="
          h-full
          bg-black/45 backdrop-blur-xl
          border-t border-white/10
        "
      >
        {/* Fill (GPU-friendly scaleX) */}
        <div
          ref={setProgressFillRef}
          className="h-full origin-left will-change-transform"
          style={{
            background: accent ?? 'rgba(255,255,255,0.6)',
          }}
        />
      </div>
    </div>
  );

  // Render via Portal to escape any transformed ancestors
  return typeof window !== 'undefined' ? createPortal(progressBar, document.body) : null;
}
