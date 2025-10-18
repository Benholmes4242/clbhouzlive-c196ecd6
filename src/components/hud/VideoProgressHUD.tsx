import * as React from 'react';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
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
  // 1) Reuse existing sync hook — NO changes to logic
  const { setProgressFillRef, progress } = useVideoProgressSync(videoRef.current);

  // 2) Bottom nav awareness (for fallback only)
  const { isVisible, height } = useBottomNavigation();

  // Don't render if there's no active video
  if (!videoRef.current) {
    return null;
  }

  return (
    <div
      aria-label="Video progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      // Fixed layer that anchors to nav when visible, viewport when hidden
      className="fixed left-0 w-[100vw] z-40 pointer-events-none transition-[bottom] duration-300 ease-out"
      style={{
        // Anchored to nav top when visible; to viewport bottom when hidden
        bottom: `calc(
          env(safe-area-inset-bottom, 0px) +
          max(0px, var(--chrome-bottom-height, 0px) - var(--chrome-bottom-shift, 0px))
        )`,
      }}
    >
      {/* Track (dark glass) */}
      <div
        className="
          mx-0 h-[2px]
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
}
