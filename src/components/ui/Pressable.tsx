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

export type PressableVariant = 'card' | 'icon' | 'row' | 'toggle' | 'media';
export type PressableHaptic = 'none' | HapticType;

// Single shared transition token — used everywhere press feedback lives.
// Return is slightly faster than press to feel snappy on release.
const TRANSITION = 'transform 120ms cubic-bezier(0.2, 0, 0.2, 1), background-color 120ms cubic-bezier(0.2, 0, 0.2, 1)';

// Movement / time thresholds for tap-vs-scroll disambiguation.
const MOVE_THRESHOLD_PX = 8;
const MAX_TAP_MS = 350;
// Preroute (scroll-guarded pointerdown warm) — fire once the pointer has
// stayed still long enough to be a tap-in-progress, cancel if it becomes a
// scroll/drag or long-press.
const PREROUTE_FIRE_MS = 40;
const PREROUTE_LONGPRESS_MS = 500;

interface VariantSpec {
  pressedScale: number | null;
  pressedBg: string | null;
  transition: string;
}

const VARIANTS: Record<PressableVariant, VariantSpec> = {
  // Large card / tile — feed cards, media tiles, hero, course cards.
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
  // Media tile — press feedback OFF. Retains tap/scroll disambiguation,
  // haptics, and FLIP commit ordering; just no scale/bg on press.
  media: {
    pressedScale: null,
    pressedBg: null,
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
  /**
   * Scroll-guarded pointerdown preroute. Fires ~40ms after pointerdown IFF the
   * pointer has stayed within the tap threshold — i.e. this looks like a tap,
   * not a scroll/drag. Cold video tiles use this to warm the HLS cache before
   * the click commits (~80-150ms head start on mobile).
   */
  onPreroute?: () => void;
  /**
   * Fires when a preroute is CANCELLED, with the reason. Called for every
   * cancel path — before or after `onPreroute` fired — so consumers can log
   * arm/cancel independent of whether the warm actually ran.
   * `moved`     → pointer exceeded the tap threshold (drag/scroll on-tile)
   * `scroll`    → pointercancel (native scroller took over the gesture)
   * `longpress` → still holding after the long-press window
   */
  onPrerouteCancel?: (reason: 'moved' | 'scroll' | 'longpress') => void;
  /** Fires once at pointerdown — the moment a preroute is armed (pre-guard). */
  onPrerouteArm?: () => void;
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
    onPreroute,
    onPrerouteCancel,
    onPrerouteArm,
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
    prerouteArmed: false,
    prerouteFired: false,
    prerouteFireTimer: 0 as number | 0,
    prerouteLongPressTimer: 0 as number | 0,
  });

  // Keep the latest preroute callbacks reachable from stable pointer handlers.
  const prerouteRef = useRef({
    fire: onPreroute,
    cancel: onPrerouteCancel,
    arm: onPrerouteArm,
  });
  prerouteRef.current.fire = onPreroute;
  prerouteRef.current.cancel = onPrerouteCancel;
  prerouteRef.current.arm = onPrerouteArm;

  const clearPrerouteTimers = useCallback(() => {
    const s = stateRef.current;
    if (s.prerouteFireTimer) {
      clearTimeout(s.prerouteFireTimer);
      s.prerouteFireTimer = 0;
    }
    if (s.prerouteLongPressTimer) {
      clearTimeout(s.prerouteLongPressTimer);
      s.prerouteLongPressTimer = 0;
    }
  }, []);

  const cancelPreroute = useCallback((reason: 'moved' | 'scroll' | 'longpress') => {
    const s = stateRef.current;
    if (!s.prerouteArmed) return;
    s.prerouteArmed = false;
    s.prerouteFired = false;
    try { prerouteRef.current.cancel?.(reason); } catch {}
  }, []);

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

      // Scroll-guarded preroute: schedule a fire after PREROUTE_FIRE_MS iff
      // the pointer is still down and not aborted (by scroll/drag). Also arm
      // a long-press guard that cancels a fired warm if the tap never lands.
      if (prerouteRef.current.fire) {
        s.prerouteArmed = true;
        s.prerouteFired = false;
        clearPrerouteTimers();
        try { prerouteRef.current.arm?.(); } catch {}
        s.prerouteFireTimer = window.setTimeout(() => {
          s.prerouteFireTimer = 0;
          const cur = stateRef.current;
          if (!cur.active || cur.aborted || !cur.prerouteArmed) return;
          cur.prerouteFired = true;
          try { prerouteRef.current.fire?.(); } catch {}
        }, PREROUTE_FIRE_MS);
        s.prerouteLongPressTimer = window.setTimeout(() => {
          s.prerouteLongPressTimer = 0;
          const cur = stateRef.current;
          // Still holding after long-press window → not a tap. Abort.
          if (cur.active && cur.prerouteArmed) {
            cancelPreroute('longpress');
          }
        }, PREROUTE_LONGPRESS_MS);
      }
    },
    [applyPressed, disabled, clearPrerouteTimers, cancelPreroute],
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
        // Cancel any pending preroute + abort in-flight warm if already fired.
        clearPrerouteTimers();
        cancelPreroute('moved');
      }
    },
    [releasePressed, clearPrerouteTimers, cancelPreroute],
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

      // Tap committed (or aborted) — stop the long-press guard. A warm that
      // already fired stays in-flight; the imminent open will hit warm cache.
      clearPrerouteTimers();
      s.prerouteArmed = false;
      s.prerouteFired = false;

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
    [releasePressed, haptic, onPress, disabled, clearPrerouteTimers],
  );

  const handlePointerCancel = useCallback(() => {
    const s = stateRef.current;
    if (!s.active) return;
    s.active = false;
    s.aborted = false;
    releasePressed();
    clearPrerouteTimers();
    // pointercancel on mobile ~ native scroller took over the gesture.
    cancelPreroute('scroll');
  }, [releasePressed, clearPrerouteTimers, cancelPreroute]);

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
    // (media-tile pattern) is unaffected and never jitters.
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
