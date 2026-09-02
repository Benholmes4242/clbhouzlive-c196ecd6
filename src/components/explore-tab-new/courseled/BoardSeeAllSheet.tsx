import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { supabase } from '@/integrations/supabase/client';
import { A, FIGS, SANS } from './tokens';
import { BOARD_LABELS, boardCountsRounds, type BoardFilters, type BoardKey } from './boardFilters';
import { boardRpcArgs, type BoardRow } from './hooks/useBoardPage';
import { BoardHeaderRow, BoardRowView } from './BoardRows';

/**
 * SEE ALL (BRIEF_DISCOVER_FILTER_LED_BOARD S5.1).
 *
 * THE SAME RPC, PAGED. The board renders the first twenty rows of
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
  /** The applied-filter line, verbatim from the board (S5.2). */
  appliedLine: string;
  onRowPress?: (row: BoardRow) => void;
}

export function BoardSeeAllSheet({
  open,
  onClose,
  userId,
  board,
  filters,
  appliedLine,
  onRowPress,
}: BoardSeeAllSheetProps) {
  const { t } = useTranslation('courses');
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

  return (
    <BottomSheet open={open} onClose={onClose} variant="dark" ariaLabelledBy="board-see-all-title">
      <SheetHeader
        dark
        eyebrow={t(BOARD_LABELS[board].i18n, BOARD_LABELS[board].label)}
        title={
          <span id="board-see-all-title">
            {boardCountsRounds(board)
              ? t('discover.filterBoard.nRounds', '{{count}} rounds', { count: total })
              : t('discover.filterBoard.nMembers', '{{count}} members', { count: total })}
          </span>
        }
        sub={appliedLine}
        onClose={onClose}
      />
      <div style={{ padding: '8px 16px 0', fontFamily: SANS, ...FIGS }}>
        <BoardHeaderRow board={board} />
        {rows.map((r) => (
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
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: A.MUTE,
              cursor: 'pointer',
            }}
          >
            {query.isFetchingNextPage
              ? t('discover.filterBoard.loading', 'Loading')
              : t('discover.filterBoard.loadMore', 'Load more')}
          </button>
        )}
      </div>
      <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} />
    </BottomSheet>
  );
}

export default BoardSeeAllSheet;
