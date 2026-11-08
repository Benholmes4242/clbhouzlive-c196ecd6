/**
 * ACTIVE RING — a 1.5px gradient ring and 2px surface-coloured gap round an
 * avatar whose account posted, reviewed or played in the last 48 hours
 * (active-ring-signed-off.html). Inactive card slots get card padding so
 * every slot is the same size and nothing shifts when the data arrives.
 * Rail and Find people share this ring, activeRingRules and one batched
 * useRecentActivity read per surface, so they cannot drift or fetch per card.
 */
import type { ReactNode } from 'react';

import { PAGE_CANVAS } from '@/lib/tokens/surfaces';

export const ACTIVE_RING_GRADIENT = 'linear-gradient(135deg,#FFB547,#F7931E 45%,#E8590C)';
const CARD_SURFACE = '#17171B';

export function ActiveRing({
  active,
  surface,
  gapColor,
  ringColor,
  children,
}: {
  active: boolean;
  surface: 'card' | 'canvas';
  /** Opt-in picker material; defaults preserve activity surfaces. */
  gapColor?: string;
  /** Opt-in solid ring colour (e.g. the champion's GOLD); defaults to the activity gradient. */
  ringColor?: string;
  children: ReactNode;
}) {
  if (!active) {
    if (surface === 'card') {
      // Inactive card slot: a 2px transparent cover gap plus a 1.5px card band
      // (same width as the orange ring), so the unringed side stays 3.5px and
      // nothing on the card moves.
      return (
        <span data-active-ring="off" style={{ display: 'flex', flex: 'none', lineHeight: 0, padding: 2, borderRadius: '34%' }}>
          <span data-active-ring-band="" style={{ display: 'flex', lineHeight: 0, padding: 1.5, borderRadius: '34%', background: CARD_SURFACE }}>
            {children}
          </span>
        </span>
      );
    }
    return (
      <span data-active-ring="off" style={{ display: 'flex', flex: 'none', lineHeight: 0, padding: 3.5, borderRadius: '34%', background: undefined }}>
        {children}
      </span>
    );
  }
  return (
    <span
      data-active-ring="on"
      style={{ display: 'flex', flex: 'none', lineHeight: 0, padding: 1.5, borderRadius: '34%', background: ringColor ?? ACTIVE_RING_GRADIENT }}
    >
      <span
        data-active-ring-gap=""
        style={{
          display: 'flex',
          lineHeight: 0,
          padding: 2,
          borderRadius: '34%',
          background: gapColor ?? (surface === 'card' ? CARD_SURFACE : PAGE_CANVAS),
        }}
      >
        {children}
      </span>
    </span>
  );
}

export default ActiveRing;

/**
 * The ringed avatar is its own button that opens the latest post; taps and
 * Enter/Space never reach the surrounding card or row (which opens the
 * profile). Unringed avatars are not buttons.
 */
export function ActiveAvatarDoor({
  postId,
  label,
  onOpen,
  children,
}: {
  postId: string | null;
  label: string;
  onOpen: (postId: string) => void;
  children: ReactNode;
}) {
  if (!postId) return <>{children}</>;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(postId);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
      }}
      style={{
        display: 'flex',
        flex: 'none',
        padding: 0,
        margin: 0,
        border: 'none',
        background: 'none',
        lineHeight: 0,
        cursor: 'pointer',
        borderRadius: '34%',
      }}
    >
      {children}
    </button>
  );
}
