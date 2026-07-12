/**
 * leftOverride — page-level overrides for the ChromeIsland's left cell.
 *
 * Two independent signals, same mount/unmount pattern as
 * floatingHeaderSignal:
 *
 *  - ChromeLeftOverride (back-target override): pages tweak the target of
 *    the back arrow without owning the UI. Used by ProfilePageV2.
 *
 *  - ChromeLeftSlot (full replacement): a page provides a React node that
 *    replaces logo/back inside the LEFT capsule chrome (glass, 44px height,
 *    radius 999). Used by the Tour Hub to render its burger + tour picker.
 *
 * Precedence in ChromeIsland: slot > override > registry `left`.
 */
import { useEffect, useState, type ReactNode } from 'react';

// ── Back-target override ─────────────────────────────────────────────────
export interface ChromeLeftOverride {
  /** Explicit navigation target (e.g. '/edit-profile?tab=settings'). */
  backTarget?: string;
  /** Fallback used with safeGoBack when there's no history. */
  backFallback?: string;
}

let currentOverride: ChromeLeftOverride | null = null;
const overrideSubs = new Set<(v: ChromeLeftOverride | null) => void>();

export function setChromeLeftOverride(v: ChromeLeftOverride | null): void {
  currentOverride = v;
  overrideSubs.forEach((s) => s(v));
}

export function useChromeLeftOverride(): ChromeLeftOverride | null {
  const [v, setV] = useState<ChromeLeftOverride | null>(currentOverride);
  useEffect(() => {
    overrideSubs.add(setV);
    setV(currentOverride);
    return () => {
      overrideSubs.delete(setV);
    };
  }, []);
  return v;
}

/** Set the override for the lifetime of the calling component. */
export function useSetChromeLeftOverride(v: ChromeLeftOverride | null): void {
  useEffect(() => {
    setChromeLeftOverride(v);
    return () => setChromeLeftOverride(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v?.backTarget, v?.backFallback]);
}

// ── Full-replacement slot ────────────────────────────────────────────────
let currentSlot: ReactNode | null = null;
const slotSubs = new Set<(v: ReactNode | null) => void>();

export function setChromeLeftSlot(node: ReactNode | null): void {
  currentSlot = node;
  slotSubs.forEach((s) => s(node));
}

export function useChromeLeftSlot(): ReactNode | null {
  const [v, setV] = useState<ReactNode | null>(currentSlot);
  useEffect(() => {
    slotSubs.add(setV);
    setV(currentSlot);
    return () => {
      slotSubs.delete(setV);
    };
  }, []);
  return v;
}

/**
 * Register a left-capsule slot for the lifetime of the calling component.
 * Passing null clears any active slot.
 */
export function useSetChromeLeftSlot(node: ReactNode | null): void {
  useEffect(() => {
    setChromeLeftSlot(node);
    return () => setChromeLeftSlot(null);
  }, [node]);
}
