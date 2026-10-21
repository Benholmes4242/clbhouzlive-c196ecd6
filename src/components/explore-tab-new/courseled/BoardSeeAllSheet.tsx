import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { ExploreSheetShell } from './ExploreSheetShell';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { supabase } from '@/integrations/supabase/client';
import { FIGS, SANS } from './tokens';
import { BOARD_LABELS, boardCountsRounds, isFeatBoard, type BoardFilters, type BoardKey } from './boardFilters';
import { boardRpcArgs, type BoardRow } from './hooks/useBoardPage';
import { BoardDaySeparator, BoardHeaderRow, BoardRowView, boardColumns } from './BoardRows';
import { dayLadder } from './discoverWhen';

/**
 * SEE ALL (BRIEF_DISCOVER_FILTER_LED_BOARD S5.1).
 *
 * THE SAME RPC, PAGED. The board renders the first ten places, with a tie at
 * the cut kept whole, from
 * get_board_page; this sheet pages the SAME call with p_offset, so positions
 * continue rather than restart and the sheet can never disagree with the board
 * about who is fourth.
 *
 * A NEW SURFACE, DELIBERATELY. The retired rounds see-all sheet is a
 * date-grouped list of ROUND CARDS with its own scope pills — a different
 * question with different anatomy, and S9 forbids reworking its internals. This
 * sheet is the board, continued.
 */

const PAGE = 50;

export interface BoardSeeAllSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  board: BoardKey;
  filters: BoardFilters;
  /** The applied-filter parts, preserving the page's JSX separator treatment. */
  appliedParts: string[];
  /** The surface's own title. */
  title?: string;
  onRowPress?: (row: BoardRow) => void;
}

export function BoardSeeAllSheet({
  open,
  onClose,
  userId,
  board,
  filters,
  appliedParts,
  title,
  onRowPress,
}: BoardSeeAllSheetProps) {
  const { t, i18n } = useTranslation('courses');
  const args = boardRpcArgs(userId, board, filters);

  const query = useInfiniteQuery({
    queryKey: ['discover', 'board-see-all', args],
    enabled: open,
    staleTime: 60_000,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('get_board_page' as never, {
        ...args,
        p_limit: PAGE,
        p_offset: pageParam as number,
      } as never);
      if (error) throw error;
      return ((data ?? []) as unknown) as BoardRow[];
    },
    getNextPageParam: (last, all) =>
      last.length < PAGE ? undefined : all.reduce((n, p) => n + p.length, 0),
  });

  const rows = useMemo(() => (query.data?.pages ?? []).flat(), [query.data]);
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  /* Phase 9.8 — THE DAY LADDER, FEED GRAMMAR ONLY. The recent board and the
     four feat boards are date orders and group under the same ladder the lead
     board uses (Today / Yesterday / This week / Last week / Month). Ranked
     boards are flat: their order is the rank, and a date header would cut it.
     This replaces the earlier window-dependent day/month grouping. */
  const grouped = !boardColumns(board).ranked && rows.length > 0;
  const groups = useMemo(() => {
    if (!grouped) return null;
    const out: { key: string; label: string; rows: BoardRow[] }[] = [];
    for (const r of rows) {
      const { key, label } = dayLadder(r.play_date, t as never, i18n?.language);
      const last = out[out.length - 1];
      if (last && last.key === key) last.rows.push(r);
      else out.push({ key, label, rows: [r] });
    }
    return out;
  }, [grouped, rows, t, i18n?.language]);
  // The shared cap subtitle counts rounds, not feat-specific headline copy.
  const count = t(isFeatBoard(board) || boardCountsRounds(board)
    ? 'discover.filterBoard.nRounds' : 'discover.filterBoard.nMembers', { count: total });

  return (
    <ExploreSheetShell
      open={open}
      onClose={onClose}
      titleId="board-see-all-title"
      title={title ?? t(BOARD_LABELS[board].i18n)}
      subtitle={[...appliedParts, count].join(' · ')}
      columns={<div style={{ flexShrink: 0, paddingTop: 10, fontFamily: SANS, ...FIGS }}><BoardHeaderRow board={board} sheet /></div>}
      bodyPadding="0 0 calc(env(safe-area-inset-bottom, 0px) + 24px)"
    >
      <div
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          willChange: 'transform',
          fontFamily: SANS,
          ...FIGS,
        }}
      >
        {groups
          ? groups.map((g, gi) => (
              <div key={`${g.key}:${gi}`}>
                <BoardDaySeparator label={`${g.label} \u00B7 ${t('discover.filterBoard.nRounds', { count: g.rows.length })}`} />
                {g.rows.map((r) => (
                  <BoardRowView
                    key={`${r.pos}:${r.whs_score_id ?? r.user_id}`}
                    row={r}
                    board={board}
                    isSelf={!!userId && r.user_id === userId}
                    onPress={onRowPress}
                  />
                ))}
              </div>
            ))
          : rows.map((r) => (
              <BoardRowView
                key={`${r.pos}:${r.whs_score_id ?? r.user_id}`}
                row={r}
                board={board}
                isSelf={!!userId && r.user_id === userId}
                onPress={onRowPress}
              />
            ))}
        {query.hasNextPage && (
          <button
            type="button"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            style={{
              width: '100%',
              padding: '14px 0',
              background: 'transparent',
              border: 'none',
              fontFamily: SANS,
              ...KICKER,
              color: A.MUTE,
              cursor: 'pointer',
            }}
          >
            {query.isFetchingNextPage
              ? t('discover.filterBoard.loading')
              : t('discover.filterBoard.loadMore')}
          </button>
        )}
      </div>
    </ExploreSheetShell>
  );
}

export default BoardSeeAllSheet;

