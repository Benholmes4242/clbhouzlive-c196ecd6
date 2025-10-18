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
  videoRef: React.RefObject<HTMLVideoElement>;
  accent?: string;
}) {
  // 1) Reuse existing sync hook — NO changes to logic
  const { setProgressFillRef, progress } = useVideoProgressSync(videoRef.current);

  // 2) Bottom nav awareness
  const { isVisible, height } = useBottomNavigation();

  // 3) Computed bottom: nav-visible => sit on top edge of nav
  //    nav-hidden   => sit on viewport bottom (safe-area included in both cases)
  const bottomPx = isVisible ? height : 0;

  return (
    <div
      aria-label="Video progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      // Fixed layer that follows bottom nav
      className="fixed left-0 w-[100vw] z-40 pointer-events-none"
      style={{
        // Animate "following" the nav with the same timing as the nav animation
        bottom: `calc(${bottomPx}px + env(safe-area-inset-bottom))`,
        transition: 'bottom 300ms ease-out',
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
