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

// ── Runtime suppression signal ──────────────────────────────────────────
// Third hidden-input to ChromeIsland (alongside shouldHideHeader and the
// legacy floatingHeaderSignal). When true, the island renders nothing AND
// publishes --header-h: 0, matching chrome:'none' semantics without a
// registry flip. Pages toggle this for transient chrome takeover states
// (e.g. Clubhouse's PGA "This Week" card).
let suppressCount = 0;
let currentSuppressed = false;
const suppressSubs = new Set<(v: boolean) => void>();

function publishSuppressed(): void {
  const next = suppressCount > 0;
  if (currentSuppressed === next) return;
  currentSuppressed = next;
  suppressSubs.forEach((s) => s(next));
}

/**
 * Imperative escape hatch. Prefer useSetChromeSuppressed: this setter does not
 * participate in the refcount, so a `false` here is only honoured while no
 * component holds a claim.
 */
export function setChromeSuppressed(v: boolean): void {
  if (v) {
    suppressCount += 1;
  } else if (suppressCount > 0) {
    suppressCount -= 1;
  }
  publishSuppressed();
}

export function useChromeSuppressed(): boolean {
  const [v, setV] = useState<boolean>(currentSuppressed);
  useEffect(() => {
    suppressSubs.add(setV);
    setV(currentSuppressed);
    return () => {
      suppressSubs.delete(setV);
    };
  }, []);
  return v;
}

/**
 * Set suppression for the lifetime + value of the calling component.
 *
 * REFCOUNTED ON PURPOSE: a plain boolean let two overlapping owners fight —
 * the second one's unmount cleanup wrote `false` and the island reappeared on
 * top of a shell that was still asking for it to be hidden (the tour sub-pages
 * showed both the island and TourPageShell's header at once). Suppression now
 * lifts only when the LAST claimant releases it.
 */
export function useSetChromeSuppressed(v: boolean): void {
  useEffect(() => {
    if (!v) return;
    suppressCount += 1;
    publishSuppressed();
    return () => {
      suppressCount = Math.max(0, suppressCount - 1);
      publishSuppressed();
    };
  }, [v]);
}
