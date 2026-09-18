import { useEffect, useMemo, useRef, useState } from 'react';

import { isPerfEnabled } from '@/perf/navTiming';
import { AppLog } from '@/lib/logger';

/**
 * G2 — THE CARD NEVER LIES, NEVER DROPS CONTENT, AND SETTLES ONCE.
 *
 * This replaces G1's frozen gate. NOTHING IS EXCLUDED ANY MORE. The gate has
 * exactly two jobs:
 *
 *  - THE SUBJECT GATE: the card does not open until the thing it exists to show
 *    is in hand. No cap, no timer, no fallback. With a feed seed the subject is
 *    ready in the same tick, so this never waits where a seed exists.
 *  - THE CAP: 900ms, and it only decides whether the card waits for the
 *    SUPPORTING blocks before opening. It can no longer drop one.
 */
export const CARD_OPEN_CAP_MS = 900;
/** The collection window a late supporting block opens. One movement, not three. */
export const SETTLE_WINDOW_MS = 120;
/** The card's entrance transform. A settle may never overlap it. */
export const CARD_ENTRANCE_MS = 240;

type Readiness = Record<string, boolean>;

const tallies = new Map<string, { settled: number; capped: number }>();

function recordGate(name: string, capHit: boolean) {
  const tally = tallies.get(name) ?? { settled: 0, capped: 0 };
  if (capHit) tally.capped += 1;
  else tally.settled += 1;
  tallies.set(name, tally);
  if (isPerfEnabled()) {
    AppLog.info(`card-gate:${name}`, `settled ${tally.settled} · cap ${tally.capped}`);
  }
}

export function getCardOpenGateTallies() {
  return Object.fromEntries(tallies);
}

function signatureOf(readiness: Readiness) {
  return Object.keys(readiness)
    .sort()
    .map((key) => `${key}:${readiness[key] ? 1 : 0}`)
    .join(',');
}

interface GateInput {
  /** The hole rows, the review prose — the reason the card exists. */
  subject: boolean;
  /** AT THIS COURSE, the field caption, engagement, media, aggregates. */
  supporting: Readiness;
}

export function useCardOpenGate(
  name: string,
  open: boolean,
  { subject, supporting }: GateInput,
  capMs = CARD_OPEN_CAP_MS,
): { visible: boolean; capHit: boolean } {
  const [capElapsed, setCapElapsed] = useState(false);
  const recordedRef = useRef(false);
  const supportingSignature = signatureOf(supporting);
  const supportingReady = useMemo(
    () => Object.values(supporting).every(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supportingSignature],
  );

  useEffect(() => {
    if (!open) {
      setCapElapsed(false);
      recordedRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => setCapElapsed(true), capMs);
    return () => window.clearTimeout(timer);
  }, [open, capMs]);

  const visible = open && subject && (supportingReady || capElapsed);

  useEffect(() => {
    if (!visible || recordedRef.current) return;
    recordedRef.current = true;
    recordGate(name, !supportingReady);
  }, [visible, supportingReady, name]);

  return { visible, capHit: visible && !supportingReady };
}

/**
 * G2.4 — ONE SETTLE, NOT THREE.
 *
 * Supporting blocks are never dropped, only late. A block that lands after the
 * card is up waits for the entrance to finish, then opens a single 120ms
 * collection window; everything inside that window is applied together, so the
 * card's height changes once. There is no idle observer: the window knows
 * exactly when it fires.
 */
export function useCoalescedBlocks<T extends Readiness>(
  readiness: T,
  visible: boolean,
  { windowMs = SETTLE_WINDOW_MS, entranceMs = CARD_ENTRANCE_MS }: { windowMs?: number; entranceMs?: number } = {},
): T {
  const [applied, setApplied] = useState<T>(readiness);
  const latestRef = useRef(readiness);
  latestRef.current = readiness;
  const signature = signatureOf(readiness);
  const appliedSignature = signatureOf(applied);
  const [entranceDone, setEntranceDone] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visible) {
      setEntranceDone(false);
      return;
    }
    const timer = window.setTimeout(() => setEntranceDone(true), entranceMs);
    return () => window.clearTimeout(timer);
  }, [visible, entranceMs]);

  useEffect(() => {
    if (!visible) {
      // Before the card is up, readiness passes straight through, so the first
      // paint carries every block that is already in hand.
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (signature !== appliedSignature) setApplied({ ...latestRef.current });
      return;
    }
    if (signature === appliedSignature) return;
    if (!entranceDone) return;
    if (timerRef.current != null) return;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setApplied({ ...latestRef.current });
    }, windowMs);
  }, [visible, signature, appliedSignature, entranceDone, windowMs]);

  useEffect(() => () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
  }, []);

  return applied;
}
