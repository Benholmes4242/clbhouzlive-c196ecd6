/**
 * Impression tracker — Phase 0.
 *
 * Silently records which posts each signed-in user has actually seen. Powers
 * feed v3 (seen-suppression, catch-up blocks, weight tuning). Nothing reads
 * this data yet.
 *
 * Contract:
 *  - `track(postId)` increments an in-memory buffer entry. No-op if signed out.
 *  - Flushes every 10s if the buffer is non-empty, on `visibilitychange` →
 *    hidden, and on `pagehide`.
 *  - Flush = ONE RPC (`record_post_impressions`) that upsert-increments
 *    per post for `auth.uid()`.
 *  - All failures `console.warn` only. Never throws, never toasts, never
 *    blocks anything. Airplane mode must degrade silently.
 */
import { supabase } from '@/integrations/supabase/client';

const FLUSH_INTERVAL_MS = 10_000;

// postId → coalesced increment count for this un-flushed window.
const buffer = new Map<string, number>();
let flushTimer: number | null = null;
let started = false;

function scheduleFlushTimer() {
  if (typeof window === 'undefined') return;
  if (flushTimer != null) return;
  flushTimer = window.setInterval(() => {
    if (buffer.size > 0) void flush();
  }, FLUSH_INTERVAL_MS);
}

async function flush(): Promise<void> {
  if (buffer.size === 0) return;

  // Snapshot + clear synchronously so re-entrant tracks queue into the next
  // window rather than getting dropped on RPC failure.
  const ids: string[] = [];
  buffer.forEach((_count, postId) => ids.push(postId));
  buffer.clear();

  try {
    // Auth gate: RPC is granted to `authenticated` only. Skip silently for
    // signed-out sessions so no console noise / no failed requests.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // House rule: call `.rpc` ON the client, never rebind it to a variable.
    const { error } = await supabase.rpc('record_post_impressions', {
      p_post_ids: ids,
    });
    if (error) {
      console.warn('[impressions] flush RPC error:', error.message);
    }
  } catch (err) {
    console.warn('[impressions] flush failed:', err);
  }
}

function flushSyncIshOnHide() {
  // visibilitychange / pagehide: fire and forget; the browser may cut the
  // request short on pagehide but that's acceptable — worst case the batch
  // is lost, next session recovers.
  if (buffer.size > 0) void flush();
}

function startOnce() {
  if (started) return;
  if (typeof window === 'undefined') return;
  started = true;

  scheduleFlushTimer();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSyncIshOnHide();
  });
  window.addEventListener('pagehide', flushSyncIshOnHide);
}

/**
 * Record an impression for a post. Safe to call from render effects — cheap
 * (Map.set), never throws, never awaits. No-op for signed-out users at
 * flush time.
 */
export function track(postId: string | null | undefined): void {
  if (!postId) return;
  startOnce();
  buffer.set(postId, (buffer.get(postId) ?? 0) + 1);
}

/** Test-only: force a flush now. Never call from product code. */
export function __flushForTests(): Promise<void> {
  return flush();
}
