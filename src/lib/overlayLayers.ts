/**
 * overlayLayers — BRIEF 20 D1. "Ranking follows who opened whom", made
 * literal: an overlay CLAIMS a layer when it opens and releases it on close.
 * claimLayer(floor) → z = max(floor, highest claimed z + 10). Each overlay's
 * zLayers / Z constant stays its floor; scrim/panel offsets stay inside the
 * overlay (backdrop = z, panel = z + its usual offset). Overlays still portal
 * to body (zLayers invariant).
 */
import { useLayoutEffect, useRef, useState } from 'react';

const claims = new Map<number, number>(); // token → z
let nextToken = 1;

export const LAYER_STEP = 10;

export function highestClaimedLayer(): number {
  let top = -Infinity;
  for (const z of claims.values()) top = Math.max(top, z);
  return top;
}

export function claimLayer(floor: number): { z: number; release: () => void } {
  const top = highestClaimedLayer();
  const z = Math.max(floor, Number.isFinite(top) ? top + LAYER_STEP : floor);
  const token = nextToken++;
  claims.set(token, z);
  return { z, release: () => { claims.delete(token); } };
}

/** Test-only: drop every claim. */
export function resetOverlayLayersForTests() { claims.clear(); }

/**
 * The claimed z while `open`, else `floor`. Changing `raiseKey` while open
 * re-claims above everything (same instance, no remount) — the REVIEW pill's
 * "bring the open sheet above the viewer" (D2).
 */
export function useClaimedLayer(open: boolean, floor: number, raiseKey?: unknown): number {
  const [z, setZ] = useState(floor);
  const releaseRef = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const claim = claimLayer(floor);
    releaseRef.current = claim.release;
    setZ(claim.z);
    return () => { claim.release(); releaseRef.current = null; };
  }, [open, floor, raiseKey]);
  return open ? z : floor;
}
