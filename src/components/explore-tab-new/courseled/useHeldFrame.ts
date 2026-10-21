import { useLayoutEffect, useRef } from 'react';

/**
 * CB28 — A FILTER CHANGES WHAT IS UNDER THE HEADING, NOT THE PAGE.
 *
 * Used by StandoutRounds, JustPlayed, CompetitionBoards and LeaderboardsSection; a filter change never unmounts a populated section or carries old rows.
 * A scoped section that was showing rows stays mounted while its own
 * filter-driven read is pending: the head renders as normal and the body is
 * replaced by a neutral placeholder holding the last settled row count at the
 * last measured body height. Old rows are never carried across (no
 * placeholderData — rows follow the Top 100 rule, not the facet-counts rule).
 *
 * - 'rows'  settled with rows: render them; the body is measured after layout.
 * - 'hold'  pending AND rows were showing just before: render the placeholder.
 * - 'none'  never shown, settled empty, failed, or inactive: render nothing,
 *           and forget the held frame so a later first load is a first load.
 */
export type HeldMode = 'rows' | 'hold' | 'none';

/** Used only when no layout was measured (e.g. jsdom). */
const FALLBACK_ROW_H = 56;

export function useHeldFrame({ active, pending, count }: { active: boolean; pending: boolean; count: number }) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const last = useRef({ count: 0, height: 0 });
  const mode: HeldMode = active && !pending && count > 0 ? 'rows'
    : pending && last.current.count > 0 ? 'hold'
    : 'none';
  useLayoutEffect(() => {
    if (mode === 'rows') {
      last.current = { count, height: bodyRef.current?.getBoundingClientRect().height ?? 0 };
    } else if (mode === 'none') {
      last.current = { count: 0, height: 0 };
    }
  });
  const held = last.current;
  const rowHeight = held.count > 0 && held.height > 0 ? held.height / held.count : FALLBACK_ROW_H;
  return { mode, bodyRef, heldCount: held.count, rowHeight };
}
