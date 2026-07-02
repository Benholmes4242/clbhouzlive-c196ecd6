/**
 * Pressable — the one press-feedback primitive.
 *
 * Owns, in ONE place:
 *  - Tier-mapped press feedback (card / icon / row / toggle).
 *  - Pointer-event scroll-vs-tap disambiguation (rails must keep scrolling).
 *  - iOS :active deadzone unlock (no-op touchstart).
 *  - will-change lifecycle (transient, never static on 100+ list items).
 *  - Transform on an INNER wrapper — never on a <video>, so autoplaying rail
 *    tiles never jitter.
 *  - Commit ordering: release pressed state SYNCHRONOUSLY (direct DOM write,
 *    no React state) before invoking onPress, so `openWithOrigin` (Phase 3
 *    FLIP) snapshots the tile at rest scale — never the pressed rect.
 *  - Haptic policy: fires per `haptic` prop only on committed presses.
 *
 * Design notes:
 *  - No React state for pressed → no re-render per interaction.
 *  - Uses Pointer Events (not Touch). touch-action: manipulation, never none.
 *  - Reduced Motion: press feedback STAYS ON (direct-manipulation affordance).
 */
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { triggerHaptic, type HapticType } from '@/lib/ui/haptics';

export type PressableVariant = 'card' | 'icon' | 'row' | 'toggle';
export type PressableHaptic = 'none' | HapticType;

// Single shared transition token — used everywhere press feedback lives.
// Return is slightly faster than press to feel snappy on release.
const TRANSITION = 'transform 120ms cubic-bezier(0.2, 0, 0.2, 1), background-color 120ms cubic-bezier(0.2, 0, 0.2, 1)';

// Movement / time thresholds for tap-vs-scroll disambiguation.
const MOVE_THRESHOLD_PX = 8;
const MAX_TAP_MS = 350;

interface VariantSpec {
  pressedScale: number | null;
  pressedBg: string | null;
  transition: string;
}

const VARIANTS: Record<PressableVariant, VariantSpec> = {
  // Large card / tile — FeedCard, WatchTile, WatchRailTile, hero, course cards.
  card: {
    pressedScale: 0.97,
    pressedBg: null,
    transition: TRANSITION,
  },
  // Small button / icon — footer like/comment/share, top-bar icons, chips.
  icon: {
    pressedScale: 0.94,
    pressedBg: null,
    // Faster return for icons.
    transition: 'transform 90ms cubic-bezier(0.2, 0, 0.2, 1)',
  },
  // List / sheet rows — scale in scrollers reads as jank; tint instead.
  row: {
    pressedScale: null,
    pressedBg: 'hsl(var(--muted) / 0.60)',
    transition: TRANSITION,
  },
  // Toggles / segmented items — subtle scale + tint on commit.
  toggle: {
    pressedScale: 0.96,
    pressedBg: 'hsl(var(--muted) / 0.60)',
    transition: TRANSITION,
  },
};

export interface PressableProps
  extends Omit<
    React.HTMLAttributes<HTMLElement>,
    'onClick' | 'onPointerDown' | 'onPointerUp' | 'onPointerMove' | 'onPointerCancel' | 'onTouchStart'
  > {
  variant?: PressableVariant;
  onPress?: (e: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => void;
  haptic?: PressableHaptic;
  as?: 'div' | 'button' | 'article' | 'li' | 'a' | 'span';
  disabled?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  /** Extra className applied to the INNER transform wrapper. */
  innerClassName?: string;
  /** Extra style applied to the INNER transform wrapper. */
  innerStyle?: React.CSSProperties;
}

const Pressable = forwardRef<HTMLElement, PressableProps>(function Pressable(
  {
    variant = 'card',
    onPress,
    haptic = 'none',
    as = 'div',
    disabled,
    href,
    type,
    className,
    style,
    innerClassName,
    innerStyle,
    children,
    ...rest
  },
  ref,
) {
  const outerRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => outerRef.current as HTMLElement, []);

  const spec = VARIANTS[variant];

  // Interaction state kept OUT of React so there's no re-render per press and
  // release can be truly synchronous before onPress fires (Phase 3 FLIP).
  const stateRef = useRef({
    active: false,
    aborted: false,
    startX: 0,
    startY: 0,
    startT: 0,
    pointerId: -1,
  });

  const applyPressed = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    if (spec.pressedScale != null) {
      el.style.willChange = 'transform';
      el.style.transform = `scale(${spec.pressedScale})`;
    }
    if (spec.pressedBg != null) {
      el.style.backgroundColor = spec.pressedBg;
    }
  }, [spec]);

  const releasePressed = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    if (spec.pressedScale != null) {
      el.style.transform = '';
      // Drop will-change after the transition completes to avoid layer bloat.
      window.setTimeout(() => {
        if (innerRef.current) innerRef.current.style.willChange = '';
      }, 200);
    }
    if (spec.pressedBg != null) {
      el.style.backgroundColor = '';
    }
  }, [spec]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabled) return;
      // Only respond to primary button / touch / pen. Ignore rmb, etc.
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const s = stateRef.current;
      s.active = true;
      s.aborted = false;
      s.startX = e.clientX;
      s.startY = e.clientY;
      s.startT = performance.now();
      s.pointerId = e.pointerId;
      applyPressed();
    },
    [applyPressed, disabled],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = stateRef.current;
      if (!s.active || s.aborted) return;
      if (e.pointerId !== s.pointerId) return;
      const dx = Math.abs(e.clientX - s.startX);
      const dy = Math.abs(e.clientY - s.startY);
      if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
        // Scroll / drag intent — abort press. Do NOT call preventDefault.
        s.aborted = true;
        releasePressed();
      }
    },
    [releasePressed],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = stateRef.current;
      if (!s.active) return;
      if (e.pointerId !== s.pointerId) return;
      const wasAborted = s.aborted;
      const dx = Math.abs(e.clientX - s.startX);
      const dy = Math.abs(e.clientY - s.startY);
      const dt = performance.now() - s.startT;
      s.active = false;
      s.aborted = false;

      // Release SYNCHRONOUSLY before invoking onPress — Phase 3 FLIP snapshots
      // must see the rest-size rect, not the 0.97 pressed rect.
      releasePressed();

      if (wasAborted || dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX || dt > MAX_TAP_MS) {
        return;
      }

      if (haptic !== 'none') {
        triggerHaptic(haptic);
      }
      if (onPress && !disabled) {
        onPress(e);
      }
    },
    [releasePressed, haptic, onPress, disabled],
  );

  const handlePointerCancel = useCallback(() => {
    const s = stateRef.current;
    if (!s.active) return;
    s.active = false;
    s.aborted = false;
    releasePressed();
  }, [releasePressed]);

  // iOS :active deadzone: a no-op touchstart listener flips iOS into applying
  // active/press styles on tap. Not strictly needed here (we don't rely on
  // :active) but it also improves 300ms-delay heuristics on old WebViews.
  const noopTouchStart = useCallback(() => {}, []);

  const Tag = (as ?? 'div') as any;

  const mergedStyle: React.CSSProperties = {
    // manipulation → keep vertical / horizontal scroll working; never `none`.
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    cursor: disabled ? 'default' : 'pointer',
    userSelect: 'none',
    ...style,
  };

  const innerMergedStyle: React.CSSProperties = {
    // Inner wrapper owns the transform so a <video> appended to outerRef
    // (WatchRailTile pattern) is unaffected and never jitters.
    display: 'contents',
    transition: spec.transition,
    ...innerStyle,
  };

  // `display: contents` breaks the transform origin — we need a real box.
  // Only promote to a block wrapper if there's a scale or bg to apply.
  const needsBox = spec.pressedScale != null || spec.pressedBg != null;
  if (needsBox) {
    innerMergedStyle.display = innerStyle?.display ?? 'block';
    innerMergedStyle.transformOrigin = innerStyle?.transformOrigin ?? 'center';
  }

  return (
    <Tag
      ref={outerRef as any}
      {...(as === 'button' ? { type: type ?? 'button', disabled } : {})}
      {...(as === 'a' && href ? { href } : {})}
      className={className}
      style={mergedStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onTouchStart={noopTouchStart}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      <div ref={innerRef} className={innerClassName} style={innerMergedStyle}>
        {children}
      </div>
    </Tag>
  );
});

export default Pressable;
export { Pressable };
