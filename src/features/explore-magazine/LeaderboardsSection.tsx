import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { BoardHeaderRow, BoardRowView } from '@/components/explore-tab-new/courseled/BoardRows';
import { windowOption, type BoardKey } from '@/components/explore-tab-new/courseled/boardFilters';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import { A, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { FIELD_RAISED_REST_BORDER } from '@/lib/tokens/field';
import type { AmateurBoardState } from '@/features/amateur/useAmateurBoardState';
import { Section, SeeAll } from './Section';

/** CB25: mount state.page, never another read. Shared rows own all figures and
 * self treatment. Empty/unsettled reads remove this entire section, controls
 * included. Selection stays in the page's state; scope/window have one owner.
 * Shared header/row anatomy is frozen, not replaced by the standalone mock. */
export const LEADERBOARD_BOARDS = ['net', 'topar', 'stableford', 'birdies'] as const satisfies readonly BoardKey[];
export type LeaderboardBoard = typeof LEADERBOARD_BOARDS[number];
export const isLeaderboardBoard = (board: BoardKey): board is LeaderboardBoard =>
  LEADERBOARD_BOARDS.some((key) => key === board);

const SHORT_LABELS = {
  net: { key: 'amateur.boards.short.net', fallback: 'Net' },
  topar: { key: 'amateur.boards.short.topar', fallback: 'Gross' },
  stableford: { key: 'amateur.boards.short.stableford', fallback: 'Stableford' },
  birdies: { key: 'amateur.boards.short.birdies', fallback: 'Birdies' },
} as const;

export function LeaderboardsSection({ state, viewerId, onRowPress, onSeeAll }: {
  state: AmateurBoardState;
  viewerId: string | undefined;
  onRowPress: (row: BoardRow) => void;
  onSeeAll: (board: BoardKey) => void;
}) {
  const { t } = useTranslation('courses');
  const rows = state.page.data?.rows ?? [];
  const board = state.board;
  if (!state.ready || !state.page.isSuccess || state.page.isFetching || rows.length === 0 || !isLeaderboardBoard(board)) return null;
  const win = windowOption(state.filters.window);
  return (
    <div data-leaderboards-section style={{ ...FIGS }}>
      <Section contest eyebrow={t('amateur.boards.eyebrow', { defaultValue: 'The boards' })}
        title={t('amateur.boards.title', { defaultValue: 'Leaderboards' })} meta={t(win.i18n, win.label)}>
        <div data-leaderboard-pills role="radiogroup" aria-label={t('amateur.boards.title', { defaultValue: 'Leaderboards' })}
          style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', willChange: 'transform', marginBottom: 14 }}>
          {LEADERBOARD_BOARDS.map((key) => {
            const selected = board === key;
            return <Button key={key} type="button" variant="ghost" role="radio" aria-checked={selected} data-leaderboard-board={key}
              onClick={() => { if (!selected) state.changeBoard(key); }}
              style={{ flexShrink: 0, height: 'auto', padding: '8px 14px', borderRadius: 999, fontFamily: SANS,
                fontSize: 12.5, fontWeight: 700, lineHeight: 1.25, letterSpacing: 0, whiteSpace: 'nowrap',
                background: selected ? A.INK : 'transparent', color: selected ? A.CANVAS : A.MUTE,
                border: selected ? 'none' : `1px solid ${FIELD_RAISED_REST_BORDER}` }}>
              {t(SHORT_LABELS[key].key, { defaultValue: SHORT_LABELS[key].fallback })}
            </Button>;
          })}
        </div>
        <BoardHeaderRow board={board} flush />
        {rows.slice(0, 5).map((row) => <BoardRowView key={`${row.pos}:${row.whs_score_id ?? row.user_id}`} row={row} board={board}
          isSelf={!!viewerId && row.user_id === viewerId} onPress={onRowPress} flush />)}
        <SeeAll label={t('amateur.leaderboards.seeAllMembers')} onPress={() => onSeeAll(board)} />
      </Section>
    </div>
  );
}