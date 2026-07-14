// ImmersiveSuccessShell - full-bleed dark overlay used by post + review
// success screens. Modeled after AchievementImmersive.
//  - fixed inset, zIndex 12500 (clears BottomSheet ~1401, Z.sheet 12003,
//    Z.toast 12000; below Z.logHud 13000).
//  - amber radial tint over #0A0B0D base, blurred backdrop.
//  - When onTapClose is provided, tapping the overlay dismisses; children
//    are automatically stop-propagation wrapped so taps on the island do
//    not close. Omit onTapClose for a destination screen with real actions.

import React from 'react';
import { createPortal } from 'react-dom';

interface Props {
  /** Provide to make the overlay tap-anywhere-to-close. */
  onTapClose?: () => void;
  /** When true, a muted "TAP ANYWHERE TO CLOSE" hint renders at the bottom. */
  showTapHint?: boolean;
  /** Adds a scroll-safe padded content wrapper; set false for full-bleed. */
  padded?: boolean;
  children: React.ReactNode;
}

export function ImmersiveSuccessShell({ onTapClose, showTapHint, padded = true, children }: Props) {
  const stop = (e: React.MouseEvent | React.TouchEvent) => e.stopPropagation();

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
          'radial-gradient(ellipse 120% 90% at 50% 16%, rgba(247,147,30,0.14) 0%, rgba(247,147,30,0.05) 32%, #0A0B0D 62%), #0A0B0D',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: 'rgba(255,255,255,0.96)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={onTapClose ? stop : undefined}
        onTouchStart={onTapClose ? stop : undefined}
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
            fontWeight: 800,
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
