/**
 * fsv2 trace helpers — all events tagged with the current `openId` so
 * dashboards can correlate a whole open lifecycle. Trace names are new
 * (`fsv2.*`), separate from v1's `fs.*`.
 */

import { trace, traceGenId } from '@/perf/trace';

export function genOpenId(): string {
  return traceGenId();
}

export function traceTap(openId: string, payload: Record<string, unknown> = {}): void {
  trace('fsv2.tap', { openId, ...payload });
}

export function traceSlide(openId: string, payload: Record<string, unknown> = {}): void {
  trace('fsv2.slide', { openId, ...payload });
}

export function traceReveal(openId: string, payload: Record<string, unknown> = {}): void {
  trace('fsv2.reveal', { openId, ...payload });
}

export function traceRevealForced(
  openId: string,
  reason: string,
  payload: Record<string, unknown> = {},
): void {
  trace('fsv2.reveal.forced', { openId, reason, ...payload });
}
