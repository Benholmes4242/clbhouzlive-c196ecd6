/**
 * Impression tracker — Phase 0.
 *
 * Records which posts each signed-in member has seen. READ IN PRODUCTION by
 * get_suggested_feed_v3, where impression_count drives seen_decay (the
 * multiplier applied to every candidate's orbit score). Treat a change here
 * as a change to feed ranking.
 *
 * Contract:
 *  - `track(postId)` adds one in-memory buffer entry per session. No-op if signed out.
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
/* ONE IMPRESSION PER POST PER SESSION. impression_count feeds
   seen_decay in get_suggested_feed_v3, where it means "how many
   times have they seen this" — so a member paging back and forth
   over one post must not read as ten viewings. The guard lives HERE
   rather than at each callsite so every surface shares it: the
   fullscreen viewer's effect re-fires by design, and the feed
   observer below fires on every scroll tick. */
const trackedThisSession = new Set<string>();
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
 * Record an impression for a post. Safe to call from render effects — the
 * session guard makes repeat calls free. Never throws, never awaits. No-op
 * for signed-out users at flush time.
 */
export function track(postId: string | null | undefined): void {
  if (!postId) return;
  if (trackedThisSession.has(postId)) return;
  trackedThisSession.add(postId);
  startOnce();
  buffer.set(postId, 1);
}

/** Test-only: force a flush now. Never call from product code. */
export function __flushForTests(): Promise<void> {
  return flush();
}
