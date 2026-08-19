import type { QueryClient } from '@tanstack/react-query';

/**
 * One place that knows every query the admin queues read from.
 *
 * The bug this exists to prevent: the verification mutations invalidated
 * ['admin-v2','verifications'] while the Inbox list reads
 * ['admin-v2','inbox',*] and the tab badges read
 * ['admin-v2','dashboard','triage-counts']. The invalidation looked right and
 * refreshed nothing the moderator could see.
 *
 * `refetchType: 'all'` matters: the done-list and the counts are often mounted
 * but inactive, and the default ('active') would leave them stale so the badge
 * and the list disagree.
 */
export async function invalidateAdminQueues(qc: QueryClient, extraKeys: readonly unknown[][] = []) {
  const keys: unknown[][] = [
    ['admin-v2', 'inbox'],
    ['admin-v2', 'verifications'],
    ['admin-v2', 'dashboard', 'triage-counts'],
    ['admin-v2', 'dashboard', 'queue'],
    ...extraKeys.map(k => [...k]),
  ];
  await Promise.all(
    keys.map(queryKey => qc.invalidateQueries({ queryKey, refetchType: 'all' })),
  );
}

const CHANNEL = 'admin-v2-queues';

/** Tell other open admin tabs that a queue changed. */
export function broadcastAdminQueueChange() {
  try {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage({ type: 'queues-changed', at: Date.now() });
    ch.close();
  } catch {
    /* non-fatal: the acting tab already refetched */
  }
}

/** Listen for queue changes from other tabs. Returns an unsubscribe function. */
export function subscribeAdminQueueChanges(onChange: () => void): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = () => onChange();
  } catch {
    return () => {};
  }
  return () => { try { ch?.close(); } catch { /* ignore */ } };
}

/** Refresh locally and notify the other tabs, in that order. */
export async function refreshAdminQueues(qc: QueryClient, extraKeys: readonly unknown[][] = []) {
  await invalidateAdminQueues(qc, extraKeys);
  broadcastAdminQueueChange();
}
