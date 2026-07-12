/**
 * leftOverride — page-level override for the ChromeIsland's left cell.
 *
 * Mirrors floatingHeaderSignal: a tiny standalone store with a React
 * subscription hook. Pages call useSetChromeLeftOverride({...}) to override
 * the registry-driven left cell while mounted; the override is cleared on
 * unmount. The island consumes the current override via useChromeLeftOverride
 * and takes precedence over the registry rule when non-null.
 */
import { useEffect, useState } from 'react';

export interface ChromeLeftOverride {
  /** Explicit navigation target (e.g. '/edit-profile?tab=settings'). */
  backTarget?: string;
  /** Fallback used with safeGoBack when there's no history. */
  backFallback?: string;
}

let current: ChromeLeftOverride | null = null;
const subs = new Set<(v: ChromeLeftOverride | null) => void>();

export function setChromeLeftOverride(v: ChromeLeftOverride | null): void {
  current = v;
  subs.forEach((s) => s(v));
}

export function useChromeLeftOverride(): ChromeLeftOverride | null {
  const [v, setV] = useState<ChromeLeftOverride | null>(current);
  useEffect(() => {
    subs.add(setV);
    setV(current);
    return () => {
      subs.delete(setV);
    };
  }, []);
  return v;
}

/**
 * Set the override for the lifetime of the calling component.
 * Passing null clears any active override.
 */
export function useSetChromeLeftOverride(v: ChromeLeftOverride | null): void {
  useEffect(() => {
    setChromeLeftOverride(v);
    return () => setChromeLeftOverride(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v?.backTarget, v?.backFallback]);
}
