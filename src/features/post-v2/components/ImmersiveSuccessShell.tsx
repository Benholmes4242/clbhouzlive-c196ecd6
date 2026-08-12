// ImmersiveSuccessShell - full-bleed dark overlay used by post + review
// success screens. Modeled after AchievementImmersive.
//  - fixed inset, zIndex 12500 (clears BottomSheet ~1401, Z.sheet 12003,
//    Z.toast 12000; below Z.logHud 13000).
//  - amber radial tint over the shell base, blurred backdrop.
//  - When onTapClose is provided, tapping the overlay dismisses; children
//    are automatically stop-propagation wrapped so taps on the island do
//    not close. Omit onTapClose for a destination screen with real actions.

import React, { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { setStatusBarStyleColor } from '@/hooks/useMedianStatusBar';
import { applyRouteChrome } from '@/lib/routeChrome';
import { CT } from '@/features/_shared/composerTokens';

/** hex -> "r,g,b" for the radial's rgba() stops. */
function rgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

interface Props {
  /**
   * Accent of the radial tint. Same geometry, stops and opacities whatever it
   * is - only the rgb moves. Defaults to amber so existing callers do not.
   */
  accent?: string;
  /** Provide to make the overlay tap-anywhere-to-close. */
  onTapClose?: () => void;
  /** When true, a muted "TAP ANYWHERE TO CLOSE" hint renders at the bottom. */
  showTapHint?: boolean;
  /** Adds a scroll-safe padded content wrapper; set false for full-bleed. */
  padded?: boolean;
  children: React.ReactNode;
}

export function ImmersiveSuccessShell({
  accent = CT.amber,
  onTapClose,
  showTapHint,
  padded = true,
  children,
}: Props) {
  const rgb = rgbTriplet(accent);

  // Full-bleed into the notch: transparent shield + white status-bar icons for
  // the dark overlay. Mirrors FullscreenFeedOverlay. useLayoutEffect so the
  // shield/statusbar mutations land before first paint. Restore re-resolves
  // the underlying route chrome on close (force=true: we mutated behind the
  // idempotency cache).
  useLayoutEffect(() => {
    const shield = document.getElementById('safe-area-shield');
    if (shield) shield.style.backgroundColor = 'transparent';
    try { setStatusBarStyleColor('light', '00000000'); } catch { /* status bar best-effort */ }
    return () => {
      if (shield) shield.style.backgroundColor = 'transparent';
      try { applyRouteChrome(window.location.pathname, true); } catch { /* chrome re-resolve best-effort */ }
    };
  }, []);

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onTapClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 12500,
        background:
          `radial-gradient(ellipse 120% 90% at 50% 16%, rgba(${rgb},0.14) 0%, rgba(${rgb},0.05) 32%, ${CT.shellBg} 62%), ${CT.shellBg}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: 'rgba(255,255,255,0.96)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: padded ? '48px 20px 72px' : 0,
          width: '100%',
        }}
      >
        {children}
      </div>

      {showTapHint && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
            textAlign: 'center',
            fontSize: 10.5,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          Tap anywhere to close
        </div>
      )}
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(overlay, document.body) : null;
}

export default ImmersiveSuccessShell;
