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

  // Diagnostics: capture computed CSS and environment info (temporary)
  const hudRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const root = document.documentElement;
    const metaViewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    const sample = (label: string) => {
      const el = hudRef.current;
      const cs = el ? getComputedStyle(el) : null;
      const rs = getComputedStyle(root);
      const values = {
        label,
        bottom: cs?.getPropertyValue('bottom')?.trim(),
        zIndex: cs?.getPropertyValue('z-index')?.trim(),
        '--safe-bottom': rs.getPropertyValue('--safe-bottom').trim(),
        '--chrome-bottom-h': rs.getPropertyValue('--chrome-bottom-h').trim(),
        '--chrome-bottom-shift': rs.getPropertyValue('--chrome-bottom-shift').trim(),
        viewportMeta: metaViewport,
        displayMode: (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone ? 'standalone' : 'browser',
        ua: navigator.userAgent,
      };
      console.log('[VideoProgressHUD][diagnostics]', values);
    };
    sample('init');
    const mo = new MutationObserver(() => sample('body-class-change'));
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const onResize = () => sample('resize');
    const onOrientation = () => sample('orientationchange');
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrientation);
    return () => {
      mo.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientation);
    };
  }, []);

  // Don't render if there's no active video
  if (!videoRef.current) {
    return null;
  }

  const progressBar = (
    <div
      ref={hudRef}
      aria-label="Video progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      // Fixed layer that anchors to nav top when visible, viewport bottom when hidden
      className="fixed left-0 right-0 h-[2px] z-[1100] pointer-events-none"
      style={{
        // Visible: bottom = navHeight (no safe area)
        // Hidden:  bottom = 0px (flush to viewport)
        bottom: `max(0px, calc(var(--chrome-bottom-h) - var(--chrome-bottom-shift) - var(--safe-bottom)))`,
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
