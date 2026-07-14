// ImmersiveSuccessShell - full-bleed dark overlay used by post + review
// success screens. Modeled after AchievementImmersive:
//  - fixed inset, zIndex 12500 (clears BottomSheet ~1401, Z.sheet 12003,
//    Z.toast 12000; below Z.logHud 13000).
//  - radial tint over #0A0B0D base, blurred backdrop.
//  - tap-anywhere closes; children are stop-propagation wrapped so taps
//    on the island do not dismiss.
//  - muted "TAP ANYWHERE TO CLOSE" footer hint.

import React from 'react';
import { createPortal } from 'react-dom';

interface Props {
  /** Hex accent used for the radial tint. Defaults to brand amber. */
  tint?: string;
  onClose: () => void;
  children: React.ReactNode;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '247,147,30';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export function ImmersiveSuccessShell({ tint = '#F7931E', onClose, children }: Props) {
  const rgb = hexToRgb(tint);
  const stop = (e: React.MouseEvent | React.TouchEvent) => e.stopPropagation();

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 12500,
        background: `radial-gradient(ellipse 120% 90% at 50% 16%, rgba(${rgb},0.12) 0%, rgba(${rgb},0.04) 32%, #0A0B0D 62%), #0A0B0D`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: 'rgba(255,255,255,0.96)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        overflow: 'auto',
      }}
    >
      <div
        onClick={stop}
        onTouchStart={stop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
          textAlign: 'center',
          fontSize: 10.5,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Tap anywhere to close
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(overlay, document.body) : null;
}

export default ImmersiveSuccessShell;
