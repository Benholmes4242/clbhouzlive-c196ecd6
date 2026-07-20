import { useMemo } from 'react';
import type { ModerationQueueRow } from './useModerationQueue';
import type { AppealRow } from './useAppeals';
import type { VerificationRow } from './useVerifications';
import type { InboxItem } from './useInboxFeed';

const WEEK_MS = 7 * 86_400_000;

/**
 * C4-6: Inbox ops strip - resolved this week + median time-to-resolution.
 *
 * Only sources that expose a resolved timestamp AND the original created_at
 * contribute to the duration. Sources without them (support, matches,
 * courseRequest, approval) are counted toward "resolved this week" only when
 * they carry a reviewed timestamp on their payload; otherwise excluded from
 * the ops strip entirely. The rule: never fabricate a duration.
 *
 * Duration-eligible types:
 *   - report        (moderation): payload.reviewed_at + payload.created_at
 *   - appeal        payload.reviewed_at + payload.created_at
 *   - verification  payload.reviewedAt  + payload.createdAt
 */
export function useInboxOpsStats(doneItems: InboxItem[]) {
  return useMemo(() => {
    const sinceWeek = Date.now() - WEEK_MS;
    const durationsMs: number[] = [];
    let resolvedThisWeek = 0;

    for (const it of doneItems) {
      if (it.type === 'report') {
        const row = it.payload as ModerationQueueRow;
        const start = row.created_at ? new Date(row.created_at).getTime() : null;
        const end = row.reviewed_at ? new Date(row.reviewed_at).getTime() : null;
        if (end != null && end >= sinceWeek) resolvedThisWeek += 1;
        if (start != null && end != null && end >= start) durationsMs.push(end - start);
      } else if (it.type === 'appeal') {
        const row = it.payload as AppealRow;
        const start = row.created_at ? new Date(row.created_at).getTime() : null;
        const end = row.reviewed_at ? new Date(row.reviewed_at).getTime() : null;
        if (end != null && end >= sinceWeek) resolvedThisWeek += 1;
        if (start != null && end != null && end >= start) durationsMs.push(end - start);
      } else if (it.type === 'verification') {
        const row = it.payload as VerificationRow;
        const start = row.createdAt ? new Date(row.createdAt).getTime() : null;
        const end = row.reviewedAt ? new Date(row.reviewedAt).getTime() : null;
        if (end != null && end >= sinceWeek) resolvedThisWeek += 1;
        if (start != null && end != null && end >= start) durationsMs.push(end - start);
      }
      // Other types (support/match/courseRequest/approval): no authoritative
      // resolved timestamp on the payload - excluded per no-fabrication rule.
    }

    let medianMs: number | null = null;
    if (durationsMs.length) {
      const sorted = [...durationsMs].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianMs = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    }

    return { resolvedThisWeek, medianMs, sampleSize: durationsMs.length };
  }, [doneItems]);
}

export function formatDurationShort(ms: number): string {
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}
