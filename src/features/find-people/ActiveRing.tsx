/**
 * ACTIVE RING — a 1.5px gradient ring and 2px surface-coloured gap round an
 * avatar whose account posted, reviewed or played in the last 24 hours
 * (active-ring-signed-off.html). Inactive slots get 3.5px of clear padding so
 * every slot is the same size and nothing shifts when the data arrives.
 */
import type { ReactNode } from 'react';

import { PAGE_CANVAS } from '@/lib/tokens/surfaces';

export const ACTIVE_RING_GRADIENT = 'linear-gradient(135deg,#FFB547,#F7931E 45%,#E8590C)';
const CARD_SURFACE = '#17171B';

export function ActiveRing({
  active,
  surface,
  children,
}: {
  active: boolean;
  surface: 'card' | 'canvas';
  children: ReactNode;
}) {
  if (!active) {
    return (
      <span data-active-ring="off" style={{ display: 'flex', flex: 'none', lineHeight: 0, padding: 3.5, borderRadius: '34%' }}>
        {children}
      </span>
    );
  }
  return (
    <span
      data-active-ring="on"
      style={{ display: 'flex', flex: 'none', lineHeight: 0, padding: 1.5, borderRadius: '34%', background: ACTIVE_RING_GRADIENT }}
    >
      <span
        data-active-ring-gap=""
        style={{
          display: 'flex',
          lineHeight: 0,
          padding: 2,
          borderRadius: '34%',
          background: surface === 'card' ? CARD_SURFACE : PAGE_CANVAS,
        }}
      >
        {children}
      </span>
    </span>
  );
}

export default ActiveRing;
