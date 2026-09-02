import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { supabase } from '@/integrations/supabase/client';
import { FIGS, SANS } from './tokens';
import { BOARD_LABELS, boardCountsRounds, type BoardFilters, type BoardKey } from './boardFilters';
import { boardRpcArgs, type BoardRow } from './hooks/useBoardPage';
import { BoardHeaderRow, BoardRowView } from './BoardRows';

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
  onRowPress?: (row: BoardRow) => void;
}

export function BoardSeeAllSheet({
  open,
  onClose,
  userId,
  board,
  filters,
  appliedParts,
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
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="dark"
      surfaceColor={A.CANVAS}
      maxHeight="95dvh"
      ariaLabelledBy="board-see-all-title"
      style={{ height: '95dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}
    >
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 16px 12px',
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <h2
          id="board-see-all-title"
          style={{ ...KICKER, margin: 0, color: A.INK }}
        >
          {t(BOARD_LABELS[board].i18n, BOARD_LABELS[board].label)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          style={{ ...KICKER, padding: '8px 0', background: 'transparent', border: 'none', fontFamily: SANS, color: A.INK, cursor: 'pointer' }}
        >
          {t('discover.filterBoard.done', 'Done')}
        </button>
      </div>
      <div style={{ flexShrink: 0, padding: '16px 16px 12px', borderBottom: `1px solid ${A.BORDER}`, fontFamily: SANS, ...FIGS }}>
        <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: A.INK, textTransform: 'uppercase' }}>
          {boardCountsRounds(board)
            ? t('discover.filterBoard.nRounds', '{{count}} rounds', { count: total })
            : t('discover.filterBoard.nMembers', '{{count}} members', { count: total })}
        </div>
        <div style={{ ...KICKER, marginTop: 6, color: A.MUTE }}>
          {appliedParts.map((part, index) => (
            <span key={`${part}:${index}`}>{index > 0 ? <> {'\u00B7'} </> : null}{part}</span>
          ))}
        </div>
      </div>
      <div style={{ flexShrink: 0, padding: '8px 16px 0', fontFamily: SANS, ...FIGS }}>
        <BoardHeaderRow board={board} />
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          willChange: 'transform',
          padding: '0 16px calc(env(safe-area-inset-bottom, 0px) + 24px)',
          fontFamily: SANS,
          ...FIGS,
        }}
      >
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
              ...KICKER,
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
    </BottomSheet>
  );
}

export default BoardSeeAllSheet;
