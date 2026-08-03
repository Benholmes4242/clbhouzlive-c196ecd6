import type { WhsConnection } from './types';

/**
 * SINGLE SOURCE OF TRUTH for "is this connection unhealthy, and what should we
 * tell the member". Hoisted out of HandicapDashboard / HandicapManagePage /
 * the reauth screen so the three cannot drift apart.
 *
 * RULE: branch on last_sync_status ONLY. last_sync_error is free text written
 * by sync-whs-due and must never drive a branch - it may be shown as truncated
 * secondary detail and nothing more.
 *
 * The status domain written by sync-whs-due/markFailure is exactly:
 *   ok | auth_failed | rate_limited | transient_error | unknown_error
 */

export const STALE_MS = 48 * 3600_000;

/** consecutive_failures threshold for the auth variant. */
export const AUTH_FAILURE_THRESHOLD = 2;

/** Max characters of last_sync_error we are willing to surface. */
export const SYNC_ERROR_MAX_CHARS = 120;

export type SyncHealthKind =
  /** Healthy, or not yet stale enough to say anything. */
  | 'ok'
  /** VARIANT A - England Golf is rejecting the stored credentials. Actionable. */
  | 'reauth_auth'
  /** VARIANT B - we cannot reach England Golf. NOT actionable. */
  | 'reauth_unreachable';

export interface SyncHealth {
  kind: SyncHealthKind;
  /** True for either reauth variant - use to gate the screen / banner. */
  needsAttention: boolean;
  /** True ONLY for variant A. Variant B must render no action. */
  actionable: boolean;
  /** Whole days since last successful sync, or null when never synced. */
  daysSinceSync: number | null;
  /** Last successful sync as a Date, or null when never synced. */
  lastSyncedAt: Date | null;
  /** Untrusted free text, trimmed and truncated. Display detail only. */
  detail: string | null;
}

const truncateDetail = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.length <= SYNC_ERROR_MAX_CHARS) return s;
  // \u2026 = horizontal ellipsis, rendered only - never a literal char in source.
  return `${s.slice(0, SYNC_ERROR_MAX_CHARS - 1).trimEnd()}\u2026`;
};

export function getSyncHealth(
  connection: Pick<
    WhsConnection,
    'last_sync_status' | 'last_synced_at' | 'consecutive_failures' | 'last_sync_error'
  >,

  now: number = Date.now(),
): SyncHealth {
  const lastSyncedAt = connection.last_synced_at
    ? new Date(connection.last_synced_at)
    : null;
  const elapsed = lastSyncedAt ? now - lastSyncedAt.getTime() : Infinity;
  const isStale = elapsed > STALE_MS;
  const daysSinceSync = lastSyncedAt
    ? Math.max(0, Math.floor(elapsed / 86_400_000))
    : null;
  const status = connection.last_sync_status ?? null;
  const failures = connection.consecutive_failures ?? 0;
  const detail = truncateDetail(connection.last_sync_error);

  const base = { daysSinceSync, lastSyncedAt, detail };

  // VARIANT A - status is the only branch. Re-entering the password can help.
  if (status === 'auth_failed' && failures >= AUTH_FAILURE_THRESHOLD) {
    return { ...base, kind: 'reauth_auth', needsAttention: true, actionable: true };
  }

  // VARIANT B - any other non-ok status, once we have been dark for 48h.
  // Nothing for the member to do, so we must not imply there is.
  if (status !== null && status !== 'ok' && isStale) {
    return {
      ...base,
      kind: 'reauth_unreachable',
      needsAttention: true,
      actionable: false,
    };
  }

  return { ...base, kind: 'ok', needsAttention: false, actionable: false };
}
