/**
 * fsvTelemetry — surface-level render diagnostics helper.
 *
 * The former [FSV] session-trace family (fsv / fsvEl / fsvTimeSample /
 * fsvNewSession / fsvSessionId / fsvViewport) was stripped at Stage 7 PR-4
 * sign-off. Regression tripwires that used to live here (eng.pause.borrowed,
 * eng.unmount.borrowed) now emit via the engine's DBG channel with the same
 * payloads and the same isPerfEnabled gate.
 *
 * `vdiff()` is the only survivor — per-surface render-diagnosis logger. Call
 * sites are added ad-hoc while wiring a new surface and stripped at sign-off.
 * No call sites exist today.
 */

import { isPerfEnabled } from '@/perf/navTiming';

function on(): boolean {
  try {
    return isPerfEnabled();
  } catch {
    return false;
  }
}

/**
 * [VDIFF] Comparative-diff logger — per-surface render diagnostics. Gated by
 * the DBG pill; safe to call from render paths.
 */
export function vdiff(tag: string, data?: Record<string, unknown>): void {
  if (!on()) return;
  // eslint-disable-next-line no-console
  console.info(`[VDIFF] ${tag}`, {
    t: Math.round(performance.now()),
    ...(data ?? {}),
  });
}
