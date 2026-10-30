/** Confirmation takes the search's own idle lists in priority order. It never
 * reads rounds, invents alternatives, or offers an already-reviewed course. */
import type { PickList, ReviewCourseRow } from '@/features/composer-flow/reviewCourseSearchRules';
export function receiptSuggestions(lists: { recent: ReviewCourseRow[]; threshold: ReviewCourseRow[]; popular: ReviewCourseRow[] } | null | undefined, courseId: string) {
  const out: { row: ReviewCourseRow; list: PickList }[] = [];
  const seen = new Set([courseId]);
  for (const list of ['recent', 'threshold', 'popular'] as const) {
    for (const row of lists?.[list] ?? []) {
      if (seen.has(row.id) || row.mine != null) continue;
      seen.add(row.id); out.push({ row, list });
      if (out.length === 2) return out;
    }
  }
  return out;
}