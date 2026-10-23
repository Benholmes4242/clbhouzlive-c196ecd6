import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { BoardHeaderRow, BoardRowView } from '@/components/explore-tab-new/courseled/BoardRows';
import { BOARD_LABELS, boardCountsRounds, windowOption, type BoardKey } from '@/components/explore-tab-new/courseled/boardFilters';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import { A, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import type { AmateurBoardState } from '@/features/amateur/useAmateurBoardState';
import { GUTTER, Section, SeeAll } from './Section';
import { useHeldFrame } from '@/components/explore-tab-new/courseled/useHeldFrame';
import { HeldRows } from '@/components/explore-tab-new/courseled/HeldRows';
import { APPLIED_FILL, SELECTED_EDGE } from '@/components/ui/RailChips';

/** CB27: mount state.page and facets.countFor('board', key), never another read.
 * Shared rows own all figures and
 * self treatment. Empty/unsettled reads remove this entire section, controls
 * included. Selection stays in the page's state; scope/window have one owner.
 * Shared header/row anatomy is frozen, not replaced by the standalone mock. */
export const LEADERBOARD_BOARDS = ['recent', 'topar', 'net', 'stableford', 'improved', 'birdies'] as const satisfies readonly BoardKey[];
export type LeaderboardBoard = typeof LEADERBOARD_BOARDS[number];
export const isLeaderboardBoard = (board: BoardKey): board is LeaderboardBoard =>
  LEADERBOARD_BOARDS.some((key) => key === board);

export function LeaderboardsSection({ state, viewerId, onRowPress, onSeeAll }: {
  state: AmateurBoardState;
  viewerId: string | undefined;
  onRowPress: (row: BoardRow) => void;
  onSeeAll: (board: BoardKey) => void;
}) {
  const { t } = useTranslation('courses');
  const board = state.board;
  const settled = state.ready && state.page.isSuccess && !state.page.isFetching;
  const rows = settled ? state.page.data?.rows ?? [] : [];
  /* CB28: a tile tap or scope change holds this same mounted section (and so
   * the same tile-strip node and its scrollLeft) with reserved row height;
   * the selected tile reads state.board, which changes on tap. */
  const frame = useHeldFrame({ active: settled && isLeaderboardBoard(board), pending: isLeaderboardBoard(board) && !settled && !state.page.isError, count: rows.slice(0, 5).length });
  if (frame.mode === 'none' || !isLeaderboardBoard(board)) return null;
  const win = windowOption(state.filters.window);
  return (
    <div data-leaderboards-section style={{ ...FIGS }}>
      <Section contest eyebrow={t('amateur.boards.eyebrow', { defaultValue: 'The boards' })}
        title={t('amateur.boards.title', { defaultValue: 'Leaderboards' })} meta={t(win.i18n, win.label)}>
        <div data-leaderboard-tiles role="radiogroup" aria-label={t('amateur.boards.title', { defaultValue: 'Leaderboards' })}
          style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', willChange: 'transform', marginInline: -GUTTER,
            paddingInline: GUTTER, scrollPaddingInline: GUTTER, marginTop: 2, marginBottom: 15 }}>
          {LEADERBOARD_BOARDS.map((key) => {
            const selected = board === key;
            const count = state.facets.countFor('board', key);
            return <Button key={key} type="button" variant="ghost" role="radio" aria-checked={selected} data-leaderboard-board={key}
              onClick={() => { if (!selected) state.changeBoard(key); }}
              style={{ flexShrink: 0, height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0,
                padding: '7px 11px 8px', borderRadius: 13, boxSizing: 'border-box', fontFamily: SANS, whiteSpace: 'nowrap',
                background: 'transparent', border: `1px solid var(${selected ? '--leaderboard-selected-border' : '--leaderboard-rest-border'})` }}>
              <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', lineHeight: '11px', color: selected ? A.INK : A.MUTE }}>
                {t(BOARD_LABELS[key].i18n, { defaultValue: BOARD_LABELS[key].label })}
              </span>
              <span style={{ marginTop: 3, lineHeight: '15px' }}>
                <span data-board-tile-count style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: selected ? A.INK : A.BODY }}>{count ?? '\u2014'}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, marginLeft: 4, color: selected ? A.MUTE : A.DIM }}>
                  {t(boardCountsRounds(key) ? 'discover.filterBoard.railRounds' : 'discover.filterBoard.railMembers', { count: count ?? 0, defaultValue: boardCountsRounds(key) ? 'rounds' : 'members' }).toLowerCase()}
                </span>
              </span>
            </Button>;
          })}
        </div>
        <BoardHeaderRow board={board} flush />
        {frame.mode === 'hold' ? <HeldRows count={frame.heldCount} rowHeight={frame.rowHeight} /> : <div ref={frame.bodyRef}>
          {rows.slice(0, 5).map((row) => <BoardRowView key={`${row.pos}:${row.whs_score_id ?? row.user_id}`} row={row} board={board}
            isSelf={!!viewerId && row.user_id === viewerId} onPress={onRowPress} flush />)}
        </div>}
        <SeeAll label={t('amateur.leaderboards.seeAllMembers')} onPress={() => onSeeAll(board)} />
      </Section>
    </div>
  );
}