import { useEffect, useMemo, useRef, useState } from 'react';

import { isPerfEnabled } from '@/perf/navTiming';
import { AppLog } from '@/lib/logger';

export const GLASS_OPEN_HOLD_MS = 350;

type Readiness = Record<string, boolean>;
type GateResult = { visible: boolean; included: Readiness; capHit: boolean };

const tallies = new Map<string, { settled: number; capped: number }>();

function recordGate(name: string, capHit: boolean) {
  const tally = tallies.get(name) ?? { settled: 0, capped: 0 };
  if (capHit) tally.capped += 1;
  else tally.settled += 1;
  tallies.set(name, tally);
  if (isPerfEnabled()) {
    AppLog.info(`glass-gate:${name}`, `settled ${tally.settled} · cap ${tally.capped}`);
  }
}

export function getGlassOpenGateTallies() {
  return Object.fromEntries(tallies);
}

/** Freezes the blocks available at first paint. Late blocks wait for the next open. */
export function useFrozenOpenGate(name: string, open: boolean, readiness: Readiness, holdMs = GLASS_OPEN_HOLD_MS): GateResult {
  const [result, setResult] = useState<GateResult>({ visible: false, included: {}, capHit: false });
  const openedRef = useRef(false);
  const openedAtRef = useRef(0);
  const readinessRef = useRef(readiness);
  readinessRef.current = readiness;
  const allReady = useMemo(() => Object.values(readiness).every(Boolean), [readiness]);

  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      openedAtRef.current = 0;
      setResult({ visible: false, included: {}, capHit: false });
      return;
    }
    if (openedRef.current) return;
    if (!openedAtRef.current) openedAtRef.current = performance.now();
    const reveal = (capHit: boolean) => {
      if (openedRef.current) return;
      openedRef.current = true;
      const included = { ...readinessRef.current };
      setResult({ visible: true, included, capHit });
      recordGate(name, capHit);
    };
    if (allReady) {
      reveal(false);
      return;
    }
    const remaining = Math.max(0, holdMs - (performance.now() - openedAtRef.current));
    const timer = window.setTimeout(() => reveal(true), remaining);
    return () => window.clearTimeout(timer);
  }, [allReady, holdMs, name, open]);

  return result;
}