import type { CSSProperties } from 'react';

import { Z } from '@/config/zIndex';

interface StickySafeAreaScrimProps {
  visible: boolean;
  /** The exact paint used by the topmost sticky host. */
  background: CSSProperties['background'];
  /** Match the host's own background transition. Opaque hosts use `none`. */
  transition?: CSSProperties['transition'];
}

/**
 * The single opt-in notch scrim for immersive pages with sticky chrome.
 * It never owns inset spacing: it only paints the fixed var(--sat) strip while
 * the host's sentinel says the chrome is stuck.
 */
export function StickySafeAreaScrim({
  visible,
  background,
  transition = 'none',
}: StickySafeAreaScrimProps) {
  return (
    <div
      aria-hidden="true"
      data-visible={visible ? 'true' : 'false'}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--sat, env(safe-area-inset-top, 0px))',
        background,
        opacity: visible ? 1 : 0,
        transition,
        pointerEvents: 'none',
        zIndex: Z.stickySafeArea,
      }}
    />
  );
}

export default StickySafeAreaScrim;