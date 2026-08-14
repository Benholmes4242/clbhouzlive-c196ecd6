/**
 * Member segment predicates — the SINGLE source of truth for how the admin
 * console partitions users into segments. Consumed by:
 *   - useUsers (Members roster filter chips + counts)
 *   - useAudiences (Analytics > Growth > Audiences cards)
 *
 * The Members chip filter and the Audiences card MUST resolve to the same
 * set for a given segment. To keep that guarantee, both consumers import
 * from this file — DO NOT re-implement any of these predicates inline.
 */

export type SegmentSlug =
  | 'new_this_week'
  | 'active_24h'
  | 'dormant_14d'
  | 'eg_linked'
  | 'eg_issues'
  | 'suspended'
  | 'connected'
  | 'not_connected';

/** Statuses on `whs_connections.last_sync_status` that mean "EG is broken". */
export const EG_AUTH_FAILED_STATUSES = ['auth_failed'] as const;

/** Cutoff for "new this week": created within the last 7 days. */
export function newThisWeekCutoffMs(now = Date.now()): number {
  return now - 7 * 86400_000;
}

/** Cutoff for "dormant 14d+": last activity before this ms is dormant. */
export function dormantCutoffMs(now = Date.now()): number {
  return now - 14 * 86400_000;
}

/** Cutoff for "active 24h": events after this ms count as active. */
export function active24hCutoffMs(now = Date.now()): number {
  return now - 24 * 3600_000;
}

export interface UserSegmentInputs {
  created_at: string;
  last_seen_at: string | null;
  is_suspended: boolean;
  id: string;
}

export function isNewThisWeek(u: UserSegmentInputs, now = Date.now()): boolean {
  return new Date(u.created_at).getTime() >= newThisWeekCutoffMs(now);
}

/**
 * Dormant 14d+ = no analytics event in the past 14 days.
 * `last_seen_at` is null when there was no event in the lookback window,
 * which is exactly the dormant condition.
 */
export function isDormant14dPlus(u: UserSegmentInputs, now = Date.now()): boolean {
  if (!u.last_seen_at) return true;
  return new Date(u.last_seen_at).getTime() < dormantCutoffMs(now);
}

export function isSuspended(u: UserSegmentInputs): boolean {
  return u.is_suspended === true;
}

/** Factory-style predicates against pre-fetched id sets. */
export function isActive24h(u: UserSegmentInputs, activeIds: ReadonlySet<string>): boolean {
  return activeIds.has(u.id);
}
export function hasEgIssue(u: UserSegmentInputs, egIssueIds: ReadonlySet<string>): boolean {
  return egIssueIds.has(u.id);
}

/**
 * Handicap connection = a live `whs_connections` row, whatever its sync status.
 * The two predicates are exact complements over the same id set, so
 * connected + not_connected always sums to the member total.
 */
export function isConnected(u: UserSegmentInputs, connectedIds: ReadonlySet<string>): boolean {
  return connectedIds.has(u.id);
}
export function isNotConnected(u: UserSegmentInputs, connectedIds: ReadonlySet<string>): boolean {
  return !connectedIds.has(u.id);
}

/**
 * Members-page URL filter slugs kept in sync with UserFilterStatus. Exported
 * so Audiences cards can navigate to the roster with the matching filter.
 * `eg_linked` has NO Members filter today (display-only card).
 */
export const SEGMENT_TO_MEMBERS_FILTER: Record<Exclude<SegmentSlug, 'eg_linked'>, string> = {
  new_this_week: 'new_this_week',
  connected:     'connected',
  not_connected: 'not_connected',
  active_24h:    'active_24h',
  dormant_14d:   'dormant_14d',
  eg_issues:     'eg_issues',
  suspended:     'suspended',
};
