// Client-side error tracker (C5-1).
//
// Writes `app_error` events to analytics_events via the existing analytics
// utility. Fire-and-forget: an error inside error tracking must vanish
// silently — every safety rule below is required by the launch brief.
//
//   SR1  Every handler body wrapped in try/catch that swallows.
//   SR2  Recursion guard — a module flag set while tracking; drop re-entries.
//   SR3  Flood control — dedupe by message hash (1 per identical msg / 10s),
//        plus a hard cap of 5 app_error events per session.
//   SR4  Redaction — strip email-like and token-like substrings from message
//        and stack; only include location.pathname (never query/hash) as
//        route; never include user content.
//   SR5  No behaviour change when no error occurs — this module only listens.
import { analyticsEvents } from '@/utils/analyticsEvents';
import { currentBuildId } from '@/lib/buildFreshness';

const MAX_MSG = 200;
const MAX_STACK = 400;
const DEDUPE_MS = 10_000;
const SESSION_CAP = 5;

// SR3 — flood control state
const recent = new Map<string, number>();
let sessionCount = 0;
// SR2 — recursion guard
let tracking = false;

function redact(input: string): string {
  // SR4 — email + long-token stripping. Both patterns are intentionally
  // conservative; we favour false-positive redaction over leakage.
  if (!input) return input;
  return input
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/\b[A-Za-z0-9_\-]{24,}\b/g, '[token]');
}

function firstFrames(stack: string | undefined | null, n = 3): string {
  if (!stack) return '';
  return String(stack).split('\n').slice(0, n).join('\n');
}

export type ErrorKind = 'error' | 'rejection' | 'react' | 'test';

export function trackError(input: {
  kind: ErrorKind;
  error?: unknown;
  message?: string;
  stack?: string;
}): void {
  try { // SR1
    if (tracking) return; // SR2
    if (sessionCount >= SESSION_CAP) return; // SR3 (session cap)
    tracking = true;
    try {
      const err = input.error as { message?: string; stack?: string } | undefined;
      const rawMsg = input.message ?? err?.message ?? String(input.error ?? 'unknown');
      const rawStack = input.stack ?? err?.stack;

      const message = redact(String(rawMsg)).slice(0, MAX_MSG);
      const stack = redact(firstFrames(rawStack)).slice(0, MAX_STACK);

      // SR3 (dedupe window)
      const key = `${input.kind}|${message}`;
      const now = Date.now();
      const last = recent.get(key) ?? 0;
      if (now - last < DEDUPE_MS) return;
      recent.set(key, now);
      sessionCount += 1;

      // SR4 — pathname only; never include query or hash.
      const route =
        typeof window !== 'undefined' ? window.location.pathname : '';

      // Fire-and-forget — analyticsEvents.track already swallows internally.
      // build_id — every reported error names the build that produced it, so
      // the stability surface can separate stale clients from real regressions.
      analyticsEvents.track('app_error', {
        kind: input.kind,
        message,
        stack,
        route,
        build_id: currentBuildId(),
      });
    } finally {
      tracking = false;
    }
  } catch {
    // SR1 — swallow silently.
  }
}

export function installErrorTracking(): void {
  try { // SR1
    if (typeof window === 'undefined') return;
    if ((window as unknown as { __errTrackInstalled?: boolean }).__errTrackInstalled) return;
    (window as unknown as { __errTrackInstalled?: boolean }).__errTrackInstalled = true;

    window.addEventListener('error', (e) => {
      try { // SR1
        trackError({
          kind: 'error',
          error: (e as ErrorEvent).error,
          message: (e as ErrorEvent).message,
        });
      } catch { /* SR1 */ }
    });

    window.addEventListener('unhandledrejection', (e) => {
      try { // SR1
        const reason = (e as PromiseRejectionEvent).reason as
          | { message?: string; stack?: string }
          | undefined;
        trackError({
          kind: 'rejection',
          error: reason,
          message: reason?.message ?? String(reason ?? 'unhandledrejection'),
        });
      } catch { /* SR1 */ }
    });
  } catch {
    // SR1
  }
}
