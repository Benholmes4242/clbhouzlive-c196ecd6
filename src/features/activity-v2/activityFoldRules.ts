/** AC2 owns fold grouping, the Best line and open ordering. Row presentation
 * stays with LedgerRow/ActivityRoundContent; no reads happen here. Feed order
 * is newest-first, so index 0 is "the newest". */
import { activityRoundId, type ActivityRoundSummary } from './hooks/useActivityRoundSummaries';
import type { ActivityFeedRowV2 } from './hooks/useActivityFeedV2';
import { shortCourseName } from '@/lib/courses/shortCourseName';

export type FoldSegment =
  | { kind: 'row'; row: ActivityFeedRowV2 }
  | { kind: 'fold'; rows: ActivityFeedRowV2[] };

/** Read round rows only — unread rounds never fold (AC2 §1). */
export function foldableRounds(rows: ActivityFeedRowV2[], foldEnabled: boolean): ActivityFeedRowV2[] {
  if (!foldEnabled) return [];
  return rows.filter((r) => r.is_read && activityRoundId(r) !== null);
}

/** 3+ foldable rounds collapse into one segment at the newest's position;
 * every other row keeps its place. */
export function segmentRows(rows: ActivityFeedRowV2[], foldEnabled: boolean): FoldSegment[] {
  const fold = foldableRounds(rows, foldEnabled);
  if (fold.length < 3) return rows.map((row) => ({ kind: 'row', row }));
  const ids = new Set(fold.map((r) => r.notif_id));
  const newestId = fold[0].notif_id;
  const out: FoldSegment[] = [];
  for (const row of rows) {
    if (!ids.has(row.notif_id)) {
      out.push({ kind: 'row', row });
      continue;
    }
    if (row.notif_id === newestId) out.push({ kind: 'fold', rows: fold });
  }
  return out;
}

/** Stable identity for one fold: the section label plus its newest round, so
 * open state survives a refetch that returns the same section. */
export function foldKey(sectionLabel: string, rows: ActivityFeedRowV2[]): string {
  return `${sectionLabel}:${rows[0]?.notif_id ?? ''}`;
}

export interface BestRound {
  name: string;
  gross: number;
  course: string;
}

/** Lowest to_par among 18-hole rounds that have a summary; ties keep the
 * newer round. Null when no folded round has an 18-hole summary. */
export function bestRoundLine(
  rows: ActivityFeedRowV2[],
  summaries: Map<string, ActivityRoundSummary>,
): BestRound | null {
  let best: { row: ActivityFeedRowV2; summary: ActivityRoundSummary } | null = null;
  for (const row of rows) {
    const id = activityRoundId(row);
    const summary = id ? summaries.get(id) : undefined;
    if (!summary || summary.holes_played !== 18) continue;
    if (!best || summary.to_par < best.summary.to_par) best = { row, summary };
  }
  if (!best) return null;
  return {
    name: best.row.actor_display_name ?? best.row.actor_username ?? 'Someone',
    gross: best.summary.gross,
    course: shortCourseName(best.summary.course_name),
  };
}

/** Open order: rounds with a summary by to_par ascending (ties newest-first),
 * then rounds without a summary, newest first among those. */
export function openOrder(
  rows: ActivityFeedRowV2[],
  summaries: Map<string, ActivityRoundSummary>,
): ActivityFeedRowV2[] {
  const ready: { row: ActivityFeedRowV2; toPar: number; index: number }[] = [];
  const notReady: ActivityFeedRowV2[] = [];
  rows.forEach((row, index) => {
    const id = activityRoundId(row);
    const summary = id ? summaries.get(id) : undefined;
    if (summary) ready.push({ row, toPar: summary.to_par, index });
    else notReady.push(row);
  });
  ready.sort((a, b) => a.toPar - b.toPar || a.index - b.index);
  return [...ready.map((r) => r.row), ...notReady];
}
