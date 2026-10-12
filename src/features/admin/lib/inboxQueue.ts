import type { InboxItem, InboxType } from '../hooks/useInboxFeed';
import type { UnmatchedCourseRow } from '../hooks/useUnmatchedCourses';

/**
 * BRIEF_INBOX_WORK_THE_QUEUE 2.2-2.4: the Inbox's ordering and summary rules.
 * Pure so they can be tested without rendering the page.
 */

/** Chip labels (2.3). */
export const QUEUE_SHORT: Record<InboxType, string> = {
  unmatchedCourse: 'Unmatched',
  courseRequest: 'Requests',
  support: 'Support',
  verification: 'Claims',
  report: 'Reports',
  appeal: 'Appeals',
  match: 'Matches',
  holePhoto: 'Photos',
  approval: 'Approvals',
};

/** Row tags (2.4). */
export const QUEUE_TAG: Record<InboxType, string> = {
  unmatchedCourse: 'Unmatched',
  courseRequest: 'Request',
  support: 'Support',
  verification: 'Claim',
  report: 'Report',
  appeal: 'Appeal',
  match: 'Match',
  holePhoto: 'Photo',
  approval: 'Approval',
};

/** An age at or past this many days reads as danger. */
export const LONG_WAIT_DAYS = 14;

export function ageDays(iso: string, now = Date.now()): number {
  const ms = now - new Date(iso).getTime();
  return Number.isFinite(ms) ? Math.max(0, ms / 86_400_000) : 0;
}

export const isLongWait = (iso: string, now = Date.now()) => ageDays(iso, now) >= LONG_WAIT_DAYS;

/**
 * Members waiting on this item: an unmatched course counts its members, a
 * high-priority report counts 2, everything else counts 1.
 */
export function membersAffected(item: InboxItem): number {
  if (item.type === 'unmatchedCourse') return (item.payload as UnmatchedCourseRow).member_count ?? 0;
  if (item.type === 'report' && item.isHighPriority) return 2;
  return 1;
}

/** Members affected desc, then longest wait (createdAt asc). */
export function orderOpenItems(items: InboxItem[]): InboxItem[] {
  return [...items].sort((a, b) => {
    const m = membersAffected(b) - membersAffected(a);
    if (m !== 0) return m;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export interface QueueSummary {
  type: InboxType;
  count: number;
  members: number;
  oldestIso: string;
}

/** One summary per NON-EMPTY queue, members affected desc then oldest first. */
export function summariseQueues(items: InboxItem[]): QueueSummary[] {
  const by = new Map<InboxType, QueueSummary>();
  for (const it of items) {
    const s = by.get(it.type);
    if (!s) {
      by.set(it.type, { type: it.type, count: 1, members: membersAffected(it), oldestIso: it.createdAt });
    } else {
      s.count += 1;
      s.members += membersAffected(it);
      if (new Date(it.createdAt) < new Date(s.oldestIso)) s.oldestIso = it.createdAt;
    }
  }
  return [...by.values()].sort((a, b) => {
    if (b.members !== a.members) return b.members - a.members;
    return new Date(a.oldestIso).getTime() - new Date(b.oldestIso).getTime();
  });
}

export function totalMembers(items: InboxItem[]): number {
  return items.reduce((n, it) => n + membersAffected(it), 0);
}

export function oldestItem(items: InboxItem[]): InboxItem | null {
  let out: InboxItem | null = null;
  for (const it of items) if (!out || new Date(it.createdAt) < new Date(out.createdAt)) out = it;
  return out;
}

/** "93d" / "31h" / "44m": whole units, never rounded up. */
export function ageLabel(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (!Number.isFinite(mins)) return '\u2014';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
