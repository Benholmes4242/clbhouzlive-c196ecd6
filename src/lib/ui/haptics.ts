/**
 * haptics.ts — bridge-aware haptic feedback.
 *
 * Priority chain: Median native bridge → navigator.vibrate → no-op.
 * Median's Haptics JS Bridge expects **object** args:
 *   median.haptics.impact({ style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' })
 *   median.haptics.notification({ type: 'success' | 'warning' | 'error' })
 *   median.haptics.selection()
 * Passing raw strings is silently ignored on iOS — that was the bug.
 *
 * Rules:
 *  - Fire-and-forget (never await).
 *  - Coarse-pointer gate so desktop dev doesn't rattle laptops.
 *  - 50ms global debounce (Median queues rapid calls).
 */

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'success' | 'warning' | 'error';

interface MedianHaptics {
  impact?: (opts: { style: ImpactStyle }) => void;
  notification?: (opts: { type: NotificationType }) => void;
  selection?: () => void;
}

interface MedianBridge {
  haptics?: MedianHaptics;
}

const DEBOUNCE_MS = 50;
let lastFiredAt = 0;

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  } catch {
    return false;
  }
}

function getMedianHaptics(): MedianHaptics | null {
  if (typeof window === 'undefined') return null;
  const median = (window as unknown as { median?: MedianBridge }).median;
  return median?.haptics ?? null;
}

function fireMedian(h: MedianHaptics, type: HapticType): boolean {
  try {
    switch (type) {
      case 'selection':
        if (typeof h.selection === 'function') { h.selection(); return true; }
        return false;
      case 'success':
        if (typeof h.notification === 'function') { h.notification({ type: 'success' }); return true; }
        return false;
      case 'warning':
        if (typeof h.notification === 'function') { h.notification({ type: 'warning' }); return true; }
        return false;
      case 'error':
        if (typeof h.notification === 'function') { h.notification({ type: 'error' }); return true; }
        return false;
      case 'heavy':
        if (typeof h.impact === 'function') { h.impact({ style: 'heavy' }); return true; }
        return false;
      case 'medium':
        if (typeof h.impact === 'function') { h.impact({ style: 'medium' }); return true; }
        return false;
      case 'light':
      default:
        if (typeof h.impact === 'function') { h.impact({ style: 'light' }); return true; }
        return false;
    }
  } catch {
    return false;
  }
}

function fireVibrate(type: HapticType): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  const patterns: Record<HapticType, number | number[]> = {
    light: 6,
    medium: 12,
    heavy: 20,
    selection: 10,
    success: [10, 40, 10],
    warning: [10, 60, 10],
    error: [20, 80, 20],
  };
  try {
    navigator.vibrate(patterns[type] ?? 10);
  } catch {
    // no-op
  }
}

export function triggerHaptic(type: HapticType = 'light'): void {
  // Desktop dev: no rattle. Median WebView reports coarse+no-hover so it stays on.
  if (!isCoarsePointer() && !getMedianHaptics()) return;

  const now = Date.now();
  if (now - lastFiredAt < DEBOUNCE_MS) return;
  lastFiredAt = now;

  const bridge = getMedianHaptics();
  if (bridge && fireMedian(bridge, type)) return;

  fireVibrate(type);
}

// Legacy exports — call sites in messaging/echo already use these.
export const hapticTap = () => triggerHaptic('selection');
export const hapticSoft = () => triggerHaptic('light');
